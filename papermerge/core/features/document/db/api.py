import math
import io
import logging
import os
from os.path import getsize
import uuid
import tempfile
from pathlib import Path
from typing import Tuple, Sequence, Any, Optional, Dict

import img2pdf
from pikepdf import Pdf
from sqlalchemy import (
    delete,
    func,
    select,
    update,
    distinct,
    Select,
    and_,
    or_,
    case
)
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import joinedload, selectinload, aliased
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.utils.tz import utc_now
from papermerge.core.db.common import (
    get_shared_root_for_user,
    truncate_breadcrumb_at_shared_root,
    get_breadcrumb_root_type,
)
from papermerge.core.schemas.common import Breadcrumb
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.types import OwnerType, ResourceType, ImagePreviewStatus, \
    MimeType
from papermerge.core.features.document import s3
from papermerge.core import schema, orm
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.document.schema import Category, Tag
from papermerge.core.features.custom_fields import schema as cf_schema
from papermerge.core.features.custom_fields.cf_types.registry import \
    TypeRegistry
from papermerge.core.db.common import get_ancestors, get_node_owner
from papermerge.core import types
from papermerge.core import config

settings = config.get_settings()
logger = logging.getLogger(__name__)


async def load_doc(db_session: AsyncSession, doc_id: uuid.UUID) -> orm.Document:
    stmt = select(orm.Document).options(
        selectinload(orm.Document.tags),
        selectinload(orm.Document.versions).selectinload(orm.DocumentVersion.pages)
    ).where(orm.Document.id == doc_id)

    result = await db_session.execute(stmt)
    return result.scalar_one()


async def count_docs(session: AsyncSession) -> int:
    stmt = select(func.count()).select_from(orm.Document)

    result = await session.scalars(stmt)

    return result.one()


