import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token


import uuid
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.deps import get_current_active_user
from app.models.user import User


@pytest.fixture
def mock_user():
    return User(
        id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        email="test@otocu.vn",
        display_name="Seller Test",
        role="SELLER",
        status="ACTIVE",
    )


@pytest.fixture(autouse=True)
def override_auth_dep(mock_user):
    app.dependency_overrides[get_current_active_user] = lambda: mock_user
    yield
    app.dependency_overrides.pop(get_current_active_user, None)


@pytest.mark.asyncio
async def test_media_upload_invalid_mime():
    """Kiểm tra chặn file không phải ảnh/video khi upload media."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("document.pdf", b"%PDF-1.4...", "application/pdf")}
        response = await client.post("/api/v1/media/upload", files=files)
        assert response.status_code == 422
        data = response.json()
        assert "error" in data


@pytest.mark.asyncio
async def test_media_sign_upload():
    """Kiểm tra tạo chữ ký upload trực tiếp Cloudinary (SCR-12 / API Contract)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/media/sign-upload",
            json={"folder": "used_cars_listings"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "signature" in data
        assert "timestamp" in data
        assert data["folder"] == "used_cars_listings"


@pytest.mark.asyncio
async def test_media_upload_and_delete_local_fallback():
    """Kiểm tra quy trình upload và xóa ảnh với cơ chế local fallback (an toàn khi chưa có key)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Upload
        files = {"file": ("car_front.jpg", b"\xff\xd8\xff\xe0dummy_jpeg_binary", "image/jpeg")}
        up_resp = await client.post(
            "/api/v1/media/upload",
            files=files,
            data={"folder": "test_cars"},
        )
        assert up_resp.status_code == 200
        up_data = up_resp.json()
        assert "public_id" in up_data
        assert "url" in up_data
        public_id = up_data["public_id"]

        # 2. Delete
        del_resp = await client.delete(f"/api/v1/media/{public_id}")
        assert del_resp.status_code == 200
        del_data = del_resp.json()
        assert del_data["result"] in ["ok", "not_found"]


@pytest.mark.asyncio
async def test_media_upload_mocked_cloudinary():
    """Kiểm tra upload trực tiếp lên Cloudinary khi có API credentials (mocked)."""
    mock_cloudinary_result = {
        "public_id": "used_cars/car_123456",
        "url": "http://res.cloudinary.com/demo/image/upload/v1/used_cars/car_123456.jpg",
        "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/used_cars/car_123456.jpg",
        "format": "jpg",
        "resource_type": "image",
        "width": 1920,
        "height": 1080,
        "bytes": 245000,
    }

    with patch("cloudinary.uploader.upload", return_value=mock_cloudinary_result):
        from app.modules.media.service import media_service
        media_service.is_configured = True
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                files = {"file": ("toyota.jpg", b"\xff\xd8\xfffake_data", "image/jpeg")}
                resp = await client.post("/api/v1/media/upload", files=files)
                assert resp.status_code == 200
                data = resp.json()
                assert data["storage_type"] == "cloudinary"
                assert data["public_id"] == "used_cars/car_123456"
                assert "res.cloudinary.com" in data["secure_url"]
        finally:
            media_service.is_configured = bool(
                media_service.cloud_name and media_service.api_key and media_service.api_secret
            )


@pytest.mark.asyncio
async def test_media_delete_path_traversal_prevention():
    """Kiểm tra ngăn chặn tấn công Path Traversal khi xóa file local."""
    from app.modules.media.service import media_service
    # Test through service directly with path traversal payload
    res = await media_service.delete_media("local_../../backend/app/main.py")
    assert res.result in ["error", "not_found"]
    # Verify main.py was definitely NOT deleted
    import os
    assert os.path.exists("backend/app/main.py") or os.path.exists("app/main.py")
