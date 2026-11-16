import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_user_listings_management_endpoints_registered():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/openapi.json")
        assert res.status_code == 200
        paths = res.json()["paths"]

        # Check endpoints for user listing management
        assert "/api/v1/listings/me/summary" in paths
        assert "get" in paths["/api/v1/listings/me/summary"]

        assert "/api/v1/listings/me/my-listings" in paths
        assert "get" in paths["/api/v1/listings/me/my-listings"]

        assert "/api/v1/listings/{id}/toggle-hide" in paths
        assert "post" in paths["/api/v1/listings/{id}/toggle-hide"]

        assert "/api/v1/listings/{id}/relist" in paths
        assert "post" in paths["/api/v1/listings/{id}/relist"]

        assert "/api/v1/listings/{id}/quick-update" in paths
        assert "patch" in paths["/api/v1/listings/{id}/quick-update"]

        assert "/api/v1/listings/{id}" in paths
        assert "delete" in paths["/api/v1/listings/{id}"]
