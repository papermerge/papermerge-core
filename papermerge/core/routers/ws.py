import logging

from django.conf import settings

from papermerge.core.notif import Notification

from fastapi import APIRouter, WebSocket, WebSocketDisconnect


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ws",
    tags=["websockets"]
)

notif = Notification(settings.REDIS_URL, channel="cha:1")


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)


manager = ConnectionManager()


@router.websocket("/ocr")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            async for message in notif:
                await manager.send(f"Message text was: {message}", websocket)
    except WebSocketDisconnect:
        logger.info("Websocket disconnected")
        manager.disconnect(websocket)
