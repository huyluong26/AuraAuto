import sys
sys.stdout.reconfigure(encoding="utf-8")
import uuid
import httpx

client = httpx.Client(base_url="http://localhost:8000/api/v1", timeout=10.0)

def run_integration_test():
    print("=== STARTING DOCKER INTEGRATION TEST ===")

    test_email = f"seller_{uuid.uuid4().hex[:6]}@gmail.com"

    # 1. Register User
    reg_resp = client.post("/auth/register", json={
        "email": test_email,
        "password": "Password@123",
        "display_name": "Nguyen Van A",
        "phone": "0912345678"
    })
    print(f"1. Register ({test_email}): {reg_resp.status_code} - {reg_resp.json().get('message')}")
    verif_token = reg_resp.json()["data"]["verification_token"]

    # 2. Verify Email
    verif_resp = client.post("/auth/verify-email", json={"token": verif_token})
    print(f"2. Verify Email: {verif_resp.status_code} - {verif_resp.json().get('message')}")

    # 3. Login User
    login_resp = client.post("/auth/login", json={
        "email": test_email,
        "password": "Password@123"
    })
    seller_token = login_resp.json()["access_token"]
    print(f"3. Login User: {login_resp.status_code} - Token received!")

    # 4. Get Brands & Models
    brands = client.get("/catalog/brands").json()
    toyota_id = [b["id"] for b in brands if b["name"] == "Toyota"][0]
    models = client.get(f"/catalog/brands/{toyota_id}/models").json()
    vios_id = [m["id"] for m in models if m["name"] == "Vios"][0]
    print(f"4. Catalog: Retrieved Toyota ({toyota_id}) and Model Vios ({vios_id})")

    # 5. Create Draft Listing
    headers = {"Authorization": f"Bearer {seller_token}"}
    draft_resp = client.post("/listings", headers=headers, json={
        "brand_id": toyota_id,
        "model_id": vios_id,
        "title": "Toyota Vios 1.5G 2022 màu trắng siêu lướt",
        "price_vnd": 495000000,
        "manufacture_year": 2022,
        "odometer_km": 25000,
        "body_type": "SEDAN",
        "fuel_type": "GASOLINE",
        "transmission": "AUTOMATIC",
        "province_code": "01",
        "description": "Xe gia đình một chủ từ đầu, bảo dưỡng đầy đủ.",
        "media": [{"url": "https://example.com/vios1.jpg", "is_primary": True}]
    })
    print(f"5. Create Draft: {draft_resp.status_code} - {draft_resp.json().get('message')}")
    listing_id = draft_resp.json()["data"]["id"]

    # 6. Submit for review
    submit_resp = client.post(f"/listings/{listing_id}/submit", headers=headers)
    print(f"6. Submit for Review: {submit_resp.status_code} - {submit_resp.json().get('message')}")

    # 7. Admin Login & Approve
    admin_login = client.post("/auth/login", json={"email": "admin@otocu.vn", "password": "Admin@123456"}).json()
    admin_token = admin_login["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    approve_resp = client.post(f"/admin/listings/{listing_id}/approve", headers=admin_headers)
    print(f"7. Admin Approve: {approve_resp.status_code} - {approve_resp.json().get('message')}")

    # 8. List Public Listings
    public_resp = client.get("/listings")
    print(f"8. List Public Listings: {public_resp.status_code} - Total items: {public_resp.json()['pagination']['total']}")
    item = public_resp.json()["items"][0]
    print(f"   -> Item Title: {item['title']}")
    print(f"   -> Item Price: {item['price_vnd']:,} VNĐ")

    # 9. Test AI Natural Search
    ai_search = client.post("/ai/natural-search", json={"query": "Tìm xe sedan dưới 600 triệu"})
    print(f"9. AI Natural Search: {ai_search.status_code}")
    print(f"   -> Criteria: {ai_search.json()['extracted_criteria']}")
    print(f"   -> Total matched cars found in DB: {ai_search.json()['total_found']}")

    # 10. Test AI Valuation
    val_resp = client.post("/ai/valuations", json={
        "brand": "Toyota",
        "model": "Vios",
        "manufacture_year": 2022,
        "odometer_km": 25000,
        "body_type": "SEDAN",
        "fuel_type": "GASOLINE"
    })
    print(f"10. AI Valuation: {val_resp.status_code}")
    val_data = val_resp.json()
    print(f"   -> Estimated: {val_data['estimated_price_vnd']:,} VNĐ")
    print(f"   -> Interval: [{val_data['interval_low_vnd']:,} - {val_data['interval_high_vnd']:,}] VNĐ")
    print(f"   -> Summary: {val_data['explanation']['summary']}")

    print("=== DOCKER INTEGRATION TEST COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_integration_test()
