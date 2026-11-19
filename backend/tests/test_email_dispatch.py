from app.core.email import (
    render_verify_email_html,
    render_reset_password_html,
    render_appointment_alert_html,
    render_listing_status_html,
    send_email_sync,
)


def test_render_verify_email_html():
    html = render_verify_email_html("Nguyen Van A", "sample_verification_token_123")
    assert "Nguyen Van A" in html
    assert "sample_verification_token_123" in html
    assert "AURA" in html
    assert "verify-email?token=" in html


def test_render_reset_password_html():
    html = render_reset_password_html("Tran Thi B", "sample_reset_token_456")
    assert "Tran Thi B" in html
    assert "sample_reset_token_456" in html
    assert "reset-password?token=" in html


def test_render_appointment_alert_html():
    html = render_appointment_alert_html(
        recipient_name="Le Van C",
        car_title="Toyota Camry 2.5Q 2021",
        scheduled_time="14:30 15/12/2026",
        location="Showroom Aura Cầu Giấy, Hà Nội",
        role_type="SELLER",
    )
    assert "Le Van C" in html
    assert "Toyota Camry 2.5Q 2021" in html
    assert "Showroom Aura Cầu Giấy, Hà Nội" in html


def test_render_listing_status_html_approved():
    html = render_listing_status_html(
        seller_name="Pham D",
        car_title="Mazda CX-5 2.0 Luxury 2022",
        status_text="PUBLISHED",
        listing_id="test-listing-uuid-123",
    )
    assert "Pham D" in html
    assert "Mazda CX-5 2.0 Luxury 2022" in html
    assert "ĐÃ ĐƯỢC PHÊ DUYỆT XUẤT BẢN" in html
    assert "/xe/test-listing-uuid-123" in html
    assert "/quan-ly-tin" in html


def test_render_listing_status_html_pending_review():
    html = render_listing_status_html(
        seller_name="Hoang E",
        car_title="Honda CR-V 1.5L 2023",
        status_text="PENDING_REVIEW",
        listing_id="test-listing-uuid-456",
    )
    assert "Hoang E" in html
    assert "Honda CR-V 1.5L 2023" in html
    assert "ĐANG CHỜ DUYỆT HỒ SƠ" in html
    assert "/quan-ly-tin" in html


def test_render_listing_status_html_rejected_with_note():
    html = render_listing_status_html(
        seller_name="Pham D",
        car_title="Mazda CX-5 2.0 Luxury 2022",
        status_text="REJECTED",
        note="Hình ảnh chụp giấy tờ đăng kiểm bị mờ, vui lòng chụp lại.",
    )
    assert "CẦN CHỈNH SỬA BỔ SUNG" in html
    assert "Hình ảnh chụp giấy tờ đăng kiểm bị mờ" in html
    assert "/quan-ly-tin" in html


def test_render_listing_status_html_removed():
    html = render_listing_status_html(
        seller_name="Vu G",
        car_title="Ford Ranger Wildtrak 2021",
        status_text="REMOVED",
        note="Phát hiện xe không chính chủ và thông tin không khớp.",
    )
    assert "ĐÃ GỠ BỎ KHỎI SÀN" in html
    assert "Phát hiện xe không chính chủ" in html
    assert "/quan-ly-tin" in html


def test_send_email_sync_mock_mode():
    # In test environment, EMAILS_ENABLED is False, so it should log and return True cleanly without raising
    res = send_email_sync(
        to_email="test@auraauto.vn",
        subject="Test Subject",
        html_content="<p>Test Body</p>",
    )
    assert res is True
