import hashlib
import hmac
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class VNPayService:
    def __init__(self):
        self.tmn_code = settings.VNP_TMN_CODE
        self.hash_secret = settings.VNP_HASH_SECRET
        self.vnp_url = settings.VNP_API_URL
        self.return_url = settings.VNPAY_RETURN_URL

    def build_payment_url(
        self,
        order_code: str,
        amount_vnd: int,
        order_info: str,
        ip_addr: str = "127.0.0.1",
        bank_code: str = "",
    ) -> str:
        """
        Tạo URL thanh toán VNPay Sandbox chuẩn 2.1.0 với chữ ký HMAC-SHA512.
        """
        # Luôn sử dụng múi giờ Việt Nam GMT+7 (Asia/Ho_Chi_Minh) cho VNPay
        tz_vn = timezone(timedelta(hours=7))
        now = datetime.now(tz_vn)

        params: Dict[str, Any] = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": self.tmn_code,
            "vnp_Amount": int(amount_vnd * 100),  # VNPay yêu cầu nhân 100
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": order_code,
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "billpayment",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": self.return_url,
            "vnp_IpAddr": ip_addr or "127.0.0.1",
            "vnp_CreateDate": now.strftime("%Y%m%d%H%M%S"),
        }

        if bank_code:
            params["vnp_BankCode"] = bank_code

        # Sắp xếp các tham số theo thứ tự alphabet
        sorted_params = sorted(params.items())

        # Tạo chuỗi dữ liệu hash và query string
        hash_data = "&".join(
            [f"{urllib.parse.quote_plus(str(k))}={urllib.parse.quote_plus(str(v))}" for k, v in sorted_params if v is not None and str(v) != ""]
        )
        query_string = hash_data

        # Tính toán chữ ký HMAC-SHA512
        secure_hash = hmac.new(
            self.hash_secret.encode("utf-8"),
            hash_data.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest()

        payment_url = f"{self.vnp_url}?{query_string}&vnp_SecureHash={secure_hash}"
        logger.info(f"[VNPay] Created payment url for order {order_code}: amount={amount_vnd} VND")
        return payment_url

    def verify_return_signature(self, query_params: Dict[str, str]) -> Tuple[bool, Dict[str, str]]:
        """
        Xác thực chữ ký HMAC-SHA512 trả về từ VNPay khi người dùng hoàn tất thanh toán.
        """
        params = dict(query_params)
        received_hash = params.pop("vnp_SecureHash", "")
        params.pop("vnp_SecureHashType", None)

        # Lọc chỉ lấy các param bắt đầu bằng vnp_ và có giá trị
        vnp_params = {
            k: v for k, v in params.items() if k.startswith("vnp_") and v is not None and str(v) != ""
        }

        sorted_params = sorted(vnp_params.items())
        hash_data = "&".join(
            [f"{urllib.parse.quote_plus(str(k))}={urllib.parse.quote_plus(str(v))}" for k, v in sorted_params]
        )

        calculated_hash = hmac.new(
            self.hash_secret.encode("utf-8"),
            hash_data.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest()

        is_valid = calculated_hash.lower() == received_hash.lower()
        if not is_valid:
            logger.warning(
                f"[VNPay] Signature mismatch! Calculated: {calculated_hash}, Received: {received_hash}"
            )
        return is_valid, params


vnpay_service = VNPayService()
