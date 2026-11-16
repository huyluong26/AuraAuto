import pytest
from pydantic import ValidationError
from app.modules.auth.schemas import RegisterRequest


def test_individual_registration_schema():
    req = RegisterRequest(
        email="user@test.com",
        password="Password@123",
        display_name="Nguyen Van A",
        account_type="INDIVIDUAL",
    )
    assert req.account_type == "INDIVIDUAL"
    assert req.showroom_name is None


def test_showroom_registration_valid():
    req = RegisterRequest(
        email="showroom@auto.vn",
        password="Password@123",
        display_name="Giam Doc Nguyen",
        account_type="SHOWROOM",
        showroom_name="Auto Nam Sai Gon",
        tax_code="0312345678",
        province_code="79",
        address="123 Nguyen Van Linh, Q7",
    )
    assert req.account_type == "SHOWROOM"
    assert req.showroom_name == "Auto Nam Sai Gon"
    assert req.tax_code == "0312345678"


def test_showroom_registration_missing_name_fails():
    with pytest.raises(ValidationError) as exc_info:
        RegisterRequest(
            email="showroom@auto.vn",
            password="Password@123",
            display_name="Giam Doc Nguyen",
            account_type="SHOWROOM",
            showroom_name="",
        )
    assert "Tên Showroom / Doanh nghiệp" in str(exc_info.value)
