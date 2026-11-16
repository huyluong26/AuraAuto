import pytest
from app.modules.payments.vnpay import vnpay_service
from app.modules.payments.constants import PROMOTION_PACKAGES


def test_vnpay_build_payment_url():
    """Kiểm tra hàm sinh URL thanh toán VNPay chuẩn HMAC-SHA512."""
    order_code = "AURA_TEST_123456"
    amount = 129000
    info = "Thanh toan goi 3 ngay"
    url = vnpay_service.build_payment_url(
        order_code=order_code,
        amount_vnd=amount,
        order_info=info,
        ip_addr="127.0.0.1",
    )

    assert url.startswith("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?")
    assert f"vnp_TmnCode={vnpay_service.tmn_code}" in url
    assert f"vnp_Amount={amount * 100}" in url
    assert f"vnp_TxnRef={order_code}" in url
    assert "vnp_SecureHash=" in url


def test_vnpay_verify_signature_success():
    """Kiểm tra xác thực chữ ký trả về từ VNPay khi hợp lệ."""
    order_code = "AURA_TEST_789"
    amount = 49000
    # Simulate return params
    url = vnpay_service.build_payment_url(
        order_code=order_code,
        amount_vnd=amount,
        order_info="Test return",
        ip_addr="127.0.0.1",
    )
    # Parse query params from generated URL
    from urllib.parse import urlparse, parse_qs
    parsed = urlparse(url)
    qs_dict = {k: v[0] for k, v in parse_qs(parsed.query).items()}

    # Add return-specific params
    qs_dict["vnp_ResponseCode"] = "00"
    qs_dict["vnp_TransactionStatus"] = "00"
    # Re-sign to simulate exact VNPay response
    params_clean = {k: v for k, v in qs_dict.items() if k != "vnp_SecureHash"}
    import hmac, hashlib, urllib.parse
    sorted_p = sorted(params_clean.items())
    hash_data = "&".join([f"{urllib.parse.quote_plus(str(k))}={urllib.parse.quote_plus(str(v))}" for k, v in sorted_p])
    mock_hash = hmac.new(
        vnpay_service.hash_secret.encode("utf-8"),
        hash_data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()
    params_clean["vnp_SecureHash"] = mock_hash

    is_valid, _ = vnpay_service.verify_return_signature(params_clean)
    assert is_valid is True


def test_vnpay_verify_signature_tampered():
    """Kiểm tra phát hiện chữ ký giả mạo hoặc dữ liệu bị sửa đổi."""
    params = {
        "vnp_Amount": "12900000",
        "vnp_TxnRef": "AURA_TEST_TAMPERED",
        "vnp_ResponseCode": "00",
        "vnp_SecureHash": "fake_hash_123456",
    }
    is_valid, _ = vnpay_service.verify_return_signature(params)
    assert is_valid is False


def test_promotion_packages_configuration():
    """Kiểm tra cấu hình đầy đủ các gói đẩy tin nổi bật."""
    assert "PROMO_1_DAY" in PROMOTION_PACKAGES
    assert "PROMO_3_DAYS" in PROMOTION_PACKAGES
    assert "PROMO_7_DAYS" in PROMOTION_PACKAGES
    assert "PROMO_30_DAYS" in PROMOTION_PACKAGES

    p1 = PROMOTION_PACKAGES["PROMO_1_DAY"]
    assert p1["days"] == 1
    assert p1["amount_vnd"] > 0


@pytest.mark.asyncio
async def test_vnpay_ipn_invalid_signature():
    """Kiểm tra IPN webhook phản hồi mã lỗi 97 khi nhận chữ ký không hợp lệ."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/payments/vnpay/ipn?vnp_TxnRef=TEST_123&vnp_SecureHash=invalid")
        assert resp.status_code == 200
        data = resp.json()
        assert data["RspCode"] == "97"
        assert data["Message"] == "Invalid Checksum"
