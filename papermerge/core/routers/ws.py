import logging

from asgiref.sync import sync_to_async
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from papermerge.core.models import Document, User
from papermerge.core.notif import Event, EventName, notification

from .auth import get_ws_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ws",
    tags=["websockets"]
)


def update_document_ocr_status(event: Event) -> None:
    logger.debug(f"Update document ocr_status for event={event}")
    logger.debug(f"event name={event.name}")
    if event.name != EventName.ocr_document:
        logger.debug(f"{event.name} != {EventName.ocr_document}")
        return

    document_id = event.kwargs.document_id
    ocr_status = event.state
    try:
        document = Document.objects.get(pk=document_id)
        document.ocr_status = ocr_status
        document.save()
    except Document.DoesNotExist as exc:
        # not end of the world, but still good to know
        logger.warning(
            f"Consumer did not found the document_id={document_id}"
        )
        logger.warning(exc)
        # life goes on...


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send(self, message: str, websocket: WebSocket):
        await websocket.send_json(message)


manager = ConnectionManager()


@router.websocket("/ocr")
async def websocket_endpoint(
    websocket: WebSocket,
    user: User = Depends(get_ws_current_user)
):
    """
    Sends notifications to websockets clients about the status of OCR tasks.

    The OCR tasks status is asynchronously received via redis and pushed
    to the websocket clients (to the current/session user).
    """
    await manager.connect(websocket)
    try:
        while True:
            logger.debug("While True")
            async for message in notification:
                logger.debug(
                    f"Message received {message} "
                    f"Current user id = {str(user.id)}"
                )
                await sync_to_async(update_document_ocr_status)(message)
                # send only to the current user
                if message.kwargs.user_id == str(user.id):
                    await manager.send(message, websocket)
    except WebSocketDisconnect:
        logger.info("Websocket disconnected")
        manager.disconnect(websocket)
