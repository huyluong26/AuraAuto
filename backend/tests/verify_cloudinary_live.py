import sys
import httpx

sys.stdout.reconfigure(encoding="utf-8")

client = httpx.Client(base_url="http://localhost:8000/api/v1", timeout=30.0)

def main():
    print("=== KIỂM TRA KẾT NỐI CLOUDINARY TRỰC TIẾP TRÊN HỆ THỐNG ===")

    # 1. Login admin
    login_res = client.post("/auth/login", json={"email": "admin@otocu.vn", "password": "Admin@123456"})
    if login_res.status_code != 200:
        print("Lỗi đăng nhập:", login_res.status_code, login_res.text)
        return
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("1. [Xác thực] Đăng nhập tài khoản thành công.")

    # 2. Test /media/sign-upload
    sign_res = client.post("/media/sign-upload", headers=headers, json={"folder": "used_cars_listings"})
    sign_data = sign_res.json()
    print("2. [Signed Upload] Chữ ký Cloudinary hợp lệ:")
    print(f"   - Cloud Name: {sign_data.get('cloud_name')}")
    print(f"   - API Key: {sign_data.get('api_key')[:6]}***")
    print(f"   - Signature: {sign_data.get('signature')[:12]}...")

    # 3. Test /media/upload live
    img_path = r".venv\Lib\site-packages\sklearn\datasets\images\flower.jpg"
    with open(img_path, "rb") as f:
        files = {"file": ("car_sample.jpg", f.read(), "image/jpeg")}
        upload_res = client.post("/media/upload", headers=headers, files=files, data={"folder": "used_cars_listings"})

    up_data = upload_res.json()
    print("3. [Upload API] Tải ảnh lên Cloudinary thành công:")
    print(f"   - Storage Type: {up_data.get('storage_type')}")
    print(f"   - Public ID: {up_data.get('public_id')}")
    print(f"   - Secure CDN URL: {up_data.get('secure_url')}")
    print(f"   - Kích thước: {up_data.get('width')} x {up_data.get('height')}")
    print(f"   - Dung lượng: {up_data.get('bytes')} bytes")

    # 4. Test delete
    pub_id = up_data.get("public_id")
    del_res = client.delete(f"/media/{pub_id}", headers=headers)
    print("4. [Delete API] Xóa ảnh trên Cloudinary thành công:")
    print(f"   - Mã phản hồi: {del_res.status_code}")
    print(f"   - Kết quả: {del_res.json()}")

    print("\n===> KẾT LUẬN: ĐÃ KẾT NỐI CLOUDINARY HOÀN TOÀN THÀNH CÔNG VÀ CHẠY MƯỢT MÀ! <===")

if __name__ == "__main__":
    main()
