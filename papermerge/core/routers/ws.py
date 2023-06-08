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


@router.websocket("/ocr")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            async for message in notif:
                await websocket.send_text(f"Message text was: {message}")
    except WebSocketDisconnect:
        logger.info("Websocket disconnected")
