import uuid
import logging
from typing import Dict, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Maps user_id -> set of active WebSockets (allows multiple tabs/devices)
        self.active_connections: Dict[uuid.UUID, Set[WebSocket]] = {}

    async def connect(self, user_id: uuid.UUID, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.debug(f"[WS] User {user_id} connected (total: {len(self.active_connections[user_id])} sockets)")

    def disconnect(self, user_id: uuid.UUID, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            logger.debug(f"[WS] User {user_id} disconnected")

    async def send_personal_message(self, message: dict, user_id: uuid.UUID):
        """Gửi message chat cá nhân tới người dùng."""
        if user_id in self.active_connections:
            dead_sockets = set()
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_sockets.add(connection)
            for dead in dead_sockets:
                self.active_connections[user_id].discard(dead)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_notification_to_user(self, user_id: uuid.UUID, notification_data: dict):
        """Đẩy thông báo thời gian thực (Push Notification) tới tất cả thiết bị của người dùng."""
        payload = {
            "type": "NOTIFICATION",
            "data": notification_data,
        }
        await self.send_personal_message(payload, user_id)

    async def broadcast_ping(self):
        """Heartbeat ping kiểm tra kết nối định kỳ."""
        for user_id, sockets in list(self.active_connections.items()):
            dead_sockets = set()
            for s in sockets:
                try:
                    await s.send_json({"type": "PING"})
                except Exception:
                    dead_sockets.add(s)
            for dead in dead_sockets:
                sockets.discard(dead)
            if not sockets and user_id in self.active_connections:
                del self.active_connections[user_id]


ws_manager = ConnectionManager()
