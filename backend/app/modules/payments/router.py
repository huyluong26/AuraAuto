import uuid
from typing import List, Optional
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, Request, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.cache import fast_cache
from app.core.deps import get_current_active_user
from app.models.user import User
from app.modules.payments.schemas import (
    PromotionPackageInfo,
    CreatePromotionRequest,
    CreatePromotionResponse,
    ListingPromotionStatusResponse,
    PaymentTransactionResponse,
)
from app.modules.payments.service import payment_service
from app.models.payment import PaymentTransaction
from sqlalchemy import select, desc

router = APIRouter(prefix="/payments", tags=["Payments & Promotions"])


@router.get("/packages", response_model=List[PromotionPackageInfo])
async def get_promotion_packages(
    db: AsyncSession = Depends(get_db),
):
    """Lấy danh sách các gói đẩy tin nổi bật (1 ngày, 3 ngày, 1 tuần, 1 tháng) - Fast Cached."""
    cache_key = "payments:packages"
    cached = await fast_cache.get(cache_key)
    if cached is not None:
        return cached

    packages = await payment_service.get_packages(db)
    await fast_cache.set(cache_key, packages, ttl_seconds=3600)
    return packages


@router.post("/create-promotion", response_model=CreatePromotionResponse)
async def create_promotion_payment(
    data: CreatePromotionRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Tạo đơn hàng đẩy tin nổi bật và sinh đường dẫn chuyển hướng sang cổng thanh toán VNPay Sandbox.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    return await payment_service.create_promotion_payment(
        db=db,
        user=current_user,
        data=data,
        client_ip=client_ip,
    )


@router.get("/vnpay/return")
async def vnpay_return_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Điểm đón phản hồi (Return URL) từ cổng thanh toán VNPay sau khi khách hàng thanh toán xong.
    Hệ thống kiểm tra chữ ký, cập nhật trạng thái tin xe và chuyển hướng về frontend kết quả.
    """
    query_params = dict(request.query_params)
    success, message, tx = await payment_service.handle_vnpay_return(
        db=db,
        query_params=query_params,
    )

    # Chuyển hướng về trang kết quả frontend
    base_url = settings.FRONTEND_PAYMENT_RESULT_URL
    params = {
        "status": "success" if success else "failed",
        "order_code": tx.order_code if tx else query_params.get("vnp_TxnRef", ""),
        "amount": tx.amount_vnd if tx else 0,
        "message": message,
        "listing_id": str(tx.listing_id) if tx else "",
        "days": tx.package_days if tx else 0,
        "vnp_bank_code": query_params.get("vnp_BankCode", ""),
        "vnp_transaction_no": query_params.get("vnp_TransactionNo", ""),
    }

    redirect_url = f"{base_url}?{urlencode(params)}"
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)


@router.get("/vnpay/ipn")
async def vnpay_ipn_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Điểm đón IPN (Instant Payment Notification) từ máy chủ VNPay (Server-to-Server).
    Phản hồi định dạng JSON chuẩn VNPay:
    - RspCode "00": Thành công
    - RspCode "01": Không tìm thấy giao dịch
    - RspCode "02": Giao dịch đã được cập nhật trước đó
    - RspCode "97": Sai chữ ký (Checksum không hợp lệ)
    - RspCode "99": Lỗi hệ thống khác
    """
    query_params = dict(request.query_params)
    success, message, tx = await payment_service.handle_vnpay_return(
        db=db,
        query_params=query_params,
    )

    if message == "Chữ ký giao dịch không hợp lệ (Invalid Checksum).":
        return {"RspCode": "97", "Message": "Invalid Checksum"}

    if not tx:
        return {"RspCode": "01", "Message": "Order not found"}

    if message == "Giao dịch đã được ghi nhận thành công trước đó.":
        return {"RspCode": "02", "Message": "Order already confirmed"}

    if success:
        return {"RspCode": "00", "Message": "Confirm Success"}

    return {"RspCode": "99", "Message": message or "Payment Failed"}


@router.get("/listing/{listing_id}/status", response_model=ListingPromotionStatusResponse)
async def get_listing_promotion_status(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Lấy thông tin gói nổi bật và hạn dùng của một tin đăng."""
    return await payment_service.get_listing_status(db=db, listing_id=listing_id)


@router.get("/transactions/my", response_model=List[PaymentTransactionResponse])
async def get_my_transactions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Xem lịch sử nạp gói đẩy tin của người dùng hiện tại."""
    stmt = (
        select(PaymentTransaction)
        .where(PaymentTransaction.user_id == current_user.id)
        .order_by(desc(PaymentTransaction.created_at))
    )
    res = await db.execute(stmt)
    return res.scalars().all()
