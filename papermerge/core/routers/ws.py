import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from papermerge.core import schemas
from papermerge.core.auth import get_ws_current_user
from papermerge.core.notif import notification

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ws",
    tags=["websockets"]
)


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
    user: schemas.User = Depends(get_ws_current_user)
):
    """
    Sends notifications to websocket-clients about the status of OCR tasks.

    The OCR tasks status is asynchronously received via redis and pushed
    to the websocket clients (to the current/session user).
    """
    await manager.connect(websocket)

    try:
        while True:
            logger.debug("Websockets Loop")
            async for message in notification:
                logger.debug(
                    f"Message received {message} "
                    f"Current user id = {str(user.id)}"
                )
                # send only to the current user
                if message.kwargs.user_id == str(user.id):
                    await manager.send(message.dict(), websocket)
    except WebSocketDisconnect:
        logger.info("Websocket disconnected")
        manager.disconnect(websocket)
