import os
import json
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Website Mua Bán Ô Tô Cũ Tích Hợp AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/used_cars_db"
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgres@localhost:5432/used_cars_db"

    # Security & Tokens
    SECRET_KEY: str = "default-insecure-secret-key-please-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env in ("production", "prod") and ("insecure" in v.lower() or v == "default-insecure-secret-key-please-change-in-production"):
            raise ValueError("SECRET_KEY must be set to a secure unique secret in production.")
        return v

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
        return v

    # Integrations
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    GEMINI_API_KEY: str = ""

    # Initial Admin Seed
    INITIAL_ADMIN_EMAIL: str = "admin@otocu.vn"
    INITIAL_ADMIN_PASSWORD: str = "Admin@123456"

    # Email & SMTP Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    EMAILS_FROM_NAME: str = "AuraAuto Việt Nam"
    EMAILS_FROM_EMAIL: str = "no-reply@auraauto.vn"
    EMAILS_ENABLED: bool = False
    FRONTEND_URL: str = "http://localhost:3000"

    # VNPay Payment Gateway (Sandbox)
    VNP_TMN_CODE: str = ""
    VNP_HASH_SECRET: str = ""
    VNP_API_URL: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    VNPAY_RETURN_URL: str = "http://localhost:8000/api/v1/payments/vnpay/return"
    PUBLIC_API_URL: str = "http://localhost:8000"
    FRONTEND_PAYMENT_RESULT_URL: str = "http://localhost:3000/thanh-toan/ket-qua"

    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parents[2] / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
