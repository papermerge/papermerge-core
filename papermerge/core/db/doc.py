from uuid import UUID

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import ColoredTag, Document, DocumentVersion, Page

from .common import get_ancestors


def get_doc(
    engine: Engine,
    id: UUID,
    user_id: UUID,
) -> schemas.Document:
    with Session(engine) as session:  # noqa
        stmt_doc = select(Document).where(
            Document.id == id, Document.user_id == user_id
        )
        db_doc = session.scalars(stmt_doc).one()
        breadcrumb = get_ancestors(session, id)
        db_doc.breadcrumb = breadcrumb

        stmt_doc_ver = (
            select(DocumentVersion)
            .where(
                DocumentVersion.document_id == id,
            )
            .order_by("number")
        )
        db_doc_vers = session.scalars(stmt_doc_ver).all()

        stmt_pages = select(Page).where(Document.id == id)
        db_pages = session.scalars(stmt_pages).all()

        db_doc.versions = list(
            [
                schemas.DocumentVersion.model_validate(db_doc_ver)
                for db_doc_ver in db_doc_vers
            ]
        )
        colored_tags_stmt = select(ColoredTag).where(ColoredTag.object_id == id)
        colored_tags = session.scalars(colored_tags_stmt).all()
        db_doc.tags = [ct.tag for ct in colored_tags]

        def get_page(doc_ver_id):
            result = []
            for db_page in db_pages:
                if db_page.document_version_id == doc_ver_id:
                    result.append(db_page)

            return sorted(result, key=lambda x: x.number)

        for version in db_doc.versions:
            pages = get_page(version.id)
            version.pages = list([schemas.Page.model_validate(page) for page in pages])
        model_doc = schemas.Document.model_validate(db_doc)

    return model_doc


def update_document_custom_field_values(
    session: Session,
    id: UUID,
    custom_fields_update: schemas.DocumentCustomFieldsUpdate,
    user_id: UUID,
):
    pass


def get_document_custom_field_values(
    session: Session,
    id: UUID,
    user_id: UUID,
):
    pass
