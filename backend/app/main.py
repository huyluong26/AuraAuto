import os
import re
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import async_engine, Base
from app.db.seed_initial import seed_initial_data
from app.shared.exceptions import AppException

# Import routers
from app.modules.auth.router import router as auth_router
from app.modules.catalog.router import router as catalog_router
from app.modules.listings.router import router as listings_router
from app.modules.appointments.router import router as appointments_router
from app.modules.chats.router import router as chats_router
from app.modules.reviews.router import router as reviews_router
from app.modules.favorites.router import router as favorites_router
from app.modules.notifications.router import router as notifications_router
from app.modules.users.router import router as users_router
from app.modules.admin.router import router as admin_router
from app.modules.ai.router import router as ai_router
from app.modules.media.router import router as media_router
from app.modules.articles.router import router as articles_router
from app.modules.showrooms.router import router as showrooms_router
from app.modules.trust.router import router as trust_router
from app.modules.payments.router import router as payments_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema if tables don't exist yet
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed data
    try:
        await seed_initial_data()
    except Exception as e:
        logger.warning(f"Seed data skipped or already present: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend API cho Nền tảng Mua Bán Ô Tô Cũ Tích Hợp AI & Gemini",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Security Middlewares
from app.core.middleware import SecurityHeadersMiddleware, AuthSecurityMiddleware

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuthSecurityMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    origin = request.headers.get("origin")
    headers = {}
    if origin and (origin in settings.BACKEND_CORS_ORIGINS or "*" in settings.BACKEND_CORS_ORIGINS or "localhost" in origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"Máy chủ gặp sự cố: {str(exc)}" if settings.DEBUG else "Hệ thống đang gặp sự cố xử lý. Vui lòng thử lại sau.",
                "details": str(exc) if settings.DEBUG else None,
            }
        },
        headers=headers,
    )


FIELD_LABELS_VI = {
    "email": "Email",
    "password": "Mật khẩu",
    "new_password": "Mật khẩu mới",
    "current_password": "Mật khẩu hiện tại",
    "display_name": "Tên người dùng / Họ và tên",
    "phone": "Số điện thoại",
    "identifier": "Email hoặc Số điện thoại",
    "token": "Mã xác thực",
    "title": "Tiêu đề tin đăng",
    "price_vnd": "Giá bán (VNĐ)",
    "manufacture_year": "Năm sản xuất",
    "odometer_km": "Số km đã đi (Odo)",
    "brand_id": "Hãng xe",
    "model_id": "Dòng xe",
    "variant_id": "Phiên bản xe",
    "body_type": "Kiểu dáng xe",
    "fuel_type": "Nhiên liệu",
    "transmission": "Hộp số",
    "province_code": "Tỉnh / Thành phố",
    "location_address": "Địa chỉ xem xe",
    "description": "Mô tả chi tiết",
    "scheduled_at": "Thời gian hẹn",
    "location": "Địa điểm hẹn",
    "note": "Ghi chú",
    "reason": "Lý do",
    "reason_code": "Mã lý do báo cáo",
    "target_type": "Loại đối tượng",
    "target_id": "Mã đối tượng",
    "action": "Hành động xử lý",
    "inspection_score": "Điểm thẩm định kỹ thuật",
    "inspection_inspector_name": "Tên chuyên viên kiểm định",
    "rating": "Đánh giá sao",
    "comment": "Nhận xét",
    "showroom_name": "Tên Showroom / Doanh nghiệp",
    "tax_code": "Mã số thuế",
}


def _format_validation_error_message(errors: list) -> str:
    messages = []
    for err in errors:
        loc = err.get("loc", [])
        field_path = [str(x) for x in loc if x not in ("body", "query", "path")]
        raw_field = field_path[-1] if field_path else "Dữ liệu"
        field_label = FIELD_LABELS_VI.get(raw_field, raw_field)

        raw_msg = str(err.get("msg", ""))
        err_type = str(err.get("type", ""))

        if raw_msg.startswith("Value error, "):
            msg = raw_msg.replace("Value error, ", "").strip()
        elif err_type == "missing":
            msg = "Vui lòng không để trống"
        elif "value is not a valid email address" in raw_msg.lower() or "email" in err_type:
            msg = "Địa chỉ email không đúng định dạng"
        elif "at least" in raw_msg.lower() and "characters" in raw_msg.lower():
            m = re.search(r"at least (\d+)", raw_msg)
            msg = f"Phải có tối thiểu {m.group(1)} ký tự" if m else raw_msg
        elif "at most" in raw_msg.lower() and "characters" in raw_msg.lower():
            m = re.search(r"at most (\d+)", raw_msg)
            msg = f"Độ dài tối đa không quá {m.group(1)} ký tự" if m else raw_msg
        elif "greater than 0" in raw_msg.lower() or "greater_than" in err_type:
            msg = "Giá trị phải lớn hơn 0"
        elif "valid integer" in raw_msg.lower():
            msg = "Phải là số nguyên hợp lệ"
        else:
            msg = raw_msg

        messages.append(f"{field_label}: {msg}")

    if not messages:
        return "Dữ liệu nhập vào chưa chính xác. Vui lòng kiểm tra lại."
    return " | ".join(messages[:3])


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    detailed_errors = jsonable_encoder(exc.errors())
    user_friendly_message = _format_validation_error_message(detailed_errors)
    return JSONResponse(
        status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": user_friendly_message,
                "details": detailed_errors,
            }
        },
    )


# Health check
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
    }


# Mount API V1 Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(catalog_router, prefix=api_v1)
app.include_router(listings_router, prefix=api_v1)
app.include_router(appointments_router, prefix=api_v1)
app.include_router(chats_router, prefix=api_v1)
app.include_router(reviews_router, prefix=api_v1)
app.include_router(favorites_router, prefix=api_v1)
app.include_router(notifications_router, prefix=api_v1)
app.include_router(users_router, prefix=api_v1)
app.include_router(admin_router, prefix=api_v1)
app.include_router(ai_router, prefix=api_v1)
app.include_router(media_router, prefix=api_v1)
app.include_router(articles_router, prefix=api_v1)
app.include_router(showrooms_router, prefix=api_v1)
app.include_router(trust_router, prefix=api_v1)
app.include_router(payments_router, prefix=api_v1)

# Static Uploads directory mount (for local fallback)
upload_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")
