import uuid

import typer
from rich.console import Console
from rich.table import Table

from papermerge.core import db, schemas
from papermerge.core.db.doc import get_docs_by_type
from papermerge.core.db.document_types import get_document_types

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
    docs = get_docs_by_type(session, type_id=type_id, user_id=uuid.uuid4())
    print_docs(docs)


@app.command(name="cfv")
def get_cfv(doc_id: uuid.UUID):
    """Print custom field values for specific document"""
    items: list[schemas.CFV] = db.get_doc_cfv(session, document_id=doc_id)

    table = Table(title="Document's Custom Field Values")

    table.add_column("Document ID")
    table.add_column("CF ID", style="magenta")
    table.add_column("CF Name")
    table.add_column("CF Type")
    table.add_column("CF Value")

    for item in items:
        value = "-"
        if item.value:
            value = str(item.value)

        table.add_row(
            str(item.document_id),
            str(item.custom_field_id),
            item.name,
            item.type,
            value,
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


def print_docs(docs: list[schemas.DocumentCFV]):
    if len(docs) == 0:
        print("No entries")
        return

    table = Table(title="Documents (with custom fields)")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("Title", style="magenta")
    first_item = list(docs)[0]

    for cf in first_item.custom_fields:
        table.add_column(cf[0])

    for doc in docs:
        cf_list = []
        for label, value in doc.custom_fields:
            if value is not None:
                cf_list.append(str(value))
            else:
                cf_list.append("-")
        table.add_row(str(doc.id), doc.title, *cf_list)

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
