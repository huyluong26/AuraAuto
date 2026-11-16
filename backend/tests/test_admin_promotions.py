import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.listing import Listing
from app.models.user import User
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_admin_promotions_packages_and_overview():
    async with AsyncSessionLocal() as session:
        admin = (await session.execute(select(User).where(User.role == "ADMIN"))).scalars().first()
        if not admin:
            pytest.skip("No admin user found in database")
        admin_id = admin.id

        sample_listing = (await session.execute(select(Listing).limit(1))).scalars().first()
        sample_listing_id = sample_listing.id if sample_listing else None

    admin_token = create_access_token(subject=admin_id, role="ADMIN")
    headers = {"Authorization": f"Bearer {admin_token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Overview
        resp = await client.get("/api/v1/admin/promotions/overview", headers=headers)
        assert resp.status_code == 200
        overview = resp.json()
        assert "total_revenue_vnd" in overview
        assert "active_featured_count" in overview

        # 2. Get Packages (auto-seeds defaults)
        resp_pkg = await client.get("/api/v1/admin/promotions/packages", headers=headers)
        assert resp_pkg.status_code == 200
        packages = resp_pkg.json()
        assert len(packages) >= 4

        # 3. Create a custom promo package
        new_code = f"PROMO_TEST_{uuid.uuid4().hex[:6].upper()}"
        resp_create = await client.post(
            "/api/v1/admin/promotions/packages",
            headers=headers,
            json={
                "code": new_code,
                "name": "Gói Thử Nghiệm 5 Ngày",
                "days": 5,
                "amount_vnd": 180000,
                "original_amount_vnd": 240000,
                "description": "Gói test khuyến mãi",
                "badge": "Test Sale",
                "is_active": True,
                "sort_order": 99,
            },
        )
        assert resp_create.status_code == 201
        created_pkg_id = resp_create.json()["data"]["id"]

        # 4. Update the package price
        resp_update = await client.patch(
            f"/api/v1/admin/promotions/packages/{created_pkg_id}",
            headers=headers,
            json={"amount_vnd": 150000, "is_active": False},
        )
        assert resp_update.status_code == 200

        # 5. Delete the package
        resp_del = await client.delete(
            f"/api/v1/admin/promotions/packages/{created_pkg_id}",
            headers=headers,
        )
        assert resp_del.status_code == 200

        # 6. Featured listings list
        resp_featured = await client.get("/api/v1/admin/promotions/featured-listings", headers=headers)
        assert resp_featured.status_code == 200
        assert isinstance(resp_featured.json(), list)

        # 7. Payment transactions list
        resp_trans = await client.get("/api/v1/admin/promotions/transactions", headers=headers)
        assert resp_trans.status_code == 200
        assert isinstance(resp_trans.json(), list)

        # 8. Grant & Revoke featured status
        if sample_listing_id:
            resp_grant = await client.post(
                f"/api/v1/admin/promotions/featured-listings/{sample_listing_id}/grant",
                headers=headers,
                json={"days": 3, "featured_tier": "VIP_PREMIUM", "note": "Test grant"},
            )
            assert resp_grant.status_code == 200

            resp_revoke = await client.post(
                f"/api/v1/admin/promotions/featured-listings/{sample_listing_id}/revoke",
                headers=headers,
                json={"reason": "Test cleanup"},
            )
            assert resp_revoke.status_code == 200



