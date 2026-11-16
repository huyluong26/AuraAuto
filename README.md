# 🚗 AuraAuto - Nền Tảng Mua Bán Ô Tô Cũ Tích Hợp AI & Gemini

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-336791.svg?logo=postgresql&logoColor=white)](https://neon.tech)
[![Gemini](https://img.shields.io/badge/Google_Gemini-Vision_AI-4285F4.svg?logo=google&logoColor=white)](https://ai.google.dev)
[![VNPay](https://img.shields.io/badge/VNPay-Payment_Gateway-0066B3.svg)](https://vnpay.vn)

Nền tảng giao dịch xe ô tô đã qua sử dụng hiện đại, ứng dụng Trí tuệ Nhân tạo hỗ trợ định giá xe thông minh, nhận diện phương tiện qua ảnh chụp, tích hợp thanh toán VNPay và quy trình kiểm duyệt tin chuyên nghiệp.

---

## 📑 Tài Liệu Hệ Thống Chi Tiết
Toàn bộ đặc tả kiến trúc, sơ đồ cơ sở dữ liệu và các quy trình nghiệp vụ chuyên sâu đã được biên soạn đầy đủ tại:
👉 **[Xem Tài Liệu Đặc Tả Hệ Thống Toàn Diện (docs/SYSTEM_DOCUMENTATION.md)](docs/SYSTEM_DOCUMENTATION.md)**

---

## 🌟 Tính Năng Nổi Bật

1. **Quy Trình Duyệt & Sửa Tin 2 Bước (Zero-Downtime):** Tin đã đăng khi được người bán chỉnh sửa sẽ không bị gỡ xuống mà vẫn hiển thị bình thường với dữ liệu cũ; phiên bản chỉnh sửa được lưu riêng để Admin xét duyệt trước khi áp dụng.
2. **AI Valuation & Gemini Vision:**
   - Thuật toán định giá xe đa biến số (Odo, năm sản xuất, kiểu dáng, lịch sử xe).
   - Google Gemini AI tự động nhận diện thương hiệu, dòng xe, năm sản xuất từ hình ảnh thực tế.
3. **Thanh Toán VNPay Mua Gói Tin Nổi Bật (VIP):** Tích hợp cổng VNPay với mã hóa HMAC-SHA512 và IPN Webhook tự động kích hoạt huy hiệu nổi bật cho xe.
4. **Phân Hệ Showroom Đối Tác:**
   - Bộ nhận diện thương hiệu Salon (Logo, Banner, Hotline, Địa chỉ).
   - **Tự động điền địa chỉ Showroom** khi đăng bài bán xe.
   - Trang hồ sơ Showroom công khai dành cho khách hàng.
5. **Hệ Thống Lịch Hẹn & Thông Báo:** Đặt lịch hẹn xem xe trực tiếp, đồng ý/từ chối/hủy lịch hẹn và thông báo tự động.
6. **Trung Tâm Quản Trị Admin Toàn Diện:** Dashboard KPI doanh thu, duyệt tin, quản lý thành viên & showroom (hỗ trợ thao tác hàng loạt), cấu hình giá cước khuyến mãi.

---

## 🚀 Khởi Động Nhanh (Quick Start)

### 1. Khởi động Backend (Docker / Local)
```bash
# Sử dụng Docker Compose
docker compose up -d --build

# Hoặc chạy trực tiếp trên môi trường Python
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Khởi động Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Truy cập giao diện người dùng: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Tài Liệu API & Swagger UI

FastAPI tự động khởi tạo tài liệu OpenAPI 3.1 với **101 Endpoints** được phân loại thành 17 Tags rõ ràng:
- **Swagger UI Interactive:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema (JSON):** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 🔑 Tài Khoản Kiểm Thử Mặc Định

| Vai trò | Email đăng nhập | Mật khẩu mặc định |
| :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@otocu.vn` | `Admin@123456` |
| **Đối tác Showroom** | `auto88@gmail.com` | `Auto88@123` |

---

## 🧹 Script Dọn Dẹp Cơ Sở Dữ Liệu
Khi cần làm sạch dữ liệu sau các đợt test tự động (chỉ giữ lại Admin, Showroom, Tin xe và Tin tức):
```bash
docker exec -e PYTHONPATH=/app used_cars_backend python scripts/clean_database.py
```
