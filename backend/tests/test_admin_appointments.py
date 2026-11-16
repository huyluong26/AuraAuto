import sys
sys.stdout.reconfigure(encoding="utf-8")
import uuid
import httpx
import pytest

client = httpx.Client(base_url="http://localhost:8000/api/v1", timeout=10.0)


def _is_server_reachable() -> bool:
    try:
        r = httpx.get("http://localhost:8000/health", timeout=2.0)
        return r.status_code == 200
    except Exception:
        return False


@pytest.mark.skipif(not _is_server_reachable(), reason="Live backend server on localhost:8000 is not reachable")
def test_admin_metrics_with_appointments():
    # 1. Login as admin
    login_resp = client.post("/auth/login", json={"email": "admin@otocu.vn", "password": "Admin@123456"})
    assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
    admin_token = login_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Get admin metrics
    metrics_resp = client.get("/admin/metrics", headers=admin_headers)
    assert metrics_resp.status_code == 200, f"Get metrics failed: {metrics_resp.text}"
    metrics = metrics_resp.json()

    # Verify all appointment metric fields exist
    assert "total_appointments" in metrics
    assert "pending_appointments" in metrics
    assert "confirmed_appointments" in metrics
    assert "completed_appointments" in metrics
    assert "cancelled_appointments" in metrics
    assert "declined_appointments" in metrics
    assert "appointment_status_distribution" in metrics
    assert "appointment_success_rate" in metrics
    assert isinstance(metrics["appointment_status_distribution"], list)


@pytest.mark.skipif(not _is_server_reachable(), reason="Live backend server on localhost:8000 is not reachable")
def test_admin_appointments_list_and_detail():
    # 1. Login as admin
    login_resp = client.post("/auth/login", json={"email": "admin@otocu.vn", "password": "Admin@123456"})
    admin_token = login_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. List all admin appointments
    resp = client.get("/admin/appointments", headers=admin_headers)
    assert resp.status_code == 200, f"List admin appointments failed: {resp.text}"
    appts = resp.json()
    assert isinstance(appts, list)

    # 3. If there are appointments, test detail endpoint
    if len(appts) > 0:
        first_appt = appts[0]
        appt_id = first_appt["id"]

        # Verify response structure
        assert "listing" in first_appt
        assert "buyer" in first_appt
        assert "seller" in first_appt
        assert "status" in first_appt
        assert "scheduled_at" in first_appt

        # Test single detail endpoint
        detail_resp = client.get(f"/admin/appointments/{appt_id}", headers=admin_headers)
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert detail["id"] == appt_id
        assert "events" in detail
        assert isinstance(detail["events"], list)


@pytest.mark.skipif(not _is_server_reachable(), reason="Live backend server on localhost:8000 is not reachable")
def test_admin_cancel_appointment():
    # 1. Create a fresh buyer and make an appointment on a published car
    buyer_email = f"buyer_{uuid.uuid4().hex[:6]}@test.com"
    r_buyer = client.post("/auth/register", json={
        "email": buyer_email,
        "password": "Password@123",
        "display_name": "Admin Test Buyer",
    })
    assert r_buyer.status_code in [200, 201]

    b_token = client.post("/auth/login", json={"email": buyer_email, "password": "Password@123"}).json()["access_token"]
    b_headers = {"Authorization": f"Bearer {b_token}"}

    # Get a listing
    listings = client.get("/listings").json().get("items", [])
    if not listings:
        pytest.skip("No published listings")
    listing_id = listings[0]["id"]

    from datetime import datetime, timedelta, timezone
    future_time = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    appt_resp = client.post("/appointments", headers=b_headers, json={
        "listing_id": listing_id,
        "scheduled_at": future_time,
        "location": "Số 1 Tràng Tiền, Hà Nội",
        "note": "Khảo sát xe"
    })
    assert appt_resp.status_code == 201
    appt_id = appt_resp.json()["data"]["id"]

    # 2. Login as admin
    admin_login = client.post("/auth/login", json={"email": "admin@otocu.vn", "password": "Admin@123456"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Admin cancels appointment
    cancel_resp = client.post(
        f"/admin/appointments/{appt_id}/cancel",
        headers=admin_headers,
        json={"reason": "Phát hiện tài khoản thử nghiệm spam lịch hẹn"}
    )
    assert cancel_resp.status_code == 200, f"Admin cancel failed: {cancel_resp.text}"
    assert cancel_resp.json()["data"]["status"] == "CANCELLED"

    # 4. Verify detail reflects CANCELLED status and reason
    detail_resp = client.get(f"/admin/appointments/{appt_id}", headers=admin_headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["status"] == "CANCELLED"
    assert detail["cancel_reason_code"] == "ADMIN_CANCELLED"
    assert "spam lịch hẹn" in detail["cancel_reason_text"]
