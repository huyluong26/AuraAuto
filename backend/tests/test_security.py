import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import verify_password, get_password_hash, create_access_token
from jose import jwt
from app.core.config import settings


def test_password_hashing():
    password = "MySecurePassword@123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_creation_and_decode():
    user_id = uuid.uuid4()
    token = create_access_token(subject=user_id, role="USER")
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    assert payload["sub"] == str(user_id)
    assert payload["role"] == "USER"
    assert "exp" in payload


@pytest.mark.asyncio
async def test_auth_middleware_invalid_content_length():
    """Kiểm tra middleware xử lý Content-Length không phải số mà không bị crash 500."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Send non-numeric Content-Length
        response = await client.post(
            "/api/v1/auth/login",
            content=b'{"email":"a@b.com","password":"123"}',
            headers={"Content-Type": "application/json", "Content-Length": "not-a-number"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_CONTENT_LENGTH"


@pytest.mark.asyncio
async def test_auth_middleware_payload_too_large():
    """Kiểm tra middleware chặn payload auth vượt quá 1MB (413)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            content=b'{"email":"a@b.com","password":"123"}',
            headers={"Content-Type": "application/json", "Content-Length": "2000000"},
        )
        assert response.status_code == 413
        data = response.json()
        assert data["error"]["code"] == "PAYLOAD_TOO_LARGE"
