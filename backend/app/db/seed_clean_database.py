import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.catalog import VehicleBrand, VehicleModel
from app.models.listing import Listing, ListingRevision, ListingMedia, ListingStatusEvent
from app.models.appointment import Appointment, AppointmentEvent
from app.models.article import Article

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("🌱 Bắt đầu nạp dữ liệu sạch vào cơ sở dữ liệu PostgreSQL...")

        # 1. Get users
        res = await db.execute(select(User).where(User.email == "admin@otocu.vn"))
        admin_user = res.scalar_one_or_none()

        res = await db.execute(select(User).where(User.email == "hiep@gmail.com"))
        seller_user = res.scalar_one_or_none()

        res = await db.execute(select(User).where(User.email == "seller@gmail.com"))
        seller_user_2 = res.scalar_one_or_none() or seller_user

        res = await db.execute(select(User).where(User.email == "luxury.buyer2@auraauto.vn"))
        buyer_user = res.scalar_one_or_none()

        if not admin_user or not seller_user:
            print("❌ Không tìm thấy user admin hoặc seller cơ bản")
            return

        # 2. Get brands & models
        async def get_bm(brand_slug, model_name):
            b_res = await db.execute(select(VehicleBrand).where(VehicleBrand.slug == brand_slug))
            brand = b_res.scalar_one_or_none()
            if not brand:
                return None, None
            m_res = await db.execute(select(VehicleModel).where(VehicleModel.brand_id == brand.id, VehicleModel.name.ilike(f"%{model_name}%")))
            model = m_res.scalars().first()
            return brand, model

        # List of vehicles to seed
        cars_data = [
            {
                "brand_slug": "porsche",
                "model_query": "Panamera",
                "title": "Porsche Panamera 4S Executive 2022",
                "price_vnd": 5_850_000_000,
                "year": 2022,
                "odo": 24500,
                "body": "SEDAN",
                "fuel": "GASOLINE",
                "trans": "AUTOMATIC",
                "color": "Trắng Ánh Kim",
                "interior": "Nâu Cognac",
                "seats": 4,
                "doors": 4,
                "province": "01",
                "status": "PUBLISHED",
                "desc": "Porsche Panamera 4S bản trục cơ sở kéo dài Executive. Động cơ V6 2.9L Twin-Turbo 440 mã lực, dẫn động 4 bánh toàn thời gian AWD. Xe một chủ đặt mua chính hãng Porsche Việt Nam, đầy đủ lịch sử bảo dưỡng định kỳ.",
                "images": [
                    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "brand_slug": "mercedes-benz",
                "model_query": "C-Class",
                "title": "Mercedes-Benz C200 Exclusive 2020 Nhập Khẩu",
                "price_vnd": 1_180_000_000,
                "year": 2020,
                "odo": 42000,
                "body": "SEDAN",
                "fuel": "GASOLINE",
                "trans": "AUTOMATIC",
                "color": "Đen Obsidian",
                "interior": "Đen Artico",
                "seats": 5,
                "doors": 4,
                "province": "79",
                "status": "PUBLISHED",
                "desc": "Mercedes C200 Exclusive xe gia đình sử dụng giữ gìn, lốp sơ cua chưa hạ. Trang bị đèn Multibeam LED thông minh, loa Burmester cao cấp, ốp gỗ óc chó mờ sang trọng.",
                "images": [
                    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "brand_slug": "bmw",
                "model_query": "X7",
                "title": "BMW X7 xDrive40i Pure Excellence 2022",
                "price_vnd": 5_290_000_000,
                "year": 2022,
                "odo": 19500,
                "body": "SUV",
                "fuel": "GASOLINE",
                "trans": "AUTOMATIC",
                "color": "Xanh Phytonic",
                "interior": "Nâu Tartufo",
                "seats": 7,
                "doors": 5,
                "province": "79",
                "status": "PUBLISHED",
                "desc": "SUV Full-size đầu bảng của BMW. Động cơ I6 B58 3.0L TwinPower Turbo danh tiếng, cửa sổ trời toàn cảnh Sky Lounge 15.000 điểm sáng LED, hệ thống treo khí nén 2 cầu êm ái.",
                "images": [
                    "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "brand_slug": "mazda",
                "model_query": "CX-5",
                "title": "Mazda CX-5 2.0 Premium 2022 Màu Đỏ Pha Lê",
                "price_vnd": 765_000_000,
                "year": 2022,
                "odo": 26000,
                "body": "SUV",
                "fuel": "GASOLINE",
                "trans": "AUTOMATIC",
                "color": "Đỏ Soul Red Crystal",
                "interior": "Đen",
                "seats": 5,
                "doors": 5,
                "province": "01",
                "status": "PUBLISHED",
                "desc": "Mazda CX-5 bản Premium cao cấp đầy đủ gói an toàn chủ động i-Activsense (phanh tự động, cảnh báo điểm mù, giữ làn). Nội thất da Nappa, màn hình HUD kính lái.",
                "images": [
                    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "brand_slug": "toyota",
                "model_query": "Vios",
                "title": "Toyota Vios 1.5G CVT 2021 Màu Trắng Ngọc Trai",
                "price_vnd": 475_000_000,
                "year": 2021,
                "odo": 35000,
                "body": "SEDAN",
                "fuel": "GASOLINE",
                "trans": "AUTOMATIC",
                "color": "Trắng Ngọc Trai",
                "interior": "Kem Be",
                "seats": 5,
                "doors": 4,
                "province": "01",
                "status": "PUBLISHED",
                "desc": "Toyota Vios 1.5G bản cao cấp nhất, hộp số tự động vô cấp CVT, 7 túi khí an toàn. Xe đi giữ gìn cẩn thận, bảo dưỡng hãng định kỳ mỗi 5.000km.",
                "images": [
                    "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "brand_slug": "lexus",
                "model_query": "RX",
                "title": "Lexus RX 350 Luxury 2023 Thế Hệ Mới",
                "price_vnd": 4_180_000_000,
                "year": 2023,
                "odo": 11000,
                "body": "SUV",
                "fuel": "GASOLINE",
                "trans": "AUTOMATIC",
                "color": "Xám Sonic Titanium",
                "interior": "Nâu Da Bò",
                "seats": 5,
                "doors": 5,
                "province": "01",
                "status": "PUBLISHED",
                "desc": "Lexus RX 350 Luxury thế hệ hoàn toàn mới. Động cơ Turbo 2.4L 275 mã lực, hệ thống âm thanh Mark Levinson 21 loa đỉnh cao. Sơn zin 100%, bảo hành chính hãng đến 2028.",
                "images": [
                    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "brand_slug": "vinfast",
                "model_query": "VF 8",
                "title": "VinFast VF 8 Plus Pin Tiên Phong 2023",
                "price_vnd": 850_000_000,
                "year": 2023,
                "odo": 18000,
                "body": "SUV",
                "fuel": "ELECTRIC",
                "trans": "AUTOMATIC",
                "color": "Xanh Deep Ocean",
                "interior": "Nâu Saddle Brown",
                "seats": 5,
                "doors": 5,
                "province": "01",
                "status": "PENDING_REVIEW",  # Waiting for admin review!
                "desc": "VinFast VF 8 bản Plus 2 motor 402 mã lực dẫn động AWD. Đã thuê pin gói linh hoạt giá rẻ. Xe trang bị đầy đủ trợ lái nâng cao ADAS cấp độ 2, màn hình trung tâm 15.6 inch.",
                "images": [
                    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                "brand_slug": "mercedes-benz",
                "model_query": "S-Class",
                "title": "Mercedes-Maybach S450 4MATIC 2021",
                "price_vnd": 7_200_000_000,
                "year": 2021,
                "odo": 18000,
                "body": "SEDAN",
                "fuel": "GASOLINE",
                "trans": "AUTOMATIC",
                "color": "Đen Obsidian / Bạc Maybach",
                "interior": "Kem Nappa Exclusive",
                "seats": 4,
                "doors": 4,
                "province": "79",
                "status": "SOLD",  # Sold status!
                "desc": "Siêu sedan hạng thương gia Mercedes-Maybach S450. Hàng ghế sau thương gia ngả 43.5 độ kèm đỡ bắp chân, tủ lạnh mini và ly bạc Robbe & Berking. Đã giao dịch thành công.",
                "images": [
                    "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80"
                ]
            }
        ]

        seeded_listings = []
        now = datetime.now(timezone.utc)

        for item in cars_data:
            # Check if exists by title
            check = await db.execute(select(ListingRevision).where(ListingRevision.title == item["title"]))
            if check.scalar_one_or_none():
                print(f"⏩ Đã có: {item['title']}")
                continue

            brand, model = await get_bm(item["brand_slug"], item["model_query"])
            if not brand or not model:
                print(f"⚠️ Bỏ qua {item['title']}: Không tìm thấy brand/model")
                continue

            listing = Listing(
                seller_user_id=seller_user.id if item["status"] != "SOLD" else seller_user_2.id,
                status=item["status"],
                version=1,
                published_at=now if item["status"] == "PUBLISHED" else None,
                sold_at=now if item["status"] == "SOLD" else None,
            )
            db.add(listing)
            await db.flush()

            rev = ListingRevision(
                listing_id=listing.id,
                revision_no=1,
                brand_id=brand.id,
                model_id=model.id,
                title=item["title"],
                price_vnd=item["price_vnd"],
                manufacture_year=item["year"],
                odometer_km=item["odo"],
                condition="USED",
                body_type=item["body"],
                fuel_type=item["fuel"],
                transmission=item["trans"],
                color=item["color"],
                interior_color=item["interior"],
                seats=item["seats"],
                doors=item["doors"],
                province_code=item["province"],
                location_address="Hà Nội" if item["province"] == "01" else "TP. Hồ Chí Minh",
                description=item["desc"],
                review_status="APPROVED" if item["status"] in ("PUBLISHED", "SOLD") else "PENDING",
                reviewed_by_user_id=admin_user.id if item["status"] in ("PUBLISHED", "SOLD") else None,
                reviewed_at=now if item["status"] in ("PUBLISHED", "SOLD") else None,
            )
            db.add(rev)
            await db.flush()

            listing.published_revision_id = rev.id
            seeded_listings.append(listing)

            # Media
            for idx, img_url in enumerate(item["images"]):
                m = ListingMedia(
                    revision_id=rev.id,
                    media_type="IMAGE",
                    url=img_url,
                    sort_order=idx + 1,
                    is_primary=(idx == 0)
                )
                db.add(m)

            print(f"✅ Đã thêm xe vào DB: {item['title']} ({item['status']})")

        # 3. Seed real appointments
        if seeded_listings and buyer_user:
            target_listing = seeded_listings[0]
            appt_check = await db.execute(select(Appointment).where(Appointment.listing_id == target_listing.id))
            if not appt_check.scalar_one_or_none():
                # Confirmed appointment
                appt1 = Appointment(
                    listing_id=target_listing.id,
                    buyer_user_id=buyer_user.id,
                    seller_user_id=target_listing.seller_user_id,
                    scheduled_at=now + timedelta(days=2),
                    location="Showroom AuraAuto Cầu Giấy, Hà Nội",
                    note="Hẹn lái thử đường trường và kiểm tra độ nguyên bản thân vỏ",
                    status="CONFIRMED"
                )
                db.add(appt1)

                # Pending appointment on 2nd car
                if len(seeded_listings) > 1:
                    appt2 = Appointment(
                        listing_id=seeded_listings[1].id,
                        buyer_user_id=buyer_user.id,
                        seller_user_id=seeded_listings[1].seller_user_id,
                        scheduled_at=now + timedelta(days=4),
                        location="Showroom Thảo Điền, TP. Hồ Chí Minh",
                        note="Khách hẹn xem xe vào chiều thứ 7",
                        status="PENDING"
                    )
                    db.add(appt2)

                print("✅ Đã nạp 2 lịch hẹn mẫu liên kết cơ sở dữ liệu")

        # 4. Seed articles
        article_titles = [
            "Kinh nghiệm chọn mua xe SUV hạng sang đã qua sử dụng an tâm tuyệt đối",
            "Đánh giá chi tiết pin và hệ thống trạm sạc xe điện tại Việt Nam 2026"
        ]
        for atitle in article_titles:
            art_check = await db.execute(select(Article).where(Article.title == atitle))
            if not art_check.scalar_one_or_none():
                art = Article(
                    title=atitle,
                    slug="kinh-nghiem-chon-mua-xe-suv-2026" if "SUV" in atitle else "danh-gia-xe-dien-2026",
                    summary="Cẩm nang chi tiết hướng dẫn kiểm tra lịch sử xe, đánh giá tình trạng kỹ thuật và thủ tục sang tên hợp pháp.",
                    content="Bài viết cung cấp các thông tin hữu ích về việc kiểm định xe cũ, các điểm cần lưu ý khi lái thử và kinh nghiệm thương lượng giá bán thực tế.",
                    category="KINH NGHIỆM" if "SUV" in atitle else "ĐÁNH GIÁ XE",
                    thumbnail_url="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
                    status="PUBLISHED",
                    author_id=admin_user.id,
                    published_at=now
                )
                db.add(art)
                print(f"✅ Đã thêm bài viết tin tức: {atitle}")

        await db.commit()
        print("🎉 Hoàn tất nạp dữ liệu sạch vào PostgreSQL thành công 100%!")

if __name__ == "__main__":
    asyncio.run(seed_data())
