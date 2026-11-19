import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from jose import jwt, JWTError

from app.main import app
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.modules.auth.schemas import validate_password_strength


def test_password_hashing():
    """Kiểm tra cơ chế băm mật khẩu Bcrypt an toàn kèm salt ngẫu nhiên."""
    password = "MySecurePassword@123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

    # Hai lần băm cùng 1 mật khẩu phải sinh ra hai chuỗi salt khác nhau
    hashed_2 = get_password_hash(password)
    assert hashed != hashed_2
    assert verify_password(password, hashed_2) is True


def test_password_strength_validation():
    """Kiểm tra chính sách mật khẩu mạnh (độ dài >= 8, hoa, thường, số)."""
    # Quá ngắn (< 8 ký tự)
    with pytest.raises(ValueError, match="tối thiểu 8 ký tự"):
        validate_password_strength("Ab1!")

    # Thiếu chữ hoa
    with pytest.raises(ValueError, match="chữ cái in hoa"):
        validate_password_strength("password123")

    # Thiếu chữ thường
    with pytest.raises(ValueError, match="chữ cái in thường"):
        validate_password_strength("PASSWORD123")

    # Thiếu chữ số
    with pytest.raises(ValueError, match="chữ số"):
        validate_password_strength("PasswordOnly")

    # Hợp lệ
    assert validate_password_strength("StrongPass@123") == "StrongPass@123"


def test_jwt_token_creation_and_decode():
    """Kiểm tra cấu trúc và tính hợp lệ của JWT token."""
    user_id = uuid.uuid4()
    token = create_access_token(subject=user_id, role="USER")
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    assert payload["sub"] == str(user_id)
    assert payload["role"] == "USER"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_jwt_invalid_signature_rejection():
    """Kiểm tra từ chối JWT bị giả mạo hoặc ký bằng secret key khác."""
    user_id = uuid.uuid4()
    token = create_access_token(subject=user_id, role="USER")

    # Thử giải mã bằng secret giả mạo
    fake_secret = "evil-secret-key-that-should-fail-immediately"
    with pytest.raises(JWTError):
        jwt.decode(token, fake_secret, algorithms=[settings.ALGORITHM])


