import uuid
import pytest
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.showroom import Showroom
from app.modules.users.router import PublicSellerProfileResponse
from app.modules.listings.schemas import ListingListItemResponse


def test_public_seller_profile_schema():
    seller_id = uuid.uuid4()
    profile = PublicSellerProfileResponse(
        id=seller_id,
        display_name="Nguyen Van Chu Xe",
        avatar_url="https://res.cloudinary.com/demo/image/upload/avatar.jpg",
        province_code="01",
        province_name="Hà Nội",
        account_type="INDIVIDUAL",
        created_at=datetime.now(timezone.utc),
        rating_avg=4.9,
        reviews_count=18,
        active_listings_count=2,
        sold_listings_count=5,
        showroom=None,
        active_listings=[],
    )
    assert profile.id == seller_id
    assert profile.rating_avg == 4.9
    assert profile.account_type == "INDIVIDUAL"
    assert profile.active_listings_count == 2
    assert profile.sold_listings_count == 5
    assert len(profile.active_listings) == 0


@pytest.mark.asyncio
async def test_get_public_seller_profile_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Non-existent seller returns 404
        resp_404 = await client.get(f"/api/v1/users/{uuid.uuid4()}/public")
        assert resp_404.status_code == 404

