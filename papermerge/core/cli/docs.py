import uuid

import typer
from rich.console import Console
from rich.table import Table

from papermerge.core import db, schemas
from papermerge.core.db.doc import get_documents_by_type
from papermerge.core.db.document_types import get_document_types

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


def print_docs(docs):
    table = Table(title="Users")

    table.add_column("UUID", style="cyan", no_wrap=True)
    table.add_column("Title", style="magenta")

    for key, value in docs.items():
        print("*********************************")
        print(f"{value['doc_id']} {value['custom_fields']}")


def print_doc_types(doc_types: list[schemas.DocumentType]):
    table = Table(title="Users")

    table.add_column("UUID", style="cyan", no_wrap=True)
    table.add_column("Name", style="magenta")

    for doc_type in doc_types:
        table.add_row(
            doc_type.name,
            str(doc_type.id),
        )

    console = Console()
    console.print(table)
