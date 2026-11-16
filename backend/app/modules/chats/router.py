import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db, AsyncSessionLocal
from app.core.deps import get_current_active_user
from app.models.user import User
from app.shared.schemas import SuccessResponse
from app.modules.chats.schemas import (
    CreateConversationRequest,
    SendMessageRequest,
    MessageResponse,
    ConversationResponse,
)
from app.modules.chats.service import ChatService
from app.modules.chats.ws_manager import ws_manager

router = APIRouter(prefix="/chats", tags=["Chat"])


@router.post("/conversations", response_model=ConversationResponse)
async def get_or_create_conversation(
    data: CreateConversationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    conv = await service.get_or_create_conversation(data.listing_id, current_user)
    convs = await service.list_user_conversations(current_user)
    for c in convs:
        if c.id == conv.id:
            return c
    return convs[0]


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    return await service.list_user_conversations(current_user)


@router.get("/conversations/{id}/messages", response_model=List[MessageResponse])
async def get_messages(
    id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    return await service.get_messages(id, current_user, limit)


@router.post("/conversations/{id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    id: uuid.UUID,
    data: SendMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    msg = await service.send_message(id, current_user, data)
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_user_id=msg.sender_user_id,
        client_message_id=msg.client_message_id,
        content=msg.content,
        created_at=msg.created_at,
    )


@router.post("/conversations/{id}/read", response_model=SuccessResponse)
async def mark_conversation_as_read(
    id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    await service.mark_conversation_read(id, current_user)
    return SuccessResponse(message="Đã đánh dấu đã đọc")


@router.websocket("/ws")
async def chat_websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """Realtime WebSocket endpoint authenticated via token query param."""
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = uuid.UUID(payload.get("sub"))
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle inbound websocket messages if client chooses WebSocket for sending
            action = data.get("action")
            if action == "PING":
                await websocket.send_json({"type": "PONG"})
            elif action == "SEND_MESSAGE":
                conv_id = uuid.UUID(data.get("conversation_id"))
                content = data.get("content", "").strip()
                if content:
                    async with AsyncSessionLocal() as session:
                        service = ChatService(session)
                        stmt = select(User).where(User.id == user_id)
                        res = await session.execute(stmt)
                        u = res.scalar_one_or_none()
                        if u:
                            await service.send_message(
                                conversation_id=conv_id,
                                sender=u,
                                data=SendMessageRequest(content=content),
                            )
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)
    except Exception:
        ws_manager.disconnect(user_id, websocket)