async def get_documents(
    db_session: AsyncSession,
    *,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filters: Optional[Dict[str, Dict[str, Any]]] = None,
) -> schema.PaginatedResponse[schema.FlatDocument]:
    """
    Get paginated list of documents with tags, category, ownership, and audit info.

    Args:
        db_session: Database session
        user_id: ID of the user requesting documents
        page_size: Number of items per page
        page_number: Page number (1-based)
        sort_by: Column to sort by
        sort_direction: Sort direction ('asc' or 'desc')
        filters: Dictionary of filters to apply

    Returns:
        PaginatedResponse containing FlatDocument items
    """

    # Create aliases for user and group tables
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    category = aliased(orm.DocumentType, name="category")

    # Subquery to get user's group memberships
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id,
        orm.UserGroup.deleted_at.is_(None)
    )

    # Build base query with all necessary joins
    base_query = (
        select(orm.Document)
        .join(created_user, orm.Document.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Document.updated_by == updated_user.id, isouter=True)
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.NODE.value,
                orm.Ownership.resource_id == orm.Document.id
            )
        )
        .join(
            owner_user,
            and_(
                orm.Ownership.owner_type == OwnerType.USER,
                orm.Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        .join(
            owner_group,
            and_(
                orm.Ownership.owner_type == OwnerType.GROUP,
                orm.Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
        .join(
            category,
            orm.Document.document_type_id == category.id,
            isouter=True
        )
        .options(selectinload(orm.Document.tags))
    )

    # Build access control condition
    access_control_condition = or_(
        and_(
            orm.Ownership.owner_type == OwnerType.USER,
            orm.Ownership.owner_id == user_id
        ),
        and_(
            orm.Ownership.owner_type == OwnerType.GROUP,
            orm.Ownership.owner_id.in_(user_groups_subquery)
        )
    )

    # Build where conditions
    where_conditions = [access_control_condition]
    where_conditions.append(orm.Document.deleted_at.is_(None))

    # Apply custom filters if provided
    if filters:
        filter_conditions = _build_document_filter_conditions(
            filters, created_user, updated_user
        )
        where_conditions.extend(filter_conditions)

    base_query = base_query.where(and_(*where_conditions))

    # Build optimized count query (without unnecessary joins)
    count_query = (
        select(func.count(orm.Document.id))
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.NODE.value,
                orm.Ownership.resource_id == orm.Document.id
            )
        )
        .where(and_(*where_conditions))
    )

    try:
        total_documents = (await db_session.execute(count_query)).scalar()
    except Exception as e:
        logger.error(f"Error counting documents for user {user_id}: {e}", exc_info=True)
        raise

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_document_sorting(
            base_query,
            sort_by,
            sort_direction,
            created_user=created_user,
            updated_user=updated_user,
            owner_user=owner_user,
            owner_group=owner_group,
            category=category
        )
    else:
        # Default sorting by title ascending
        base_query = base_query.order_by(orm.Document.title.asc())

    # Apply pagination
    offset = page_size * (page_number - 1)
    paginated_query = (
        base_query
        .add_columns(
            # Ownership info
            orm.Ownership.owner_type.label('owner_type'),
            orm.Ownership.owner_id.label('owner_id'),
            # Owner group info
            owner_group.id.label('owner_group_id'),
            owner_group.name.label('owner_group_name'),
            # Owner user info
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            # Created by user
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            # Updated by user
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username'),
            # Category
            category.id.label("category_id"),
            category.name.label("category_name"),
            orm.Document.created_at.label("created_at"),
            orm.Document.updated_at.label("updated_at")
        )
        .limit(page_size)
        .offset(offset)
    )

    try:
        results = (await db_session.execute(paginated_query)).all()
    except Exception as e:
        logger.error(f"Error fetching documents for user {user_id}: {e}", exc_info=True)
        raise

    # Build FlatDocument items from results
    items = []

    for row in results:
        document = row[0]

        # Build owned_by
        if row.owner_type == OwnerType.USER:
            owned_by = schema.OwnedBy(
                id=row.owner_user_id,
                name=row.owner_username,
                type=OwnerType.USER
            )
        elif row.owner_type == OwnerType.GROUP:
            owned_by = schema.OwnedBy(
                id=row.owner_group_id,
                name=row.owner_group_name,
                type=OwnerType.GROUP
            )
        else:
            # Shouldn't happen, but handle gracefully
            logger.warning(f"Document {document.id} has unknown owner_type: {row.owner_type}")
            continue

        # Build created_by
        created_by = None
        if row.created_by_id:
            created_by = schema.ByUser(
                id=row.created_by_id,
                username=row.created_by_username
            )

        # Build updated_by
        updated_by = None
        if row.updated_by_id:
            updated_by = schema.ByUser(
                id=row.updated_by_id,
                username=row.updated_by_username
            )

        # Build category
        category_obj = None
        if row.category_id:
            category_obj = Category(
                id=row.category_id,
                name=row.category_name
            )

        # Build tags list from the document's tags relationship
        # Tags are already loaded via selectinload, so no additional query
        tags = []
        for tag in document.tags:
            tags.append(Tag(
                id=tag.id,
                name=tag.name,
                fg_color=tag.fg_color or "#FFFFFF",  # Default foreground color
                bg_color=tag.bg_color or "#c41fff"  # Default background color
            ))

        # Create FlatDocument instance
        document_data = {
            "id": document.id,
            "title": document.title,
            "owned_by": owned_by,
            "created_by": created_by,
            "created_at": row.created_at,
            "updated_by": updated_by,
            "updated_at": row.updated_at,
            "category": category_obj,
            "tags": tags
        }

        items.append(schema.FlatDocument(**document_data))

    # Calculate total pages
    total_pages = math.ceil(total_documents / page_size) if total_documents > 0 else 0

    return schema.PaginatedResponse[schema.FlatDocument](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages,
        total_items=total_documents
    )


async def update_doc_type(
    session: AsyncSession,
    *,
    document_id: uuid.UUID,
    document_type_id: uuid.UUID | None,
):
    stmt = select(orm.Document).where(
        orm.Document.id == document_id
    )
    result = await session.scalars(stmt)
    doc = result.one()
    if doc.document_type_id != document_type_id:
        # new value for document type
        doc.document_type_id = document_type_id
        # -> clear existing CFV
        del_stmt = delete(orm.CustomFieldValue).where(
            orm.CustomFieldValue.document_id == document_id
        )
        await session.execute(del_stmt)

    await session.commit()


async def get_docs_count_by_type(session: AsyncSession, type_id: uuid.UUID):
    """Returns number of documents of specific document type"""
    stmt = (
        select(func.count())
        .select_from(orm.Document)
        .where(orm.Document.document_type_id == type_id)
    )

    result = await session.scalars(stmt)
    return result.one()


async def get_documents_by_type_paginated(
    session: AsyncSession,
    document_type_id: uuid.UUID,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
) -> schema.PaginatedResponse[schema.DocumentCFV]:
    """
    Get paginated documents of a specific type with custom field values

    Returns:
        PaginatedResponse with DocumentCFV items
    """


    # Calculate limit and offset
    limit = page_size
    offset = (page_number - 1) * page_size

    # Prepare sort parameter if needed
    sort_param = None
    if sort_by and sort_direction:
        # Get the custom field by name to get its ID
        stmt = select(orm.CustomField).join(
            orm.DocumentTypeCustomField,
            orm.DocumentTypeCustomField.custom_field_id == orm.CustomField.id
        ).where(
            and_(
                orm.DocumentTypeCustomField.document_type_id == document_type_id,
                orm.CustomField.name == sort_by
            )
        )
        field_result = await session.execute(stmt)
        sort_field = field_result.scalar_one_or_none()

        if sort_field:
            sort_param = cf_schema.CustomFieldSort(
                field_id=sort_field.id,
                direction=sort_direction
            )

    fields, rows = await cf_dbapi.get_document_table_data(
        session,
        document_type_id=document_type_id,
        user_id=user_id,
        sort=sort_param,
        limit=limit,
        offset=offset
    )

    # Transform rows to DocumentCFV format
    items = []
    for row in rows:
        custom_fields_list = []
        for field in fields:
            field_key = f'field_{field.id}'
            cfv = row.get(field_key)
            custom_fields_list.append(schema.CustomFieldRow(
                custom_field=field,
                custom_field_value=cfv
            ))

        # Build created_by info
        created_by = None
        if row.get('created_by_id'):
            created_by = schema.ByUser(
                id=row['created_by_id'],
                username=row['created_by_username']
            )

        # Build updated_by info
        updated_by = None
        if row.get('updated_by_id'):
            updated_by = schema.ByUser(
                id=row['updated_by_id'],
                username=row['updated_by_username']
            )

        doc_cfv = schema.DocumentCFV(
            id=row['document_id'],
            title=row.get('document_title', ''),
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            created_by=created_by,
            updated_by=updated_by,
            document_type_id=document_type_id,
            thumbnail_url=row.get('thumbnail_url'),
            custom_fields=custom_fields_list
        )
        items.append(doc_cfv)

    # Get total count
    total_count = await get_docs_count_by_type(session, type_id=document_type_id)

    # Calculate number of pages
    num_pages = math.ceil(total_count / page_size) if total_count > 0 else 1

    return schema.PaginatedResponse(
        page_size=page_size,
        page_number=page_number,
        num_pages=num_pages,
        total_items=total_count,
        items=items,
    )


async def create_document(
    db_session: AsyncSession,
    attrs: schema.NewDocument,
    mime_type: MimeType,
    document_version_id: uuid.UUID | None = None,
) -> Tuple[schema.Document | None, schema.Error | None]:
    error = None
    doc_id = attrs.id or uuid.uuid4()

    # Get parent's owner to inherit ownership
    parent_owner = await get_node_owner(db_session, node_id=attrs.parent_id)

    # Determine owner type and id from parent
    if parent_owner.type == "user":
        owner_type = OwnerType.USER
        owner_id = parent_owner.id
    elif parent_owner.type == "group":
        owner_type = OwnerType.GROUP
        owner_id = parent_owner.id
    else:
        raise ValueError(f"Unsupported owner type: {parent_owner.type}")

    # Check uniqueness before creating
    is_unique = await ownership_api.check_name_unique_for_owner(
        session=db_session,
        resource_type=ResourceType.NODE,
        owner_type=owner_type,
        owner_id=owner_id,
        name=attrs.title,
        parent_id=attrs.parent_id,
        ctype="folder"
    )

    if not is_unique:
        attr_err = schema.AttrError(
            name="title",
            message="Within a folder title must be unique"
        )
        error = schema.Error(attrs=[attr_err])
        return None, error

    # Create document WITHOUT user_id/group_id
    doc = orm.Document(
        id=doc_id,
        title=attrs.title,
        ctype="document",
        ocr_status=attrs.ocr_status,
        parent_id=attrs.parent_id,
        ocr=attrs.ocr,
        lang=attrs.lang,
        created_by=attrs.created_by,
        updated_by=attrs.updated_by
    )

    doc_ver = orm.DocumentVersion(
        id=document_version_id or uuid.uuid4(),
        document_id=doc_id,
        number=1,
        file_name=attrs.file_name,
        size=0,
        page_count=0,
        lang=attrs.lang,
        mime_type=mime_type,
        short_description="Original",
        created_by=attrs.created_by,
        updated_by=attrs.updated_by
    )

    db_session.add(doc)
    db_session.add(doc_ver)

    try:
        await db_session.flush()

        # Set ownership
        await ownership_api.set_owner(
            session=db_session,
            resource=types.NodeResource(id=doc_id),
            owner=types.Owner(owner_type=owner_type, owner_id=owner_id),
        )

        await db_session.commit()

    except IntegrityError as e:
        await db_session.rollback()
        stre = str(e)
        # postgres unique integrity error
        if "unique" in stre and "title" in stre:
            attr_err = schema.AttrError(
                name="title",
                message="Within a folder title must be unique"
            )
            error = schema.Error(attrs=[attr_err])
        # sqlite unique integrity error
        elif "UNIQUE" in stre and ".title" in stre:
            attr_err = schema.AttrError(
                name="title",
                message="Within a folder title must be unique"
            )
            error = schema.Error(attrs=[attr_err])
        else:
            error = schema.Error(messages=[stre])

        return None, error

    # Load the document with relationships
    stmt = select(orm.Document).options(
        selectinload(orm.Document.tags),
        selectinload(orm.Document.versions).selectinload(orm.DocumentVersion.pages)
    ).where(orm.Document.id == doc_id)

    result = await db_session.execute(stmt)
    doc_with_relations = result.scalar_one_or_none()

    if doc_with_relations:
        # Get owner details for the response
        owner_details = await ownership_api.get_owner_details(
            session=db_session,
            resource_type=ResourceType.NODE,
            resource_id=doc_id
        )

        # Set owner_name for backward compatibility (if schema still has it)
        if hasattr(doc_with_relations, 'owner_name'):
            doc_with_relations.owner_name = owner_details.name

        return schema.Document.model_validate(doc_with_relations), error

    # Shouldn't reach here, but handle it
    attr_err = schema.AttrError(
        name="title",
        message="Document creation failed"
    )
    error = schema.Error(attrs=[attr_err])
    return None, error


async def version_bump(
    db_session: AsyncSession,
    doc_id: uuid.UUID,
    user_id: uuid.UUID,
    page_count: int | None = None,
    short_description: str | None = None,
) -> orm.DocumentVersion:
    """Increment document version"""

    last_ver = await get_last_doc_ver(db_session, doc_id=doc_id)
    new_page_count = page_count or last_ver.page_count
    db_new_doc_ver = orm.DocumentVersion(
        document_id=doc_id,
        number=last_ver.number + 1,
        file_name=last_ver.file_name,
        size=0,
        page_count=page_count,
        short_description=short_description,
        lang=last_ver.lang,
        mime_type=MimeType.application_pdf,
        created_by=user_id,
        updated_by=user_id
    )

    db_session.add(db_new_doc_ver)

    for page_number in range(1, new_page_count + 1):
        db_page = orm.Page(
            document_version=db_new_doc_ver,
            number=page_number,
            page_count=new_page_count,
            lang=last_ver.lang,
        )
        db_session.add(db_page)

    await db_session.commit()

    return db_new_doc_ver


async def version_bump_from_pages(
    db_session: AsyncSession,
    dst_document_id: uuid.UUID,
    pages: list[orm.Page],
) -> [orm.Document | None, schema.Error | None]:
    """
    Creates new version for the document `dst-document-id`

    PDF pages in the newly create document version is copied
    from ``pages``.
    """
    first_page = pages[0]
    page_count = len(pages)
    error = None
    stmt = (
        select(orm.DocumentVersion)
        .where(
            orm.DocumentVersion.document_id == dst_document_id,
            orm.DocumentVersion.size == 0,
        )
        .order_by(orm.DocumentVersion.number.desc())
    )
    dst_doc = await db_session.get(orm.Document, dst_document_id)
    dst_document_version = (await db_session.execute(stmt)).scalar()

    if not dst_document_version:
        dst_document_version = orm.DocumentVersion(
            document_id=dst_document_id,
            number=len(dst_doc.versions) + 1,
            lang=dst_doc.lang,
        )

    source_pdf = Pdf.open(first_page.document_version.file_path)
    dst_pdf = Pdf.new()

    for page in pages:
        pdf_page = source_pdf.pages.p(page.number)
        dst_pdf.pages.append(pdf_page)

    dst_document_version.file_name = first_page.document_version.file_name
    dst_document_version.page_count = page_count

    dirname = os.path.dirname(dst_document_version.file_path)
    os.makedirs(dirname, exist_ok=True)

    dst_pdf.save(dst_document_version.file_path)

    dst_document_version.size = getsize(dst_document_version.file_path)

    for page_number in range(1, page_count + 1):
        db_page = orm.Page(
            document_version_id=dst_document_version.id,
            number=page_number,
            page_count=page_count,
            lang=dst_doc.lang,
        )
        db_session.add(db_page)
    try:
        await db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
    finally:
        source_pdf.close()
        dst_pdf.close()

    if error:
        return None, error

    return dst_doc, None


async def update_text_field(db_session: AsyncSession, document_version_id: uuid.UUID, streams):
    """Update document versions's text field from IO streams.

    Arguments:
        ``streams`` - a list of IO text streams

    It will update text field of all associated pages first
    and then concatinate all text field into doc.text field.
    """
    text = []

    stmt = (
        select(orm.Page.id, orm.Page.text, orm.Page.number)
        .where(orm.Page.document_version_id == document_version_id)
        .order_by(orm.Page.number)
    )

    pages = [(row.id, row.text, row.number) for row in await db_session.execute(stmt)]

    for page, stream in zip(pages, streams):
        if page[1] is None:  # page.text
            txt = stream.read()
            sql = update(orm.Page).where(orm.Page.id == page[0]).values(text=txt)
            await db_session.execute(sql)
            text.append(txt.strip())

    stripped_text = " ".join(text)
    stripped_text = stripped_text.strip()
    if stripped_text:
        sql = (
            update(orm.DocumentVersion)
            .where(orm.DocumentVersion.id == document_version_id)
            .values(text=stripped_text)
        )
        await db_session.execute(sql)
    await db_session.commit()


class UploadStrategy:
    """
    Defines how to proceed with uploaded file
    """

    # INCREMENT - Uploaded file is inserted into the newly created
    #   document version
    INCREMENT = 1
    # MERGE - Uploaded file is merged with last file version
    #   and inserted into the newly created document version
    MERGE = 2


class FileType:
    PDF = "pdf"
    JPEG = "jpeg"
    PNG = "png"
    TIFF = "tiff"


def file_type(content_type: str) -> str:
    parts = content_type.split("/")
    if len(parts) == 2:
        return parts[1]

    raise ValueError(f"Invalid content type {content_type}")


def get_pdf_page_count(content: io.BytesIO | bytes) -> int:
    if isinstance(content, bytes):
        pdf = Pdf.open(io.BytesIO(content))
    else:
        pdf = Pdf.open(content)
    page_count = len(pdf.pages)
    pdf.close()

    return page_count


async def create_next_version(
    db_session: AsyncSession,
    doc: orm.Document,
    file_name,
    file_size,
    content_type: MimeType,
    created_by: uuid.UUID,
    short_description=None,
    document_version_id: uuid.UUID = None,
) -> orm.DocumentVersion:
    stmt = (
        select(orm.DocumentVersion)
        .where(
            orm.DocumentVersion.size == 0,
            orm.DocumentVersion.document_id == doc.id,
        )
        .order_by(orm.DocumentVersion.number.desc())
    )
    document_version = (await db_session.execute(stmt)).scalar()

    if not document_version:
        document_version = orm.DocumentVersion(
            id=document_version_id or uuid.uuid4(),
            document_id=doc.id,
            number=len(doc.versions) + 1,
            lang=doc.lang,
            created_by=created_by,
            updated_by=created_by,
        )

    document_version.file_name = file_name
    document_version.size = file_size
    document_version.page_count = 0
    document_version.mime_type = content_type

    if short_description:
        document_version.short_description = short_description

    db_session.add(document_version)

    return document_version


async def save_upload_metadata(
    db_session: AsyncSession,
    document_id: uuid.UUID,
    content: io.BytesIO,
    size: int,
    file_name: str,
    content_type: MimeType,
    created_by: uuid.UUID,
    document_version_id: uuid.UUID = None,
) -> Tuple[schema.Document | None, schema.Error | None]:

    doc = await db_session.get(orm.Document, document_id)
    orig_ver = None

    if content_type != MimeType.application_pdf:
        try:
            with tempfile.TemporaryDirectory() as tmpdirname:
                tmp_file_path = Path(tmpdirname) / f"{file_name}.pdf"
                with open(tmp_file_path, "wb") as f:
                    pdf_content = img2pdf.convert(content)
                    f.write(pdf_content)
        except img2pdf.ImageOpenError as e:
            error = schema.Error(messages=[str(e)])
            return None, error

        orig_ver = await create_next_version(
            db_session,
            doc=doc,
            file_name=file_name,
            file_size=size,
            content_type=content_type,
            created_by=created_by,
            document_version_id=document_version_id,
        )

        pdf_ver = await create_next_version(
            db_session,
            doc=doc,
            file_name=f"{file_name}.pdf",
            file_size=len(pdf_content),
            short_description=f"{file_type(content_type)} -> pdf",
            content_type=content_type,
            created_by=created_by
        )

        page_count = get_pdf_page_count(pdf_content)
        orig_ver.page_count = page_count
        pdf_ver.page_count = page_count

        for page_number in range(1, page_count + 1):
            db_page_orig = orm.Page(
                number=page_number,
                page_count=page_count,
                lang=pdf_ver.lang,
                document_version_id=orig_ver.id,
            )
            db_page_pdf = orm.Page(
                number=page_number,
                page_count=page_count,
                lang=pdf_ver.lang,
                document_version_id=pdf_ver.id,
            )
            db_session.add_all([db_page_orig, db_page_pdf])

    else:
        pdf_ver = await create_next_version(
            db_session,
            doc=doc,
            file_name=file_name,
            file_size=size,
            content_type=content_type,
            created_by=created_by,
            document_version_id=document_version_id
        )

        page_count = get_pdf_page_count(content)

        pdf_ver.page_count = page_count
        for page_number in range(1, page_count + 1):
            db_page_pdf = orm.Page(
                number=page_number,
                page_count=page_count,
                lang=pdf_ver.lang,
                document_version_id=pdf_ver.id,
            )
            db_session.add(db_page_pdf)
        db_session.add(pdf_ver)

    try:
        await db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    owner = await get_node_owner(db_session, node_id=doc.id)
    doc.owner_name = owner.name
    stmt = select(orm.Document).options(
        selectinload(orm.Document.tags),
        selectinload(orm.Document.versions).selectinload(orm.DocumentVersion.pages)
    ).where(orm.Document.id == doc.id)

    result = await db_session.execute(stmt)
    doc_with_relations = result.scalar_one()

    validated_model = schema.Document.model_validate(doc_with_relations)

    return validated_model, None


async def get_doc(
    session: AsyncSession,
    id: uuid.UUID,
    user_id: uuid.UUID,
) -> schema.DocumentWithoutVersions:
    stmt_doc = select(orm.Document).where(orm.Document.id == id)
    db_doc = (await session.execute(stmt_doc)).scalar_one()

    # Get full breadcrumb
    full_breadcrumb = await get_ancestors(session, id)

    # Check if we need to truncate for shared access
    shared_root_id = await get_shared_root_for_user(
        session, node_id=id, user_id=user_id
    )

    if shared_root_id is not None:
        path = truncate_breadcrumb_at_shared_root(full_breadcrumb, shared_root_id)
    else:
        path = full_breadcrumb

    # Determine root type for frontend rendering
    root_type = await get_breadcrumb_root_type(session, full_breadcrumb, shared_root_id)

    db_doc.breadcrumb = Breadcrumb(path=path, root=root_type)

    owner = await get_node_owner(session, node_id=id)
    db_doc.owner_name = owner.name

    model_doc = schema.DocumentWithoutVersions.model_validate(db_doc)

    return model_doc

async def get_doc_id_from_doc_ver_id(
    db_session: AsyncSession,
    doc_ver_id: uuid.UUID,
) -> uuid.UUID:
    stmt = select(orm.DocumentVersion.document_id).where(
        orm.DocumentVersion.id == doc_ver_id
    )

    return (await db_session.execute(stmt)).scalar()


async def get_doc_versions_list(
    db_session: AsyncSession,
    doc_id: uuid.UUID,
) -> list[schema.DocVerListItem]:
    stmt = select(
        orm.DocumentVersion.id,
        orm.DocumentVersion.number,
        orm.DocumentVersion.short_description
    ).where(
        orm.DocumentVersion.document_id == doc_id
    ).order_by(orm.DocumentVersion.number.desc())

    db_vers = (await db_session.execute(stmt)).all()
    vers = [
        schema.DocVerListItem(
            id=ver[0],
            number=ver[1],
            short_description=ver[2]
        )
        for ver in db_vers
    ]

    return vers

async def get_doc_version_download_url(
    db_session: AsyncSession,
    doc_ver_id: uuid.UUID
) -> schema.DownloadURL:
    file_server = settings.file_server
    if file_server == config.FileServer.LOCAL:
        url = f"/api/document-versions/{doc_ver_id}/download"
        return schema.DownloadURL(downloadURL=url)

    stmt = select(orm.DocumentVersion.file_name).where(
        orm.DocumentVersion.id==doc_ver_id
    )

    file_name = (await db_session.execute(stmt)).scalar()

    url = s3.doc_ver_signed_url(doc_ver_id, file_name)
    return schema.DownloadURL(downloadURL=url)


async def get_document_last_version(
    db_session: AsyncSession,
    doc_id: uuid.UUID,
) -> schema.DocumentVersion:
    ...





async def get_page_document_id(
    db_session: AsyncSession, page_id: uuid.UUID
) -> uuid.UUID:
    stmt = (
        select(orm.Document.id)
        .join(orm.DocumentVersion)
        .join(orm.Page)
        .where(orm.Page.id == page_id)
    )

    ret_id = (await db_session.execute(stmt)).scalar()
    return ret_id


async def get_pages_document_id(
    db_session: AsyncSession, page_ids: list[uuid.UUID]
) -> uuid.UUID:
    """Returns document ID whom all page_ids belong to"""
    stmt = (
        select(distinct(orm.Document.id))
        .join(orm.DocumentVersion)
        .join(orm.Page)
        .where(orm.Page.id.in_(page_ids))
    ).limit(1)

    ret_id = (await db_session.execute(stmt)).scalar()
    return ret_id


async def get_page(
    db_session: AsyncSession, page_id: uuid.UUID
) -> schema.Page:

    stmt = (
        select(orm.Page)
        .join(orm.DocumentVersion)
        .join(orm.Document)
        .where(orm.Page.id == page_id)
    )

    db_page = (await db_session.execute(stmt)).scalar()
    model = schema.Page.model_validate(db_page)

    return model


async def get_doc_ver_pages(db_session: AsyncSession, doc_ver_id: uuid.UUID) -> list[schema.Page]:
    stmt = (
        select(orm.Page)
        .where(orm.Page.document_version_id == doc_ver_id)
        .order_by("number")
    )

    db_pages = (await db_session.scalars(stmt)).all()
    models = [schema.Page.model_validate(db_page) for db_page in db_pages]

    return models


async def get_last_doc_ver(
    db_session: AsyncSession,
    doc_id: uuid.UUID,  # noqa
) -> orm.DocumentVersion:
    """
    Returns last version of the document
    identified by doc_id
    """

    stmt = (
        select(orm.DocumentVersion).options(
            selectinload(orm.DocumentVersion.pages)
        )
        .join(orm.Document)
        .where(
            orm.DocumentVersion.document_id == doc_id,
        )
        .order_by(orm.DocumentVersion.number.desc())
        .limit(1)
    )
    return (await db_session.scalars(stmt)).one()


async def get_first_page(
    db_session: AsyncSession,
    doc_ver_id: uuid.UUID,
) -> orm.Page:
    """
    Returns first page of the document version
    identified by doc_ver_id
    """
    async with db_session as session:  # noqa
        stmt = (
            select(orm.Page)
            .where(
                orm.Page.document_version_id == doc_ver_id,
            )
            .order_by(orm.Page.number.asc())
            .limit(1)
        )

        db_page = (await session.scalars(stmt)).one()

    return db_page


async def get_doc_ver(
    db_session: AsyncSession,
    *,
    document_version_id: uuid.UUID
) -> orm.DocumentVersion:
    """
    Returns last version of the document
    identified by doc_id
    """

    stmt = (
        select(orm.DocumentVersion)
        .join(orm.Document)
        .options(joinedload(orm.DocumentVersion.pages))
        .where(
            orm.DocumentVersion.id == document_version_id,
        )
    )
    db_doc_ver = (await db_session.scalars(stmt)).unique().one()

    return db_doc_ver


def select_last_doc_ver(document_id: uuid.UUID, user_id: uuid.UUID) -> Select:
    """Returns a selectable for the last version of the document"""
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    stmt = (
        select(orm.DocumentVersion.id)
        .join(orm.Document, orm.DocumentVersion.document_id == orm.Document.id)
        .join(orm.Ownership, and_(
            orm.Ownership.resource_type == ResourceType.NODE.value,
            orm.Ownership.resource_id == orm.Document.id
        ))
        .where(
            orm.DocumentVersion.document_id == document_id,
            or_(
                and_(
                    orm.Ownership.owner_type == OwnerType.USER,
                    orm.Ownership.owner_id == user_id,
                ),
                and_(
                    orm.Ownership.owner_type == OwnerType.GROUP,
                    orm.Ownership.owner_id.in_(user_groups_subquery)
                )
            )
        )
        .order_by(orm.DocumentVersion.number.desc())
        .limit(1)
    )

    return stmt


async def get_last_ver_pages(
    db_session: AsyncSession, document_id: uuid.UUID, user_id: uuid.UUID
) -> Sequence[orm.Page]:
    """Returns all pages of the last version of the document"""
    subq = select_last_doc_ver(document_id=document_id, user_id=user_id).subquery()

    stmt = (
        select(orm.Page)
        .where(orm.Page.document_version_id == subq.c.id)
        .order_by(orm.Page.number)
    )

    return (await db_session.execute(stmt)).scalars().all()


async def get_docs_thumbnail_img_status(
    db_session: AsyncSession,
    doc_ids: list[uuid.UUID]
) -> Tuple[list[schema.DocumentPreviewImageStatus], list[uuid.UUID]]:
    """Gets image preview statuses for given docIDs

    Response is a tuple. First item of the tuple is list of
    statuses and second item of the tuple is the list of document
    IDs for which image preview field has value NULL i.e. was not considered yet
    or maybe was reseted.
    """
    fserver = settings.file_server

    stmt = select(
        orm.Document.id.label("doc_id"),
        orm.Document.preview_status
    ).select_from(orm.Document).where(
        orm.Document.id.in_(doc_ids)
    )

    doc_ids_not_yet_considered_for_preview = []
    items = []
    if fserver == config.FileServer.S3.value:
        for row in await db_session.execute(stmt):
            url = None
            if row.preview_status == ImagePreviewStatus.ready:
                # image URL is returned if only and only if image
                # preview is ready (generated and uploaded to S3)
                if fserver == config.FileServer.S3:
                    # Real world CDN setup
                    url = s3.doc_thumbnail_signed_url(row.doc_id)

            if row.preview_status is None:
                doc_ids_not_yet_considered_for_preview.append(row.doc_id)

            item = schema.DocumentPreviewImageStatus(
                doc_id=row.doc_id,
                status=row.preview_status,
                preview_image_url=url
            )
            items.append(item)
    else:
        # Non-CDN setup
        for row in await db_session.execute(stmt):
            item = schema.DocumentPreviewImageStatus(
                doc_id=row.doc_id,
                status=ImagePreviewStatus.ready,
                preview_image_url=f"/api/thumbnails/{row.doc_id}"
            )
            items.append(item)

    return items, doc_ids_not_yet_considered_for_preview


async def query_documents_by_custom_field(
    session: AsyncSession,
    field_id: uuid.UUID,
    operator: str,
    value: Any,
    order_by: Optional[str] = None,
    limit: Optional[int] = None
) -> list[uuid.UUID]:
    """
    Query documents by custom field value

    This is FAST because it uses indexed typed columns
    """

    # Get field definition
    field: orm.CustomField = await session.get(orm.CustomField, field_id)
    if not field:
        raise ValueError(f"Custom field {field_id} not found")

    # Get type handler
    handler = TypeRegistry.get_handler(field.type_handler)

    # Build query using typed column
    typed_column_name = f"value_{handler.storage_column}"
    typed_column = getattr(orm.CustomFieldValue, typed_column_name)

    # Get filter expression from handler
    filter_expr = handler.get_filter_expression(
        typed_column, operator, value, field.config or {}
    )

    # Build query
    stmt = select(orm.CustomFieldValue.document_id).where(
        and_(
            orm.CustomFieldValue.field_id == field_id,
            filter_expr
        )
    )

    # Add sorting if requested
    if order_by:
        sort_expr = handler.get_sort_expression(typed_column)
        if order_by == "desc":
            stmt = stmt.order_by(sort_expr.desc())
        else:
            stmt = stmt.order_by(sort_expr.asc())

    # Add limit
    if limit:
        stmt = stmt.limit(limit)

    # Execute
    result = await session.execute(stmt)
    return [row[0] for row in result.all()]


def _build_document_filter_conditions(
    filters: Dict[str, Dict[str, Any]]
):
    conditions = []
    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")
        operator = filter_config.get("operator", "eq")

        if not value:
            continue

        condition = None

        if filter_name == "free_text":
            search_term = f"%{value}%"
            condition = orm.Document.title.ilike(search_term)

        if condition is not None:
            conditions.append(condition)

    return conditions


def _apply_document_sorting(
    query,
    sort_by: str,
    sort_direction: str,
    created_user,
    updated_user,
    owner_user,
    owner_group,
    category
):
    """Apply sorting to the document types query."""
    sort_column = None

    # Map sort_by to actual columns
    if sort_by == "id":
        sort_column = orm.Document.id
    elif sort_by == "title":
        sort_column = orm.Document.title
    elif sort_by == "created_at":
        sort_column = orm.Document.created_at
    elif sort_by == "updated_at":
        sort_column = orm.Document.updated_at
    elif sort_by == "created_by":
        # Sort by username of creator
        sort_column = created_user.username
    elif sort_by == "updated_by":
        # Sort by username of updater
        sort_column = updated_user.username
    elif sort_by == "owned_by":
        sort_column = case(
            (orm.Ownership.owner_type == OwnerType.USER, owner_user.username),
            (orm.Ownership.owner_type == OwnerType.GROUP, owner_group.name),
            else_=None
        )
    elif sort_by == "category":
        sort_column = category.name

    if sort_column is not None:
        if sort_direction.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    return query



async def get_doc_ver_lang(
    db_session: AsyncSession,
    doc_ver_id: uuid.UUID,
) -> str:
    """
    Returns the lang attribute of the document version
    identified by doc_ver_id.

    Raises:
        NoResultFound: If the document version does not exist.
    """
    stmt = select(orm.DocumentVersion.lang).where(
        orm.DocumentVersion.id == doc_ver_id
    )
    result = (await db_session.execute(stmt)).scalar_one()

    return result


async def set_doc_ver_lang(
    db_session: AsyncSession,
    doc_ver_id: uuid.UUID,
    lang: str,
    updated_by: uuid.UUID,
):
    doc_ver = await db_session.get(orm.DocumentVersion, doc_ver_id)
    if doc_ver is None:
        raise NoResultFound()

    doc_ver.lang = lang
    doc_ver.updated_at = utc_now()  # Python-side, affected by freeze_time
    doc_ver.updated_by = updated_by

    await db_session.commit()

    return lang
