from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from papermerge.core.features.document.db.orm import Document, DocumentVersion, Page
from papermerge.core.features.tags.db.orm import Tag
from papermerge.core.features.document import schema as doc_schema

from .common import get_ancestors


def get_doc(
    session: Session,
    id: UUID,
    user_id: UUID,
) -> doc_schema.Document:
    stmt_doc = select(Document).where(Document.id == id, Document.user_id == user_id)
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
            doc_schema.DocumentVersion.model_validate(db_doc_ver)
            for db_doc_ver in db_doc_vers
        ]
    )
    # colored_tags_stmt = select(Tag).where(Tag.node_id == id)
    # colored_tags = session.scalars(colored_tags_stmt).all()
    # db_doc.tags = [ct.tag for ct in colored_tags]

    def get_page(doc_ver_id):
        result = []
        for db_page in db_pages:
            if db_page.document_version_id == doc_ver_id:
                result.append(db_page)

        return sorted(result, key=lambda x: x.number)

    for version in db_doc.versions:
        pages = get_page(version.id)
        version.pages = list([doc_schema.Page.model_validate(page) for page in pages])
    model_doc = doc_schema.Document.model_validate(db_doc)

    return model_doc
