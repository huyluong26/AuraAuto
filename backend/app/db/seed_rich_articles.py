import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.article import Article
from app.models.user import User

ARTICLES = [
    {
        "slug": "xu-huong-gia-o-to-cu-cuoi-nam-2026-co-hoi-vang-cho-nguoi-mua-xe-luot",
        "title": "Xu hướng giá ô tô cũ cuối năm 2026: Cơ hội vàng cho người mua xe lướt",
        "summary": "Phân tích toàn cảnh thị trường ô tô đã qua sử dụng quý 4/2026. Dữ liệu từ AuraAuto AI ghi nhận mức chiết khấu hấp dẫn ở phân khúc sedan và SUV hạng sang lướt dưới 20.000 km.",
        "category": "THỊ TRƯỜNG",
        "thumbnail_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "views_count": 348,
        "content": """### Bức tranh toàn cảnh thị trường ô tô quý 4/2026

Bước vào những tháng cuối năm 2026, thị trường ô tô đã qua sử dụng tại Việt Nam đang chứng kiến làn sóng sôi động nhất trong vòng 3 năm qua. Nguồn cung xe lướt (dưới 2 năm sử dụng, ODO dưới 25.000 km) từ các cá nhân và doanh nghiệp tăng trưởng 32% so với cùng kỳ năm trước.

Sự bùng nổ này bắt nguồn từ việc các hãng xe liên tục tung ra các mẫu xe điện và Hybrid thế hệ mới, thúc đẩy nhóm khách hàng sở hữu xe hạng sang có xu hướng nâng cấp sớm hơn chu kỳ thông thường.

---

### Dữ liệu định giá AI: Mức giá xe lướt hấp dẫn chưa từng có

Theo thuật toán định giá thông minh CatBoost của AuraAuto - phân tích từ hơn 180.000 giao dịch thực tế trên toàn quốc:

1. **Phân khúc C-SUV & D-SUV (Mazda CX-5, Hyundai Tucson, Ford Everest):** Giá chuyển nhượng ổn định ở mức tốt, giữ giá khoảng 84% - 88% sau 18 tháng sử dụng.
2. **Phân khúc Flagship Luxury (Mercedes-Benz C/E-Class, BMW 5 Series, Porsche Panamera):** Tỷ lệ khấu hao năm thứ 2 chạm mức lý tưởng cho người mua lại, tiết kiệm từ 400 triệu đến 1.2 tỷ đồng so với việc lăn bánh xe mới nguyên bản.
3. **Phân khúc xe điện cao cấp:** Bắt đầu hình thành biểu đồ định giá thanh khoản rõ ràng, đặc biệt với các dòng xe VinFast VF 8, Porsche Taycan nhờ cam kết bảo hành pin dài hạn từ nhà sản xuất.

---

### 4 Tiêu chí vàng khi săn xe lướt cuối năm

Để đảm bảo quyền lợi tối đa khi xuống tiền mua xe cũ trong dịp cao điểm này, chuyên gia kiểm định AuraAuto khuyến nghị:

- **Kiểm tra lịch sử bảo dưỡng chính hãng:** Yêu cầu sổ theo dõi hoặc trích xuất lịch sử điện tử từ xưởng dịch vụ ủy quyền để xác thực ODO thực tế.
- **Thẩm định khung gầm và kết cấu chịu lực:** Tuyệt đối không giao dịch những phương tiện có dấu hiệu can thiệp tai nạn ảnh hưởng đến sắt-xi hoặc ngập nước/thủy kích.
- **Sử dụng dịch vụ kiểm định độc lập 200 điểm:** Báo cáo kiểm định chuyên sâu sẽ chỉ rõ độ mòn má phanh, tình trạng gioăng cao su, thước lái và dung lượng bình điện/ắc quy.
- **Minh bạch pháp lý và hồ sơ sang tên:** Đảm bảo xe không bị phạt nguội tồn đọng, không có tranh chấp thế chấp ngân hàng chưa giải chấp.

---

### Lời kết

Thời điểm quý 4 là cơ hội lý tưởng để sở hữu một chiếc xe chất lượng cao với chi phí tối ưu. Khách hàng hãy chủ động tham khảo công cụ Định giá AI và đặt lịch xem xe trực tiếp cùng chuyên viên kiểm định AuraAuto để có trải nghiệm an tâm tuyệt đối."""
    },
    {
        "slug": "kinh-nghiem-chon-mua-xe-suv-2026",
        "title": "Kinh nghiệm chọn mua xe SUV hạng sang đã qua sử dụng an tâm tuyệt đối",
        "summary": "Cẩm nang hướng dẫn kiểm tra lịch sử xe, đánh giá tình trạng động cơ, hộp số tự động và các bước nghiệm thu hệ thống treo khí nén trên các dòng SUV cao cấp.",
        "category": "KINH NGHIỆM",
        "thumbnail_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
        "views_count": 512,
        "content": """### Tại sao SUV hạng sang cũ luôn là tâm điểm săn đón?

Không gian rộng rãi, vị trí ngồi cao bao quát tầm nhìn, khả năng cách âm đỉnh cao và vị thế thương hiệu là những lý do hàng đầu khiến các mẫu SUV như Lexus RX 350, BMW X5/X7, Mercedes-Benz GLE luôn giữ vững sức hút mãnh liệt.

Tuy nhiên, với cấu tạo cơ khí phức tạp cùng hàng loạt công nghệ hiện đại, việc thẩm định một chiếc SUV đã qua sử dụng đòi hỏi người mua phải nắm vững các kinh nghiệm cốt lõi dưới đây.

---

### Kiểm tra hệ thống treo khí nén (Air Suspension)

Hầu hết các dòng SUV sang đều trang bị treo khí nén thích ứng. Đây là chi tiết đắt đỏ nhất khi cần thay thế:
- Nổ máy xe trên mặt đường bằng phẳng, thử nâng hạ gầm qua các nấc chế độ lái (Comfort, Sport, Offroad).
- Lắng nghe tiếng máy nén khí: Nếu máy bơm hoạt động liên tục quá 2 phút hoặc phát ra tiếng ồn lớn, hệ thống có thể bị rò rỉ gioăng bóng hơi.
- Đỗ xe qua đêm và đo chiều cao các vòm bánh xe xem có hiện tượng xẹp bất thường ở một góc nào không.

---

### Soi kỹ động cơ tăng áp và hộp số đa cấp

- **Dấu hiệu ẩm dầu:** Dùng đèn pin kiểm tra quanh nắp giàn cò, đáy cacte dầu và cụm turbo tăng áp. Xe vận hành chuẩn phải khô ráo, không có vệt dầu nhớt đóng cặn.
- **Thử chuyển số ở dải tốc độ thấp:** Lái thử xe ở chế độ ga nhẹ từ số 1 lên số 3. Quá trình chuyển số phải mượt mà, không xảy ra hiện tượng giật cục (delay hay kick-down gắt đột ngột).

---

### Xác minh lịch sử ngập nước và mùi nội thất

Nội thất da cao cấp của xe sang rất kỵ ẩm mốc. Hãy lật mép thảm lót sàn, kiểm tra chân bàn đạp ga/phanh và giắc cắm điện dưới ghế lái:
- Nếu bu-lông chân ghế có vết vặn tháo dỡ hoặc ố rỉ sét, cần đặt câu hỏi nghi vấn xe từng bị tràn nước.
- Dây đai an toàn kéo hết cỡ xem phần cuối dây có bị ngả màu ố vàng hay không."""
    },
    {
        "slug": "danh-gia-xe-dien-2026",
        "title": "Đánh giá chi tiết pin và hệ thống trạm sạc xe điện tại Việt Nam 2026",
        "summary": "Phân tích độ thoái hóa pin Lithium-ion sau 50.000 km vận hành thực tế tại khí hậu nhiệt đới gió mùa Việt Nam và mạng lưới trạm sạc siêu nhanh 360kW.",
        "category": "ĐÁNH GIÁ XE",
        "thumbnail_url": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
        "views_count": 689,
        "content": """### Xe điện cũ: Tỷ lệ thoái hóa pin thực tế ra sao?

Một trong những băn khoăn lớn nhất của khách hàng khi cân nhắc mua xe ô tô điện đã qua sử dụng là tuổi thọ và dung lượng thực tế của pack pin (State of Health - SoH).

Dữ liệu chẩn đoán kỹ thuật số từ hơn 500 mẫu xe điện được kiểm định tại AuraAuto năm 2026 mang lại kết quả đáng kinh ngạc:
- Sau 3 năm vận hành hoặc trung bình 50.000 km, chỉ số SoH của các dòng pin thế hệ mới chỉ giảm trung bình từ 2.1% đến 3.8%.
- Hệ thống quản lý nhiệt độ pin chủ động (Liquid Thermal Management) giúp cell pin duy trì nhiệt độ tối ưu ngay cả trong những ngày hè nhiệt độ mặt đường vượt 45°C.

---

### Hạ tầng trạm sạc năm 2026: Phủ sóng toàn diện

- Mạng lưới trạm sạc công cộng đã hiện diện tại 100% các trạm dừng nghỉ trên hệ thống cao tốc Bắc - Nam và các tỉnh lộ huyết mạch.
- Thời gian sạc siêu nhanh từ 10% lên 80% chỉ còn khoảng 18 - 25 phút đối với các dòng xe sử dụng kiến trúc điện áp 800V.
- Ứng dụng tích hợp thanh toán thông minh một chạm giúp người lái dễ dàng tìm kiếm cổng sạc còn trống theo thời gian thực."""
    },
    {
        "slug": "thu-tuc-sang-ten-doi-chu-o-to-cu-2026",
        "title": "Toàn bộ quy trình thủ tục sang tên đổi chủ ô tô cũ và biển số định danh 2026",
        "summary": "Hướng dẫn chi tiết thủ tục công chứng hợp đồng mua bán, rút hồ sơ gốc trực tuyến qua Cổng Dịch vụ công Quốc gia và nộp lệ phí trước bạ không dùng tiền mặt.",
        "category": "PHÁP LÝ",
        "thumbnail_url": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
        "views_count": 420,
        "content": """### Quy định pháp lý về biển số định danh khi mua bán xe cũ

Theo thông tư hiện hành về quản lý biển số định danh, khi chuyển nhượng xe ô tô, chủ cũ sẽ giữ lại biển số định danh của mình, và xe sẽ được làm thủ tục thu hồi đăng ký để cấp biển số định danh mới cho chủ sở hữu tiếp theo.

---

### Quy trình 4 bước sang tên xe trọn gói

1. **Công chứng hợp đồng mua bán:** Hai bên mang đầy đủ Căn cước công dân gắn chip, đăng ký xe, đăng kiểm gốc và giấy tờ xác nhận tình trạng hôn nhân đến Văn phòng Công chứng.
2. **Kê khai thu hồi đăng ký, biển số:** Chủ cũ thực hiện nộp hồ sơ thu hồi trực tuyến trên Cổng dịch vụ công hoặc ủy quyền cho bên thứ ba thực hiện tại cơ quan Công an thụ lý.
3. **Nộp lệ phí trước bạ (2% giá trị định giá xe cũ):** Thực hiện kê khai thuế điện tử và thanh toán qua ứng dụng ngân hàng hoặc cổng dịch vụ công trực tiếp.
4. **Bấm biển số định danh mới:** Mang xe đến điểm đăng ký quản lý cư trú của người mua để kiểm tra số khung, số máy và bấm biển số."""
    }
]