def test_jwt_tampered_payload_rejection():
    """Kiểm tra từ chối token nếu payload bị sửa đổi (đổi role USER -> ADMIN)."""
    user_id = uuid.uuid4()
    token = create_access_token(subject=user_id, role="USER")

    parts = token.split(".")
    assert len(parts) == 3

    # Giả mạo phần payload (phần thứ 2)
    import base64
    import json
    payload_data = json.loads(base64.urlsafe_b64decode(parts[1] + "==").decode())
    payload_data["role"] = "ADMIN"
    tampered_payload = base64.urlsafe_b64encode(json.dumps(payload_data).encode()).decode().rstrip("=")

    tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"

    with pytest.raises(JWTError):
        jwt.decode(tampered_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


@pytest.mark.asyncio
async def test_security_headers_present():
    """Kiểm tra các HTTP Security Headers chuẩn OWASP được gắn trên response."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200

        headers = response.headers
        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert headers.get("X-Frame-Options") == "DENY"
        assert headers.get("X-XSS-Protection") == "1; mode=block"
        assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert "geolocation=(), camera=(), microphone=()" in headers.get("Permissions-Policy", "")
        assert headers.get("Cross-Origin-Opener-Policy") == "same-origin-allow-popups"
        assert headers.get("Content-Security-Policy") == "frame-ancestors 'none';"


@pytest.mark.asyncio
async def test_hsts_on_https_forwarded():
    """Kiểm tra header HSTS (Strict-Transport-Security) tự động kích hoạt khi có HTTPS."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Giả lập request từ Nginx/Reverse Proxy có HTTPS (X-Forwarded-Proto)
        response = await client.get("/health", headers={"X-Forwarded-Proto": "https"})
        assert response.status_code == 200
        hsts = response.headers.get("Strict-Transport-Security", "")
        assert "max-age=31536000" in hsts
        assert "includeSubDomains" in hsts


def test_secret_key_production_validator(monkeypatch):
    """Kiểm tra validator chặn SECRET_KEY yếu hoặc mặc định khi chạy production."""
    from app.core.config import Settings

    monkeypatch.setenv("ENVIRONMENT", "production")

    # Insecure default key in production
    with pytest.raises(ValueError, match="secure unique secret"):
        Settings.validate_secret_key("default-insecure-secret-key-please-change-in-production")

    # Too short key (< 32 chars) in production
    with pytest.raises(ValueError, match="at least 32 characters"):
        Settings.validate_secret_key("short-key-12345")

    # Valid strong key
    strong_key = "a" * 32
    assert Settings.validate_secret_key(strong_key) == strong_key


@pytest.mark.asyncio
async def test_auth_sensitive_cache_control_headers():
    """Kiểm tra header Cache-Control chống cache thông tin nhạy cảm ở route /auth/."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            content=b'{"email":"a@b.com","password":"123"}',
            headers={"Content-Type": "application/json"},
        )
        assert "no-store" in response.headers.get("Cache-Control", "")
        assert "no-cache" in response.headers.get("Cache-Control", "")


@pytest.mark.asyncio
async def test_auth_middleware_invalid_content_length():
    """Kiểm tra middleware xử lý Content-Length không phải số mà không bị crash 500."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
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


@pytest.mark.asyncio
async def test_auth_middleware_unsupported_media_type():
    """Kiểm tra middleware từ chối Content-Type không phải application/json đối với auth mutation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            content=b'user=test&pass=123',
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 415
        data = response.json()
        assert data["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"


@pytest.mark.asyncio
async def test_admin_endpoint_requires_auth():
    """Kiểm tra endpoint admin từ chối truy cập nếu không có token (401)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/admin/metrics")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.asyncio
async def test_auth_login_rate_limiting():
    """Kiểm tra cơ chế Rate Limit chống tấn công dò mật khẩu (Brute-Force) trên /auth/login."""
    transport = ASGITransport(app=app)
    # Sử dụng IP riêng biệt để không ảnh hưởng đến các bài test khác
    unique_ip = "192.168.100.99"
    headers = {
        "Content-Type": "application/json",
        "X-Forwarded-For": unique_ip,
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        rate_limited = False
        for i in range(18):
            resp = await client.post(
                "/api/v1/auth/login",
                json={"email": f"brute_{i}@test.com", "password": "WrongPassword@123"},
                headers=headers,
            )
            if resp.status_code == 429:
                rate_limited = True
                assert resp.json()["error"]["code"] == "TOO_MANY_REQUESTS"
                break

        assert rate_limited is True, "Hệ thống phải kích hoạt 429 sau khi vượt quá 15 lần đăng nhập/phút"


@pytest.mark.asyncio
async def test_sql_injection_resilience_listings_search():
    """Kiểm tra hệ thống phòng ngừa SQL Injection kinh điển qua parameterized query."""
    sql_injection_payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT id, email FROM users --",
        "' AND 1=1 --",
        "admin'--",
        "\" OR 1=1 --",
        "') OR ('1'='1",
        "'; EXEC xp_cmdshell('dir'); --",
        "1' OR sleep(5) --",
    ]
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for payload in sql_injection_payloads:
            # Gửi payload vào param search của API tìm kiếm xe công khai
            response = await client.get("/api/v1/listings", params={"search": payload})
            # Hệ thống phải xử lý an toàn (200 OK với kết quả lọc literal, không crash 500 với lỗi SQL syntax)
            assert response.status_code == 200, f"SQL Injection payload gây lỗi: {payload}"
            data = response.json()
            assert "items" in data
            assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_sql_injection_resilience_catalog_filters():
    """Kiểm tra các bộ lọc catalog và brand miễn nhiễm với SQL Injection."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Gửi payload vào query param của hãng xe
        response = await client.get("/api/v1/catalog/brands", params={"search": "' UNION SELECT 'a', 'b' --"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

