import ipaddress
import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware kiểm tra và bổ sung các Security Headers bảo mật chuẩn OWASP
    trước khi phản hồi (response) được gửi trả về cho client.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # Standard OWASP Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none';"

        # HSTS (Strict-Transport-Security) khi có HTTPS hoặc chạy trên môi trường production
        from app.core.config import settings
        is_https = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"
        if is_https or settings.ENVIRONMENT.lower() in ("production", "prod"):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # Ngăn chặn cache cho các endpoint nhạy cảm (Auth, Tokens)
        if "/auth/" in request.url.path:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"

        return response


class AuthSecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware kiểm tra bảo mật phía trước (pre-request validation & anti-brute force)
    cho các yêu cầu gửi đến phân hệ Authentication:
    1. Giới hạn kích thước payload (chống DDoS / buffer overflow)
    2. Kiểm tra định dạng Content-Type
    3. Giới hạn tần suất đăng nhập theo IP (Rate Limit chống Brute-Force mật khẩu)
    """

    MAX_AUTH_BODY_SIZE = 1024 * 1024  # 1MB limit for auth requests
    RATE_LIMIT_WINDOW = 60  # 60 seconds
    MAX_LOGIN_ATTEMPTS = 15  # Max 15 attempts per minute per IP
    MAX_AI_REQUESTS = 30  # Max 30 AI requests per minute per IP

    def __init__(self, app):
        super().__init__(app)
        self.ip_attempts: Dict[str, List[float]] = defaultdict(list)
        self.ai_attempts: Dict[str, List[float]] = defaultdict(list)
        self.last_cleanup = time.time()
        self.last_ai_cleanup = time.time()

    def _get_client_ip(self, request: Request) -> str:
        peer_ip = request.client.host if request.client else "unknown"
        is_trusted_proxy = False
        if peer_ip in ("127.0.0.1", "::1", "localhost"):
            is_trusted_proxy = True
        else:
            try:
                ip_obj = ipaddress.ip_address(peer_ip)
                is_trusted_proxy = ip_obj.is_private or ip_obj.is_loopback
            except ValueError:
                pass

        forwarded_for = request.headers.get("x-forwarded-for")
        if is_trusted_proxy and forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return peer_ip

    def _is_rate_limited(self, client_ip: str) -> bool:
        now = time.time()

        # Tự động dọn dẹp các IP đã hết hạn định kỳ để ngăn chặn rò rỉ bộ nhớ (memory leak)
        if now - self.last_cleanup > 120:
            stale_ips = [
                ip for ip, timestamps in self.ip_attempts.items()
                if not timestamps or now - timestamps[-1] >= self.RATE_LIMIT_WINDOW
            ]
            for ip in stale_ips:
                del self.ip_attempts[ip]
            self.last_cleanup = now

        # Filter attempts within current window
        attempts = [t for t in self.ip_attempts[client_ip] if now - t < self.RATE_LIMIT_WINDOW]

        if len(attempts) >= self.MAX_LOGIN_ATTEMPTS:
            self.ip_attempts[client_ip] = attempts
            return True

        attempts.append(now)
        self.ip_attempts[client_ip] = attempts
        return False

    def _is_ai_rate_limited(self, client_ip: str) -> bool:
        now = time.time()
        if now - self.last_ai_cleanup > 120:
            stale_ips = [
                ip for ip, timestamps in self.ai_attempts.items()
                if not timestamps or now - timestamps[-1] >= self.RATE_LIMIT_WINDOW
            ]
            for ip in stale_ips:
                del self.ai_attempts[ip]
            self.last_ai_cleanup = now

        attempts = [t for t in self.ai_attempts[client_ip] if now - t < self.RATE_LIMIT_WINDOW]
        if len(attempts) >= self.MAX_AI_REQUESTS:
            self.ai_attempts[client_ip] = attempts
            return True

        attempts.append(now)
        self.ai_attempts[client_ip] = attempts
        return False

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # 1. Rate Limiting cho AI endpoints (Gemini Vision, định giá xe, natural search)
        if "/ai/" in path and request.method == "POST":
            client_ip = self._get_client_ip(request)
            if self._is_ai_rate_limited(client_ip):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": {
                            "code": "TOO_MANY_REQUESTS",
                            "message": "Quá nhiều yêu cầu xử lý AI từ thiết bị này. Vui lòng chờ 60 giây và thử lại.",
                        }
                    },
                )

        # 2. Áp dụng kiểm tra bảo mật nâng cao cho các route /auth/
        if "/auth/" in path and request.method in ["POST", "PUT", "PATCH"]:
            # 1. Kiểm tra Content-Type
            content_type = request.headers.get("content-type", "")
            if "application/json" not in content_type:
                return JSONResponse(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    content={
                        "error": {
                            "code": "UNSUPPORTED_MEDIA_TYPE",
                            "message": "Yêu cầu phải có Content-Type: application/json",
                        }
                    },
                )

            # 2. Kiểm tra Content-Length an toàn
            content_length = request.headers.get("content-length")
            if content_length:
                try:
                    cl_int = int(content_length)
                    if cl_int < 0 or cl_int > self.MAX_AUTH_BODY_SIZE:
                        return JSONResponse(
                            status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
                            content={
                                "error": {
                                    "code": "PAYLOAD_TOO_LARGE",
                                    "message": "Dữ liệu gửi lên vượt quá dung lượng cho phép (tối đa 1MB)",
                                }
                            },
                        )
                except ValueError:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={
                            "error": {
                                "code": "INVALID_CONTENT_LENGTH",
                                "message": "Tiêu đề Content-Length không hợp lệ",
                            }
                        },
                    )

            # 3. Rate Limiting trên endpoint đăng nhập
            if path.endswith("/auth/login"):
                client_ip = self._get_client_ip(request)
                if self._is_rate_limited(client_ip):
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "error": {
                                "code": "TOO_MANY_REQUESTS",
                                "message": "Quá nhiều yêu cầu đăng nhập từ thiết bị này. Vui lòng chờ 60 giây và thử lại.",
                            }
                        },
                    )

        return await call_next(request)
