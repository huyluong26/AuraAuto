import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ArticleCreateRequest(BaseModel):
    title: str = Field(min_length=5, max_length=255, description="Tiêu đề bài viết tin tức")
    summary: Optional[str] = Field(None, description="Tóm tắt ngắn bài viết")
    content: str = Field(min_length=20, description="Nội dung đầy đủ của bài viết")
    thumbnail_url: Optional[str] = Field(None, description="Ảnh đại diện bài viết")
    category: str = Field(default="THỊ TRƯỜNG", description="Chuyên mục bài viết")
    status: str = Field(default="DRAFT", description="DRAFT, PENDING_REVIEW, PUBLISHED")


class ArticleUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    summary: Optional[str] = None
    content: Optional[str] = Field(None, min_length=20)
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


class ArticleAuthorBrief(BaseModel):
    id: uuid.UUID
    display_name: str
    avatar_url: Optional[str] = None


class ArticleListItemResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    summary: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: str
    status: str
    views_count: int
    author: ArticleAuthorBrief
    published_at: Optional[datetime] = None
    created_at: datetime


class ArticleDetailResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    summary: Optional[str] = None
    content: str
    thumbnail_url: Optional[str] = None
    category: str
    status: str
    views_count: int
    author: ArticleAuthorBrief
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
