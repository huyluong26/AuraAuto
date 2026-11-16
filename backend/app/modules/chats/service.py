import uuid
from datetime import datetime, timezone
from typing import List, Tuple
from sqlalchemy import select, or_, and_, desc, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import Conversation, Message, ConversationRead
from app.models.listing import Listing, ListingRevision
from app.models.user import User
from app.modules.chats.schemas import (
    SendMessageRequest,
    MessageResponse,
    ConversationResponse,
    ConversationParticipant,
    ConversationListingBrief,
)
from app.modules.chats.ws_manager import ws_manager
from app.shared.exceptions import NotFoundException, ForbiddenException, ConflictException


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_conversation(self, listing_id: uuid.UUID, buyer: User) -> Conversation:
        stmt = (
            select(Listing)
            .options(selectinload(Listing.seller))
            .where(Listing.id == listing_id)
        )
        res = await self.db.execute(stmt)
        listing = res.scalar_one_or_none()

        if not listing:
            raise NotFoundException("Tin đăng không tồn tại")
        if listing.seller_user_id == buyer.id:
            raise ConflictException("Bạn không thể chat với chính mình")

        # Find existing conversation
        conv_stmt = select(Conversation).where(
            Conversation.listing_id == listing_id,
            Conversation.buyer_user_id == buyer.id,
        )
        conv_res = await self.db.execute(conv_stmt)
        conv = conv_res.scalar_one_or_none()

        if not conv:
            conv = Conversation(
                listing_id=listing_id,
                buyer_user_id=buyer.id,
                seller_user_id=listing.seller_user_id,
            )
            self.db.add(conv)
            await self.db.commit()
            await self.db.refresh(conv)

        return conv

    async def send_message(self, conversation_id: uuid.UUID, sender: User, data: SendMessageRequest) -> Message:
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()

        if not conv:
            raise NotFoundException("Cuộc hội thoại không tồn tại")
        if sender.id not in [conv.buyer_user_id, conv.seller_user_id]:
            raise ForbiddenException("Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này")

        msg = Message(
            conversation_id=conv.id,
            sender_user_id=sender.id,
            client_message_id=data.client_message_id,
            content=data.content,
        )
        self.db.add(msg)

        now = datetime.now(timezone.utc)
        conv.last_message_at = now
        conv.last_message_preview = data.content[:100]

        await self.db.commit()
        await self.db.refresh(msg)

        # Notify via WebSocket to recipient
        recipient_id = conv.seller_user_id if sender.id == conv.buyer_user_id else conv.buyer_user_id
        await ws_manager.send_personal_message(
            {
                "type": "NEW_MESSAGE",
                "conversation_id": str(conv.id),
                "message": {
                    "id": str(msg.id),
                    "sender_user_id": str(sender.id),
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat(),
                },
            },
            recipient_id,
        )

        return msg

    async def list_user_conversations(self, user: User) -> List[ConversationResponse]:
        stmt = (
            select(Conversation)
            .options(
                selectinload(Conversation.buyer),
                selectinload(Conversation.seller),
                selectinload(Conversation.listing).selectinload(Listing.published_revision).selectinload(ListingRevision.media),
                selectinload(Conversation.listing).selectinload(Listing.revisions).selectinload(ListingRevision.media),
            )
            .where(
                or_(
                    Conversation.buyer_user_id == user.id,
                    Conversation.seller_user_id == user.id,
                )
            )
            .order_by(desc(Conversation.last_message_at))
        )
        res = await self.db.execute(stmt)
        convs = res.scalars().all()

        results = []
        for c in convs:
            other = c.seller if c.buyer_user_id == user.id else c.buyer
            rev = c.listing.published_revision or (c.listing.revisions[0] if c.listing.revisions else None)
            primary_img = None
            if rev and rev.media:
                primary_img = rev.media[0].url

            # Real unread count computation
            read_stmt = select(ConversationRead).where(
                ConversationRead.conversation_id == c.id,
                ConversationRead.user_id == user.id,
            )
            read_res = await self.db.execute(read_stmt)
            read_rec = read_res.scalar_one_or_none()

            unread_stmt = select(func.count(Message.id)).where(
                Message.conversation_id == c.id,
                Message.sender_user_id != user.id,
            )
            if read_rec and read_rec.last_read_at:
                unread_stmt = unread_stmt.where(Message.created_at > read_rec.last_read_at)

            cnt_res = await self.db.execute(unread_stmt)
            unread_cnt = cnt_res.scalar_one() or 0

            results.append(
                ConversationResponse(
                    id=c.id,
                    listing_id=c.listing_id,
                    last_message_at=c.last_message_at,
                    last_message_preview=c.last_message_preview,
                    unread_count=unread_cnt,
                    other_participant=ConversationParticipant(
                        id=other.id,
                        display_name=other.display_name,
                        avatar_url=other.avatar_url,
                    ),
                    listing=ConversationListingBrief(
                        id=c.listing.id,
                        title=rev.title if rev else "Xe ô tô",
                        price_vnd=rev.price_vnd if rev else 0,
                        primary_image_url=primary_img,
                        manufacture_year=rev.manufacture_year if rev else None,
                    ),
                )
            )
        return results

    async def get_messages(self, conversation_id: uuid.UUID, user: User, limit: int = 50) -> List[MessageResponse]:
        conv_stmt = select(Conversation).where(Conversation.id == conversation_id)
        conv_res = await self.db.execute(conv_stmt)
        conv = conv_res.scalar_one_or_none()

        if not conv:
            raise NotFoundException("Cuộc hội thoại không tồn tại")
        if user.id not in [conv.buyer_user_id, conv.seller_user_id]:
            raise ForbiddenException("Bạn không có quyền xem cuộc hội thoại này")

        # Mark as read
        read_stmt = select(ConversationRead).where(
            ConversationRead.conversation_id == conversation_id,
            ConversationRead.user_id == user.id,
        )
        read_res = await self.db.execute(read_stmt)
        read_rec = read_res.scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if read_rec:
            read_rec.last_read_at = now
        else:
            self.db.add(ConversationRead(
                conversation_id=conversation_id,
                user_id=user.id,
                last_read_at=now,
            ))
        await self.db.commit()

        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        messages = list(reversed(res.scalars().all()))

        return [
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                sender_user_id=m.sender_user_id,
                client_message_id=m.client_message_id,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ]

    async def mark_conversation_read(self, conversation_id: uuid.UUID, user: User) -> bool:
        read_stmt = select(ConversationRead).where(
            ConversationRead.conversation_id == conversation_id,
            ConversationRead.user_id == user.id,
        )
        read_res = await self.db.execute(read_stmt)
        read_rec = read_res.scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if read_rec:
            read_rec.last_read_at = now
        else:
            self.db.add(ConversationRead(
                conversation_id=conversation_id,
                user_id=user.id,
                last_read_at=now,
            ))
        await self.db.commit()
        return True
