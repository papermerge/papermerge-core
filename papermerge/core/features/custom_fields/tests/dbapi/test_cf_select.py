import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm
from papermerge.core.types import ResourceType
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.custom_fields import schema as cf_schema
from papermerge.core.features.document_types.db import api as dt_dbapi
from papermerge.core.features.document_types import schema as dt_schema
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.features.ownership.schema import Owner, OwnerType
from papermerge.core.features.custom_fields import types


async def test_count_select_field_single_document(
    db_session: AsyncSession,
    user,
    make_custom_field_select,
):
    """
    Count documents with a single select value.

    Setup:
    - Create select field "Priority" with options: high, low
    - Create document type with the field
    - Create one document with Priority="high"

    Expected:
    - count("high") = 1
    - count("low") = 0
    """
    owner = Owner.create_from(user_id=user.id)
    field = await make_custom_field_select(
        name="Priority",
        options=[
            types.opt(value="high", label="High"),
            types.opt(value="low", label="Low")
        ],
        owner=owner
    )

    # Create document type
    dt_data = dt_schema.CreateDocumentType(
        name="Task",
        custom_field_ids=[field.id],
        owner_type=OwnerType.USER,
        owner_id=user.id
    )
    doc_type = await dt_dbapi.create_document_type(db_session, data=dt_data)

    # Create document
    doc = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-1.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    db_session.add(doc)
    doc2 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-1.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    db_session.add(doc2)
    await db_session.flush()

    await ownership_api.set_owner(
        session=db_session,
        resource_type=ResourceType.NODE,
        resource_id=doc.id,
        owner_type=OwnerType.USER,
        owner_id=user.id
    )
    await ownership_api.set_owner(
        session=db_session,
        resource_type=ResourceType.NODE,
        resource_id=doc2.id,
        owner_type=OwnerType.USER,
        owner_id=user.id
    )


    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value="high"
    )
    await cf_dbapi.set_custom_field_value(db_session, doc.id, value_data)
    await cf_dbapi.set_custom_field_value(db_session, doc2.id, value_data)

    high_count = await cf_dbapi.count_documents_by_option_value(
        db_session, field.id, "high", user_id=user.id
    )
    low_count = await cf_dbapi.count_documents_by_option_value(
        db_session, field.id, "low", user_id=user.id
    )

    assert high_count == 2  # used in two documents
    assert low_count == 0
