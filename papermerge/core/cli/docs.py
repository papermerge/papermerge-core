import uuid

import typer
from rich.console import Console
from rich.table import Table

from papermerge.core import schemas
from papermerge.core.db.engine import AsyncSessionLocal
from papermerge.core.features.document.db.api import get_docs_by_type, get_doc_cfv
from papermerge.core.features.document_types.db.api import get_document_types
from papermerge.core.utils.cli import async_command

app = typer.Typer(help="List various entities")


@app.command()
@async_command
async def document_types():
    """List document types"""
    async with AsyncSessionLocal() as db_session:
        doc_types = await get_document_types(db_session)

    print_doc_types(doc_types)


@app.command(name="list-by-type")
@async_command
async def list_documents_by_type(type_id: uuid.UUID):
    """List all documents by specific document type"""
    async with AsyncSessionLocal() as db_session:
        docs = await get_docs_by_type(db_session, type_id=type_id, user_id=uuid.uuid4())
    print_docs(docs)


@app.command(name="cfv")
@async_command
async def get_cfv(doc_id: uuid.UUID):
    """Print custom field values for specific document"""
    async with AsyncSessionLocal() as db_session:
        items: list[schemas.CFV] = await get_doc_cfv(db_session, document_id=doc_id)

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
