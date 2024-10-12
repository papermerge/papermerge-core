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


@app.command(name="list-by-type")
def list_documents_by_type(type_id: uuid.UUID):
    """List all documents by specific document type"""
    docs = get_documents_by_type(session, type_id=type_id, user_id=uuid.uuid4())
    print_docs(docs)


@app.command(name="cfv")
def get_cfv(doc_id: uuid.UUID, cf_names: list[str]):
    """Print custom field values for specific document

    Receives as input document ID and list of custom field names
    """
    items: list[schemas.CFV] = db.get_doc_cfv(
        session, document_id=doc_id, cf_names=cf_names
    )

    table = Table(title="Document's Custom Field Values")

    table.add_column("CF ID", style="magenta")
    table.add_column("CF Name")
    table.add_column("CF Type")
    table.add_column("CF Extra Data")
    table.add_column("CF Value")

    for item in items:
        table.add_row(
            str(item.custom_field_id),
            item.name,
            item.type,
            item.extra_data,
            str(item.value),
        )

    console = Console()
    console.print(table)


@app.command(name="update-cf")
def update_doc_custom_fields(doc_id: uuid.UUID, custom_fields: list[str]):
    """Update custom fields for specific document

    Example: docs update-cf <UUID>  Total "22.89" Shop lidl Date "2024-12-26"
    Note that name of the custom field is case-sensitive i.e. "Total" and "total"
    are different things.
    Number of items after <UUID> should be even. There should be at
    least two items after <UUID>.
    """
    cf = {}
    if len(custom_fields) % 2 != 0:
        raise ValueError("Number of items after UUID must be even")

    for i in range(0, len(custom_fields), 2):
        cf[custom_fields[i]] = custom_fields[i + 1]

    db.update_document_custom_fields(session, document_id=doc_id, custom_fields=cf)


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
