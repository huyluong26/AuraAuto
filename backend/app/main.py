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
    # In development mode, initialize schema and seed initial data if needed
    if settings.ENVIRONMENT.lower() == "development":
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        try:
            await seed_initial_data()
        except Exception as e:
            logger.warning(f"Seed data skipped or already present: {e}")
    yield


TAGS_METADATA = [
    {
        "name": "Authentication",
        "description": "Đăng ký tài khoản, đăng nhập JWT, đổi mật khẩu, xác thực email và Google OAuth identity.",
    },
    {
        "name": "Users",
        "description": "Quản lý hồ sơ cá nhân, đổi mật khẩu, xem trang hồ sơ người bán công khai (Seller Public Profile).",
    },
    {
        "name": "Showrooms",
        "description": "Hồ sơ đối tác Showroom / Salon xe hơi, danh sách showroom công khai và đăng ký nâng cấp đối tác.",
    },
    {
        "name": "Listings",
        "description": "Đăng tin bán xe, quản lý tin cá nhân, sửa tin duyệt 2 bước (tin cũ hiển thị trong lúc chờ duyệt), đánh dấu đã bán.",
    },
    {
        "name": "Catalog",
        "description": "Danh mục thương hiệu xe toàn cầu, các dòng xe (Models), phiên bản và kiểu dáng tiêu chuẩn.",
    },
    {
        "name": "AI",
        "description": "Thẩm định định giá xe thông minh đa biến số và nhận diện hãng/dòng/năm sản xuất qua ảnh chụp với Google Gemini AI.",
    },
    {
        "name": "Payments & Promotions",
        "description": "Cấu hình gói đẩy tin nổi bật VIP, tạo URL thanh toán VNPay và xử lý webhook IPN xác thực giao dịch.",
    },
    {
        "name": "Appointments",
        "description": "Đặt lịch hẹn xem xe trực tiếp giữa người mua và người bán, xác nhận/hủy lịch hẹn kèm lý do.",
    },
    {
        "name": "Chat",
        "description": "Hệ thống tin nhắn trao đổi realtime trực tiếp theo từng tin đăng xe giữa người mua và người bán.",
    },
    {
        "name": "Reviews",
        "description": "Đánh giá sao và nhận xét uy tín người bán sau khi hoàn tất xem xe hoặc giao dịch.",
    },
    {
        "name": "Favorites",
        "description": "Quản lý danh sách xe yêu thích và theo dõi cập nhật giá của người dùng.",
    },
    {
        "name": "Notifications",
        "description": "Trung tâm thông báo hệ thống tự động: lịch hẹn, trạng thái duyệt tin, kích hoạt VIP, cảnh báo bảo mật.",
    },
    {
        "name": "Admin",
        "description": "Trung tâm quản trị toàn diện: Dashboard số liệu, duyệt tin xe & duyệt sửa tin, quản trị thành viên & showroom hàng loạt, xử lý lịch hẹn, cấu hình giá gói khuyến mãi.",
    },
    {
        "name": "Trust & Reports",
        "description": "Báo cáo tin đăng/người dùng vi phạm, xử lý kiểm duyệt nội dung, bằng chứng vi phạm và quy trình khiếu nại.",
    },
    {
        "name": "Articles & News",
        "description": "Bài viết cẩm nang, đánh giá thị trường ô tô cũ, kinh nghiệm mua bán và bảo dưỡng xe.",
    },
    {
        "name": "Media",
        "description": "Tải lên và tối ưu hóa hình ảnh xe độ phân giải cao, logo và banner thương hiệu qua Cloudinary CDN.",
    },
    {
        "name": "System",
        "description": "Kiểm tra tình trạng sức khỏe máy chủ và môi trường dịch vụ (Health Check).",
    },
]

SWAGGER_DESCRIPTION = """
## 🚗 AuraAuto API - Nền Tảng Mua Bán Ô Tô Cũ Tích Hợp AI & Gemini

Chào mừng bạn đến với tài liệu API chính thức của **AuraAuto**. Hệ thống được xây dựng trên kiến trúc **Clean Architecture** hiện đại, cung cấp giải pháp toàn diện cho thị trường giao dịch ô tô cũ.

---

### 🌟 Các Tính Năng & Phân Hệ Trọng Tâm:
1. **Quy Trình Duyệt Tin 2 Bước Chuyên Nghiệp:** Cho phép người bán chỉnh sửa tin đăng xe đã hiển thị mà không làm gián đoạn người xem. Tin cũ vẫn hiển thị công khai với dữ liệu hiện tại, phiên bản sửa đổi được lưu riêng để Admin xét duyệt trước khi áp dụng.
2. **AI Car Valuation & Gemini Vision Recognition:** Ứng dụng mô hình AI định giá xe đa biến số kết hợp cùng mô hình **Google Gemini AI** nhận diện thông số xe (hãng, đời xe, năm sản xuất, kiểu dáng) trực tiếp từ hình ảnh thực tế.
3. **Thanh Toán VNPay & Gói Tin Nổi Bật (VIP):** Người bán có thể mua các gói đẩy tin nổi bật (1 ngày, 3 ngày, 7 ngày, 30 ngày) thanh toán an toàn qua cổng VNPay với chữ ký điện tử HMAC-SHA512 và IPN webhook tự động kích hoạt.
4. **Phân Hệ Showroom Đối Tác:** Hồ sơ nhận diện chuyên biệt dành cho Salon xe hơi chuyên nghiệp (logo, banner, hotline, địa chỉ tự động điền khi đăng tin).
5. **Trung Tâm Quản Trị Admin Toàn Diện:** Quản lý số liệu KPI, duyệt tin, quản lý thành viên showroom với thao tác chọn nhiều xử lý hàng loạt, quản trị gói cước khuyến mãi.

---

### 🔐 Hướng Dẫn Xác Thực (Authentication):
Hệ thống sử dụng chuẩn **JWT Bearer Token**. Để thử nghiệm các API yêu cầu quyền đăng nhập:
1. Gọi `POST /api/v1/auth/login` với tài khoản:
   - **Admin:** `admin@otocu.vn` | Mật khẩu: `Admin@123456`
   - **Showroom:** `auto88@gmail.com` | Mật khẩu: `Auto88@123`
2. Bấm nút **Authorize (🔓)** ở góc trên bên phải, dán `access_token` và bấm Xác nhận.
"""

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=SWAGGER_DESCRIPTION,
    openapi_tags=TAGS_METADATA,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Security Middlewares
from starlette.middleware.gzip import GZipMiddleware
from app.core.middleware import SecurityHeadersMiddleware, AuthSecurityMiddleware

# Response Gzip Compression for high speed over mobile networks
app.add_middleware(GZipMiddleware, minimum_size=1000)
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