async def update_articles():
    async with AsyncSessionLocal() as session:
        # Get admin user
        res = await session.execute(select(User).where(User.role == 'ADMIN').limit(1))
        admin = res.scalar_one_or_none()
        if not admin:
            res = await session.execute(select(User).limit(1))
            admin = res.scalar_one()

        for art_data in ARTICLES:
            slug = art_data["slug"]
            res = await session.execute(select(Article).where(Article.slug == slug))
            existing = res.scalar_one_or_none()
            now = datetime.now(timezone.utc)

            if existing:
                existing.title = art_data["title"]
                existing.summary = art_data["summary"]
                existing.content = art_data["content"]
                existing.category = art_data["category"]
                existing.thumbnail_url = art_data["thumbnail_url"]
                existing.status = "PUBLISHED"
                existing.views_count = art_data["views_count"]
                if not existing.published_at:
                    existing.published_at = now
            else:
                new_art = Article(
                    title=art_data["title"],
                    slug=slug,
                    summary=art_data["summary"],
                    content=art_data["content"],
                    category=art_data["category"],
                    thumbnail_url=art_data["thumbnail_url"],
                    status="PUBLISHED",
                    views_count=art_data["views_count"],
                    author_id=admin.id,
                    published_at=now
                )
                session.add(new_art)

        await session.commit()
        print("Successfully updated and seeded rich articles!")

if __name__ == "__main__":
    asyncio.run(update_articles())
