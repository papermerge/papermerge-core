import uuid

import typer
from rich.console import Console
from rich.table import Table
from sqlalchemy import case, desc, select
from sqlalchemy.orm import aliased

from papermerge.core import db, schemas
from papermerge.core.db.doc import get_documents_by_type
from papermerge.core.db.document_types import get_document_types
from papermerge.core.db.models import (
    CustomField,
    CustomFieldValue,
    Document,
    DocumentType,
    DocumentTypeCustomField,
    Node,
)

app = typer.Typer(help="List various entities")
session = db.get_session()


@app.command()
def document_types():
    """List document types"""
    doc_types: list[schemas.DocumentType] = get_document_types(session)
    print_doc_types(doc_types)


@app.command(name="list")
def list_documents_by_type(type_id: uuid.UUID):
    """List all documents by specific document type"""
    docs = get_documents_by_type(session, type_id=type_id, user_id=uuid.uuid4())
    print_docs(docs)


def get_subq():
    nd = aliased(Node)
    cfv = aliased(CustomFieldValue)
    cf = aliased(CustomField)
    dtcf = aliased(DocumentTypeCustomField)
    dt = aliased(DocumentType)
    doc = aliased(Document)

    subq = (
        select(
            nd.title.label("title"),
            doc.id.label("doc_id"),
            doc.document_type_id.label("document_type_id"),
        )
        .select_from(doc)
        .join(nd, nd.id == doc.id)
        .join(dt, dt.id == doc.document_type_id)
        .join(dtcf, dtcf.document_type_id == dt.id)
        .join(cf, cf.id == dtcf.custom_field_id)
        .join(cfv, cfv.document_id == doc.id, isouter=True)
        .where(
            dt.id == uuid.UUID("9f349f14-608d-41f3-9284-dc32449dcf02"),
            cf.name == "Total",
            nd.parent_id == uuid.UUID("4fdcfbc9-64cb-46d3-bc7e-e1677eaecc70"),
        )
        .order_by(desc(cfv.value_monetary))
    )

    return subq


@app.command(name="play")
def play():
    subq = get_subq()
    cfv = aliased(CustomFieldValue)
    cf = aliased(CustomField)
    dtcf = aliased(DocumentTypeCustomField)
    dt = aliased(DocumentType)

    stmt = (
        select(
            subq.c.title,
            subq.c.doc_id.label("doc_id"),
            cf.name.label("cf_name"),
            case(
                (cf.data_type == "monetary", cfv.value_monetary),
                (cf.data_type == "string", cfv.value_text),
                (cf.data_type == "date", cfv.value_date),
                (cf.data_type == "boolean", cfv.value_bool),
                (cf.data_type == "url", cfv.value_url),
            ).label("cf_value"),
        )
        .select_from(subq)
        .join(dt, subq.c.document_type_id == dt.id)
        .join(dtcf, dtcf.document_type_id == dt.id)
        .join(cf, cf.id == dtcf.custom_field_id)
        .join(cfv, cfv.document_id == subq.c.doc_id, isouter=True)
    )

    for row in session.execute(stmt):
        print(row)


def print_docs(docs):
    if len(docs) == 0:
        print("No entries")
        return

    table = Table(title="Documents (with custom fields)")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("Title", style="magenta")
    first_item = list(docs.items())[0]

    for cf in first_item[1]["custom_fields"]:
        table.add_column(cf[0])

    for key, doc in docs.items():
        cf_list = []
        for label, value in doc["custom_fields"]:
            if value is not None:
                cf_list.append(str(value))
            else:
                cf_list.append("-")
        table.add_row(str(doc["doc_id"]), doc["title"], *cf_list)

    console = Console()
    console.print(table)


def print_doc_types(doc_types: list[schemas.DocumentType]):
    table = Table(title="Document Types")

    table.add_column("Name", style="cyan", no_wrap=True)
    table.add_column("ID", style="magenta")

    for doc_type in doc_types:
        table.add_row(
            doc_type.name,
            str(doc_type.id),
        )

    console = Console()
    console.print(table)
