# Backend — Website Mua Bán Ô Tô Cũ Tích Hợp AI

Nền tảng backend được xây dựng bằng **FastAPI** theo kiến trúc **Modular Monolith**, tuân thủ nghiêm ngặt bộ hồ sơ đặc tả nghiệp vụ `HoSo_OtoCu_v1`.

---

## 1. Công nghệ chính (Tech Stack)

* **Framework:** FastAPI (Python 3.12+)
* **Database:** PostgreSQL (SQLAlchemy 2.x async ORM, Alembic migrations)
* **Xác thực:** JWT Access/Refresh tokens, bcrypt password hashing
* **Realtime:** WebSockets chat 2 chiều & thông báo
* **AI/ML:** CatBoost, Scikit-learn, Conformal residual calibration
* **Gemini API:** Trích xuất bộ lọc tìm kiếm tiếng Việt và diễn giải định giá
* **Storage:** Cloudinary (upload ảnh/video xe)
* **Container:** Docker & Docker Compose

---

## 2. Cấu trúc thư mục

```text
backend/
├── app/
│   ├── core/                  # Cấu hình hệ thống, database, security, dependencies
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── deps.py
│   │   └── security.py
│   ├── models/                # SQLAlchemy ORM Models (32 thực thể)
│   │   ├── user.py, showroom.py, catalog.py, listing.py
│   │   ├── appointment.py, review.py, chat.py, favorite.py
│   │   ├── trust.py, notification.py, ai.py, audit.py
│   ├── shared/                # Exception handlers, schemas phân trang, wrappers
│   ├── modules/               # Các module chức năng độc lập
│   │   ├── auth/              # Đăng ký, đăng nhập, xác thực email, refresh token
│   │   ├── users/             # Hồ sơ cá nhân & showroom
│   │   ├── catalog/           # Hãng xe, dòng xe, phiên bản
│   │   ├── listings/          # Đăng tin nháp, gửi duyệt, bộ lọc, xem chi tiết, so sánh, đã bán
│   │   ├── appointments/      # Đặt lịch hẹn xem xe, xác nhận, từ chối, hủy, hoàn tất
│   │   ├── chats/             # Chat realtime qua WebSocket & lưu trữ tin nhắn
│   │   ├── reviews/           # Đánh giá người bán sau buổi hẹn hoàn thành
│   │   ├── favorites/         # Lưu/bỏ lưu xe yêu thích
│   │   ├── admin/             # Duyệt tin đăng, chỉ số dashboard, quản lý tài khoản
│   │   └── ai/                # Định giá xe ML, tìm kiếm tiếng Việt (Gemini), gợi ý đa tiêu chí
│   └── main.py                # FastAPI Application & Lifespan seed data
├── migrations/                # Alembic migration scripts
├── tests/                     # Unit test & Integration test
├── Dockerfile                 # Docker container build
├── docker-compose.yml         # Khởi chạy PostgreSQL + Backend
├── requirements.txt           # Danh sách thư viện Python
└── .env.example               # Mẫu cấu hình biến môi trường
```

---

## 3. Hướng dẫn cài đặt & Khởi chạy

### Cách 1: Chạy trực tiếp với Python Virtual Environment

1. **Tạo và kích hoạt môi trường ảo:**
   ```bash
   cd backend
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```

2. **Cài đặt thư viện:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Cấu hình biến môi trường:**
   Sao chép `.env.example` thành `.env` và cập nhật thông tin:
   ```bash
   cp .env.example .env
   ```

4. **Khởi chạy ứng dụng:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **Truy cập tài liệu API (Swagger UI):**
   * Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   * ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
   * Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

### Cách 2: Chạy với Docker Compose (Khuyên dùng)

Khởi chạy đồng thời PostgreSQL 16 và Backend FastAPI chỉ với 1 câu lệnh:

```bash
cd backend
docker compose up -d --build
```

---

## 4. Tài khoản Admin khởi tạo mặc định (Seed Data)

Khi khởi động lần đầu, hệ thống tự động khởi tạo:
* **Email:** `admin@otocu.vn`
* **Mật khẩu:** `Admin@123456`
* **Danh mục xe:** Toyota, Hyundai, Mazda, Kia, Honda, Ford, Mitsubishi, VinFast cùng các dòng xe tiêu biểu.
