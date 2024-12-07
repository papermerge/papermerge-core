import uuid
import typer

from papermerge.core.tasks import send_task
from papermerge.core.db.engine import Session

from papermerge.core import dbapi, constants, types


app = typer.Typer(help="OCR tasks")


@app.command()
def schedule_ocr(node_id: uuid.UUID, force: bool = False, lang: str | None = None):
    """Schedules OCR for given node ID"""
    with Session() as db_session:
        node_type: types.CType = dbapi.get_node_type(db_session, node_id)

        if node_type == "document":
            if lang is None:
                lang = dbapi.get_document_lang(db_session, node_id)
            send_task(
                constants.WORKER_OCR_DOCUMENT,
                kwargs={
                    "document_id": str(node_id),
                    "lang": lang,
                },
                route_name="ocr",
            )
        else:
            # get all descendants of node_id
            pass
