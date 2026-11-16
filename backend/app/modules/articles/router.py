import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional
import unicodedata
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.article import Article
from app.modules.articles.schemas import (
    ArticleCreateRequest,
    ArticleUpdateRequest,
    ArticleListItemResponse,
    ArticleDetailResponse,
    ArticleAuthorBrief,
)
from app.shared.exceptions import NotFoundException, ConflictException
from app.shared.schemas import SuccessResponse

router = APIRouter(tags=["Articles & News"])


def generate_slug(text: str) -> str:
    # Chuyển tiếng Việt có dấu thành không dấu và tạo slug (bảo toàn chữ đ/Đ)
    text = text.replace('đ', 'd').replace('Đ', 'd')
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    slug = re.sub(r'[-\s]+', '-', text)
    return slug or f"bai-viet-{uuid.uuid4().hex[:8]}"


def _to_author_brief(user: User) -> ArticleAuthorBrief:
    return ArticleAuthorBrief(
        id=user.id,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )


# ==========================================
# 1. PUBLIC APIS: Xem tin tức thị trường
# ==========================================

@router.get("/articles", response_model=List[ArticleListItemResponse])
async def list_published_articles(
    category: Optional[str] = Query(None, description="Lọc theo chuyên mục"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Article)
        .options(selectinload(Article.author))
        .where(Article.status == "PUBLISHED")
        .order_by(Article.published_at.desc(), Article.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if category:
        stmt = stmt.where(Article.category == category)
    if search:
        kw = f"%{search.strip().lower()}%"
        stmt = stmt.where(or_(func.lower(Article.title).like(kw), func.lower(Article.summary).like(kw)))

    res = await db.execute(stmt)
    articles = res.scalars().all()

    return [
        ArticleListItemResponse(
            id=a.id,
            title=a.title,
            slug=a.slug,
            summary=a.summary,
            thumbnail_url=a.thumbnail_url,
            category=a.category,
            status=a.status,
            views_count=a.views_count,
            author=_to_author_brief(a.author),
            published_at=a.published_at,
            created_at=a.created_at,
        )
        for a in articles
    ]


@router.get("/articles/{id_or_slug}", response_model=ArticleDetailResponse)
async def get_article_detail(
    id_or_slug: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        article_id = uuid.UUID(id_or_slug)
        stmt = select(Article).options(selectinload(Article.author)).where(Article.id == article_id)
    except ValueError:
        stmt = select(Article).options(selectinload(Article.author)).where(Article.slug == id_or_slug)

    res = await db.execute(stmt)
    article = res.scalar_one_or_none()

    if not article:
        raise NotFoundException("Bài viết tin tức không tồn tại")

    # Tăng lượt xem
    article.views_count += 1
    await db.commit()

    return ArticleDetailResponse(
        id=article.id,
        title=article.title,
        slug=article.slug,
        summary=article.summary,
        content=article.content,
        thumbnail_url=article.thumbnail_url,
        category=article.category,
        status=article.status,
        views_count=article.views_count,
        author=_to_author_brief(article.author),
        published_at=article.published_at,
        created_at=article.created_at,
        updated_at=article.updated_at,
    )


# ==========================================
# 2. ADMIN APIS: Quản trị tin tức đăng duyệt xóa
# ==========================================

@router.get("/admin/articles", response_model=List[ArticleListItemResponse], dependencies=[Depends(require_admin)])
async def list_admin_articles(
    status_filter: Optional[str] = Query(None, description="DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED"),
    category: Optional[str] = Query(None, description="Lọc theo chuyên mục"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Article)
        .options(selectinload(Article.author))
        .order_by(Article.created_at.desc())
    )

    if status_filter and status_filter.upper() != "ALL":
        stmt = stmt.where(Article.status == status_filter.upper())
    if category:
        stmt = stmt.where(Article.category == category)
    if search:
        kw = f"%{search.strip().lower()}%"
        stmt = stmt.where(func.lower(Article.title).like(kw))

    res = await db.execute(stmt)
    articles = res.scalars().all()

    return [
        ArticleListItemResponse(
            id=a.id,
            title=a.title,
            slug=a.slug,
            summary=a.summary,
            thumbnail_url=a.thumbnail_url,
            category=a.category,
            status=a.status,
            views_count=a.views_count,
            author=_to_author_brief(a.author),
            published_at=a.published_at,
            created_at=a.created_at,
        )
        for a in articles
    ]


@router.post("/admin/articles", response_model=ArticleDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_article(
    data: ArticleCreateRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    base_slug = generate_slug(data.title)
    slug = base_slug
    # Kiểm tra trùng lặp slug
    count = 1
    while True:
        existing = await db.scalar(select(func.count(Article.id)).where(Article.slug == slug))
        if not existing:
            break
        slug = f"{base_slug}-{count}"
        count += 1

    now = datetime.now(timezone.utc)
    is_published = data.status.upper() == "PUBLISHED"

    article = Article(
        title=data.title,
        slug=slug,
        summary=data.summary,
        content=data.content,
        thumbnail_url=data.thumbnail_url,
        category=data.category.upper(),
        status=data.status.upper(),
        author_id=admin_user.id,
        views_count=0,
        published_at=now if is_published else None,
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)

    # Nạp author relation
    stmt = select(Article).options(selectinload(Article.author)).where(Article.id == article.id)
    res = await db.execute(stmt)
    loaded_article = res.scalar_one()

    return ArticleDetailResponse(
        id=loaded_article.id,
        title=loaded_article.title,
        slug=loaded_article.slug,
        summary=loaded_article.summary,
        content=loaded_article.content,
        thumbnail_url=loaded_article.thumbnail_url,
        category=loaded_article.category,
        status=loaded_article.status,
        views_count=loaded_article.views_count,
        author=_to_author_brief(loaded_article.author),
        published_at=loaded_article.published_at,
        created_at=loaded_article.created_at,
        updated_at=loaded_article.updated_at,
    )


@router.patch("/admin/articles/{id}", response_model=ArticleDetailResponse)
async def update_admin_article(
    id: uuid.UUID,
    data: ArticleUpdateRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Article).options(selectinload(Article.author)).where(Article.id == id).with_for_update()
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()

    if not article:
        raise NotFoundException("Bài viết tin tức không tồn tại")

    if data.title is not None:
        article.title = data.title
        article.slug = f"{generate_slug(data.title)}-{article.id.hex[:6]}"
    if data.summary is not None:
        article.summary = data.summary
    if data.content is not None:
        article.content = data.content
    if data.thumbnail_url is not None:
        article.thumbnail_url = data.thumbnail_url
    if data.category is not None:
        article.category = data.category.upper()
    if data.status is not None:
        new_status = data.status.upper()
        if new_status == "PUBLISHED" and article.status != "PUBLISHED":
            article.published_at = datetime.now(timezone.utc)
        article.status = new_status

    await db.commit()
    await db.refresh(article)

    return ArticleDetailResponse(
        id=article.id,
        title=article.title,
        slug=article.slug,
        summary=article.summary,
        content=article.content,
        thumbnail_url=article.thumbnail_url,
        category=article.category,
        status=article.status,
        views_count=article.views_count,
        author=_to_author_brief(article.author),
        published_at=article.published_at,
        created_at=article.created_at,
        updated_at=article.updated_at,
    )


@router.post("/admin/articles/{id}/approve", response_model=SuccessResponse)
async def approve_admin_article(
    id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Article).where(Article.id == id).with_for_update()
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()

    if not article:
        raise NotFoundException("Bài viết tin tức không tồn tại")

    article.status = "PUBLISHED"
    article.published_at = datetime.now(timezone.utc)
    await db.commit()

    return SuccessResponse(message="Duyệt và xuất bản tin tức thành công!", data={"status": "PUBLISHED"})


@router.delete("/admin/articles/{id}", response_model=SuccessResponse)
async def delete_admin_article(
    id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Article).where(Article.id == id)
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()

    if not article:
        raise NotFoundException("Bài viết tin tức không tồn tại")

    await db.delete(article)
    await db.commit()

    return SuccessResponse(message="Đã xóa vĩnh viễn bài viết tin tức thành công!")
