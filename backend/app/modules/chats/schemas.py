import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CreateConversationRequest(BaseModel):
    listing_id: uuid.UUID


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    client_message_id: Optional[str] = None


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_user_id: uuid.UUID
    client_message_id: Optional[str] = None
    content: str
    created_at: datetime


class ConversationParticipant(BaseModel):
    id: uuid.UUID
    display_name: str
    avatar_url: Optional[str] = None


class ConversationListingBrief(BaseModel):
    id: uuid.UUID
    title: str
    price_vnd: int
    primary_image_url: Optional[str] = None
    manufacture_year: Optional[int] = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    unread_count: int = 0
    other_participant: ConversationParticipant
    listing: ConversationListingBrief
