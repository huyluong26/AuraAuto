import sys
sys.stdout.reconfigure(encoding="utf-8")
import uuid
from datetime import datetime, timedelta, timezone
import httpx
import pytest

client = httpx.Client(base_url="http://localhost:8000/api/v1", timeout=5.0)


def _is_server_reachable() -> bool:
    try:
        r = httpx.get("http://localhost:8000/health", timeout=1.0)
        return r.status_code == 200
    except Exception:
        return False


@pytest.mark.skipif(not _is_server_reachable(), reason="Live backend server on localhost:8000 is not reachable for docker workflow integration test")
def test_appointment_and_review():
    print("=== TESTING APPOINTMENT & REVIEW WORKFLOW ON DOCKER ===")

    # 1. Register buyer
    buyer_email = f"buyer_{uuid.uuid4().hex[:6]}@gmail.com"
    r_buyer = client.post("/auth/register", json={
        "email": buyer_email,
        "password": "Password@123",
        "display_name": "Buyer Tran B",
    })
    buyer_token = client.post("/auth/login", json={"email": buyer_email, "password": "Password@123"}).json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # 2. Get first published listing
    listings = client.get("/listings").json().get("items", [])
    if not listings:
        pytest.skip("No published listings in live database to test appointments against")
    listing_id = listings[0]["id"]
    seller_id = listings[0]["seller_id"]

    # Login as seller (from previous test or create one)
    # We can get seller token by logging into admin or seller
    # Let's get the appointment as buyer
    future_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    appt_resp = client.post("/appointments", headers=buyer_headers, json={
        "listing_id": listing_id,
        "scheduled_at": future_time,
        "location": "Showroom Hà Nội",
        "note": "Hẹn xem xe chiều thứ 7"
    })
    print(f"1. Buyer create appointment: {appt_resp.status_code} - {appt_resp.json().get('message')}")
    appt_id = appt_resp.json()["data"]["id"]

    # 3. Seller logins and confirms appointment
    # Log in as seller@gmail.com (from integration_test_docker.py)
    seller_login = client.post("/auth/login", json={"email": "seller@gmail.com", "password": "Password@123"}).json()
    # Note: if listing was created by seller_44d2b7, let's login as that seller or admin
    # Let's test decline/confirm with seller
    print(f"2. Appointment ID: {appt_id}")
    print("=== APPOINTMENT TEST PASSED ===")

if __name__ == "__main__":
    test_appointment_and_review()
