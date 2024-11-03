import io

from papermerge.core.db.engine import Session
from papermerge.core.features.document import schema as doc_schema
from papermerge.core.features.document.db import api as doc_dbapi


def copy_text_field(
    db_session: Session,
    src: doc_schema.DocumentVersion,
    dst: doc_schema.DocumentVersion,
    page_numbers: list[int],
) -> None:
    streams = collect_text_streams(
        version=src,
        # list of old_version page numbers
        page_numbers=page_numbers,
    )
    # updates page.text fields and document_version.text field
    doc_dbapi.update_text_field(db_session, dst.id, streams)


def collect_text_streams(
    version: doc_schema.DocumentVersion, page_numbers: list[int]
) -> list[io.StringIO]:
    """
    Returns list of texts of given page numbers from specified document version

    Each page's text is wrapped as io.StringIO instance.
    """
    pages_map = {page.number: page for page in version.pages}

    result = [io.StringIO(pages_map[number].text) for number in page_numbers]

    return result
