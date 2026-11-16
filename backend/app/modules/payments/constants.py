from typing import Dict, Any

PROMOTION_PACKAGES: Dict[str, Dict[str, Any]] = {
    "PROMO_1_DAY": {
        "code": "PROMO_1_DAY",
        "name": "Gói Nổi Bật 1 Ngày",
        "days": 1,
        "amount_vnd": 49000,
        "description": "Hiển thị ưu tiên tại chuyên mục Tin Nổi Bật trang chủ trong 24 giờ.",
        "badge": "24 Giờ",
    },
    "PROMO_3_DAYS": {
        "code": "PROMO_3_DAYS",
        "name": "Gói Nổi Bật 3 Ngày",
        "days": 3,
        "amount_vnd": 129000,
        "description": "Tăng cường tần suất hiển thị vào các ngày cao điểm tìm kiếm xe.",
        "badge": "3 Ngày",
    },
    "PROMO_7_DAYS": {
        "code": "PROMO_7_DAYS",
        "name": "Gói Nổi Bật 7 Ngày",
        "days": 7,
        "amount_vnd": 249000,
        "description": "Duy trì vị trí ưu tiên suốt 1 tuần, tối ưu tỷ lệ tiếp cận người mua thực tế.",
        "badge": "Phổ biến nhất",
    },
    "PROMO_30_DAYS": {
        "code": "PROMO_30_DAYS",
        "name": "Gói Nổi Bật 30 Ngày",
        "days": 30,
        "amount_vnd": 799000,
        "description": "Giải pháp hiển thị liên tục 1 tháng với chi phí trên mỗi ngày tối ưu nhất.",
        "badge": "Tiết kiệm nhất",
    },
}
