import pytest
from app.modules.ai.schemas import ValuationRequest
from app.modules.ai.valuation_engine import calculate_condition_adjustments


def test_flood_confirmed_deduction():
    req = ValuationRequest(
        brand="Toyota",
        model="Vios",
        manufacture_year=2021,
        odometer_km=40000,
        flood_status="CONFIRMED",
    )
    base_price = 500_000_000
    adj_price, multiplier, total_adj, items = calculate_condition_adjustments(base_price, req)

    flood_item = next((i for i in items if i.category == "FLOOD"), None)
    assert flood_item is not None
    assert flood_item.impact == "GIẢM"
    assert flood_item.percentage == -28.0
    assert flood_item.amount_vnd == -140_000_000
    assert adj_price < base_price
    assert multiplier < 1.0


def test_flood_suspected_deduction():
    req = ValuationRequest(
        brand="Mazda",
        model="CX-5",
        manufacture_year=2022,
        odometer_km=30000,
        flood_status="SUSPECTED",
    )
    base_price = 800_000_000
    adj_price, multiplier, total_adj, items = calculate_condition_adjustments(base_price, req)

    flood_item = next((i for i in items if i.category == "FLOOD"), None)
    assert flood_item is not None
    assert flood_item.impact == "GIẢM"
    assert flood_item.percentage == -10.0
    assert flood_item.amount_vnd == -80_000_000
    assert adj_price < base_price


def test_flood_none_preserves_value():
    req = ValuationRequest(
        brand="Honda",
        model="City",
        manufacture_year=2023,
        odometer_km=15000,
        flood_status="NONE",
    )
    base_price = 600_000_000
    adj_price, multiplier, total_adj, items = calculate_condition_adjustments(base_price, req)

    flood_item = next((i for i in items if i.category == "FLOOD"), None)
    assert flood_item is not None
    assert flood_item.impact == "NGUYÊN BẢN"
    assert flood_item.percentage == 0.0
    assert flood_item.amount_vnd == 0
    assert adj_price == base_price


def test_service_history_full_and_none():
    req_full = ValuationRequest(
        brand="Toyota",
        model="Camry",
        manufacture_year=2022,
        odometer_km=30000,
        service_history="FULL",
    )
    _, mult_full, _, items_full = calculate_condition_adjustments(1_000_000_000, req_full)
    srv_full = next((i for i in items_full if i.category == "SERVICE"), None)
    assert srv_full is not None
    assert srv_full.impact == "TĂNG"
    assert srv_full.percentage == +4.0
    assert mult_full > 1.0

    req_none = ValuationRequest(
        brand="Toyota",
        model="Camry",
        manufacture_year=2022,
        odometer_km=30000,
        service_history="NONE",
    )
    _, mult_none, _, items_none = calculate_condition_adjustments(1_000_000_000, req_none)
    srv_none = next((i for i in items_none if i.category == "SERVICE"), None)
    assert srv_none is not None
    assert srv_none.impact == "GIẢM"
    assert srv_none.percentage == -4.0
    assert mult_none < 1.0


def test_vietnamese_text_normalization():
    req = ValuationRequest(
        brand="Hyundai",
        model="Tucson",
        manufacture_year=2022,
        odometer_km=25000,
        flood_status="Đã từng ngập/thủy kích",
        accident_status="Tai nạn nặng ảnh hưởng khung gầm",
        service_history="Đầy đủ sổ bảo dưỡng hãng 100%",
        owner_count="1 (Chính chủ)",
        repainted_parts_count="2 chi tiết",
    )
    assert req.flood_status == "CONFIRMED"
    assert req.accident_status == "MAJOR"
    assert req.service_history == "FULL"
    assert req.owner_count == 1
    assert req.repainted_parts_count == 2

    # Clean car normalization
    req_clean = ValuationRequest(
        brand="Kia",
        model="Seltos",
        manufacture_year=2023,
        odometer_km=10000,
        flood_status="Cam kết không ngập nước",
        accident_status="Chưa từng va chạm/tai nạn",
        service_history="Không có hồ sơ lưu",
    )
    assert req_clean.flood_status == "NONE"
    assert req_clean.accident_status == "NONE"
    assert req_clean.service_history == "NONE"
