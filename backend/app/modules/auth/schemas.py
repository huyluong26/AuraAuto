import re
import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator


def normalize_and_validate_phone(phone: Optional[str]) -> Optional[str]:
    """
    Chuẩn hóa và kiểm tra số điện thoại di động Việt Nam:
    - Loại bỏ dấu cách, dấu chấm, gạch ngang, ngoặc.
    - Chuyển đầu +84 / 84 thành 0.
    - Khớp với dải đầu số 10 chữ số của các nhà mạng Việt Nam (Viettel, Vina, Mobi, Vietnamobile, Gmobile, Wintel).
    """
    if not phone:
        return None

    cleaned = re.sub(r"[\s\.\-\(\)]", "", phone.strip())
    if cleaned.startswith("+84"):
        cleaned = "0" + cleaned[3:]
    elif cleaned.startswith("84") and len(cleaned) == 11:
        cleaned = "0" + cleaned[2:]

    # Regex số di động Việt Nam: 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09
    pattern = r"^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$"
    if not re.match(pattern, cleaned):
        raise ValueError(
            "Số điện thoại không đúng định dạng di động Việt Nam hợp lệ (10 chữ số, ví dụ: 0912345678)"
        )

    return cleaned


def validate_password_strength(password: str) -> str:
    """
    Kiểm tra độ phức tạp của mật khẩu:
    - Độ dài từ 8 - 100 ký tự.
    - Phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.
    """
    if len(password) < 8:
        raise ValueError("Mật khẩu phải có tối thiểu 8 ký tự")
    if len(password) > 100:
        raise ValueError("Mật khẩu không được vượt quá 100 ký tự")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Mật khẩu phải chứa ít nhất một chữ cái in hoa (A-Z)")
    if not re.search(r"[a-z]", password):
        raise ValueError("Mật khẩu phải chứa ít nhất một chữ cái in thường (a-z)")
    if not re.search(r"[0-9]", password):
        raise ValueError("Mật khẩu phải chứa ít nhất một chữ số (0-9)")
    return password


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., description="Mật khẩu tối thiểu 8 ký tự, có chữ hoa, thường và số")
    display_name: str = Field(..., min_length=2, max_length=120, description="Họ và tên hoặc tên hiển thị")
    phone: Optional[str] = Field(None, description="Số điện thoại di động Việt Nam")
    phone_number: Optional[str] = Field(None, description="Alias cho phone nếu gửi từ client")

    # Các trường vị trí địa lý / nơi ở để phân phối & hiển thị dữ liệu phù hợp
    province_code: Optional[str] = Field(None, max_length=10, description="Mã tỉnh/thành phố (ví dụ: '01' - Hà Nội, '79' - TP.HCM)")
    province_name: Optional[str] = Field(None, max_length=100, description="Tên tỉnh/thành phố")
    address: Optional[str] = Field(None, max_length=255, description="Địa chỉ chi tiết nơi ở / trụ sở Showroom")

    # Phân loại tài khoản: INDIVIDUAL (Cá nhân) hoặc SHOWROOM (Doanh nghiệp / Showroom)
    account_type: str = Field(default="INDIVIDUAL", description="Loại tài khoản: INDIVIDUAL hoặc SHOWROOM")
    showroom_name: Optional[str] = Field(None, max_length=150, description="Tên Showroom / Doanh nghiệp")
    tax_code: Optional[str] = Field(None, max_length=50, description="Mã số thuế / ĐKKD")

    @model_validator(mode="before")
    def preprocess_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Hỗ trợ nhận cả 'phone_number' và 'phone'
            if "phone_number" in data and not data.get("phone"):
                data["phone"] = data.get("phone_number")
        return data

    @model_validator(mode="after")
    def validate_account_type_and_showroom(self):
        act = (self.account_type or "INDIVIDUAL").strip().upper()
        self.account_type = act
        if act == "SHOWROOM":
            if not self.showroom_name or not self.showroom_name.strip():
                raise ValueError("Vui lòng cung cấp Tên Showroom / Doanh nghiệp khi chọn loại tài khoản Doanh nghiệp / Showroom")
            self.showroom_name = self.showroom_name.strip()
        return self

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: EmailStr) -> str:
        return str(v).strip().lower()

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password_strength(v)

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        return normalize_and_validate_phone(v)

    @field_validator("display_name")
    @classmethod
    def clean_display_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Họ và tên phải có ít nhất 2 ký tự")
        return cleaned


class LoginRequest(BaseModel):
    """
    Hỗ trợ đăng nhập linh hoạt bằng Email HOẶC Số điện thoại.
    Tương thích ngược cả payload { email, password } và { identifier, password }.
    """
    identifier: str = Field(..., description="Email hoặc Số điện thoại của tài khoản")
    password: str = Field(..., min_length=1, description="Mật khẩu tài khoản")

    @model_validator(mode="before")
    @classmethod
    def preprocess_login(cls, data: Any) -> Any:
        if isinstance(data, dict):
            val = data.get("identifier") or data.get("email") or data.get("phone")
            if val is not None:
                data["identifier"] = str(val).strip()
            else:
                raise ValueError("Vui lòng cung cấp email hoặc số điện thoại để đăng nhập")
        return data

    @field_validator("identifier")
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Email hoặc số điện thoại không được để trống")

        # Nếu là email
        if "@" in cleaned:
            # Validate cấu trúc email cơ bản
            email_pattern = r"^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$"
            if not re.match(email_pattern, cleaned):
                raise ValueError("Định dạng email đăng nhập không hợp lệ")
            return cleaned.lower()

        # Nếu là số điện thoại
        digits_only = re.sub(r"[\s\.\-\(\)]", "", cleaned)
        if digits_only.isdigit() or digits_only.startswith("+"):
            return normalize_and_validate_phone(cleaned) or cleaned

        return cleaned


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: str
    user: "UserBriefResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def check_new_password(cls, v: str) -> str:
        return validate_password_strength(v)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Mật khẩu hiện tại")
    new_password: str = Field(..., min_length=8, max_length=100, description="Mật khẩu mới")

    @field_validator("new_password")
    @classmethod
    def check_new_password(cls, v: str) -> str:
        return validate_password_strength(v)


class ShowroomBriefResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    province_code: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_verified: bool = False
    created_at: Optional[datetime] = None


class UserBriefResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    display_name: str
    phone: Optional[str] = None
    province_code: Optional[str] = None
    province_name: Optional[str] = None
    address: Optional[str] = None
    role: str
    status: str = "ACTIVE"
    avatar_url: Optional[str] = None
    is_email_verified: bool
    account_type: str = "INDIVIDUAL"
    showroom: Optional[ShowroomBriefResponse] = None
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None
    province_code: Optional[str] = Field(None, max_length=10)
    province_name: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        return normalize_and_validate_phone(v)
