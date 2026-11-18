import time
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.cache import fast_cache
from app.models.listing import Listing, ListingRevision
from app.models.payment import PaymentTransaction, PromotionPackage
from app.models.notification import Notification
from app.models.user import User
from app.modules.chats.ws_manager import ws_manager
from app.modules.payments.constants import PROMOTION_PACKAGES
from app.modules.payments.schemas import (
    PromotionPackageInfo,
    CreatePromotionRequest,
    CreatePromotionResponse,
    ListingPromotionStatusResponse,
)
from app.modules.payments.vnpay import vnpay_service
from app.shared.exceptions import NotFoundException, ForbiddenException, ValidationException

logger = logging.getLogger(__name__)


class PaymentService:
    async def seed_default_packages(self, db: AsyncSession):
        """Khởi tạo các gói cước mặc định vào Database nếu bảng còn trống."""
        try:
            for idx, (code, pkg) in enumerate(PROMOTION_PACKAGES.items()):
                orig = int(pkg["amount_vnd"] * 1.25) if pkg["days"] > 1 else None
                p = PromotionPackage(
                    id=uuid.uuid4(),
                    code=pkg["code"],
                    name=pkg["name"],
                    days=pkg["days"],
                    amount_vnd=pkg["amount_vnd"],
                    original_amount_vnd=orig,
                    description=pkg["description"],
                    badge=pkg.get("badge"),
                    is_active=True,
                    sort_order=idx,
                )
                db.add(p)
            await db.commit()
            logger.info("[Payment] Seeded default promotion packages successfully.")
        except Exception as e:
            await db.rollback()
            logger.warning(f"[Payment] Failed to seed default packages: {e}")

    async def get_packages(self, db: Optional[AsyncSession] = None) -> List[PromotionPackageInfo]:
        """Lấy danh sách các gói đẩy tin nổi bật từ DB (fallback về PROMOTION_PACKAGES)."""
        if db:
            try:
                stmt = (
                    select(PromotionPackage)
                    .where(PromotionPackage.is_active == True)
                    .order_by(PromotionPackage.sort_order, PromotionPackage.days)
                )
                res = await db.execute(stmt)
                db_packages = list(res.scalars().all())

                if not db_packages:
                    # Kiểm tra xem bảng có bất kỳ gói nào chưa (kể cả inactive)
                    cnt_res = await db.scalar(select(PromotionPackage.id).limit(1))
                    if not cnt_res:
                        await self.seed_default_packages(db)
                        res2 = await db.execute(stmt)
                        db_packages = list(res2.scalars().all())

                if db_packages:
                    result = []
                    for p in db_packages:
                        discount = None
                        if p.original_amount_vnd and p.original_amount_vnd > p.amount_vnd:
                            discount = int(round((1 - p.amount_vnd / p.original_amount_vnd) * 100))
                        result.append(
                            PromotionPackageInfo(
                                code=p.code,
                                name=p.name,
                                days=p.days,
                                amount_vnd=p.amount_vnd,
                                original_amount_vnd=p.original_amount_vnd,
                                discount_percent=discount,
                                description=p.description or "",
                                badge=p.badge,
                                color="amber" if p.days >= 7 else "blue",
                                is_active=p.is_active,
                                sort_order=p.sort_order,
                            )
                        )
                    return result
            except Exception as e:
                logger.warning(f"Error querying promotion packages from DB: {e}")

        # Fallback to constants
        return [PromotionPackageInfo(**pkg) for pkg in PROMOTION_PACKAGES.values()]

    async def create_promotion_payment(
        self,
        db: AsyncSession,
        user: User,
        data: CreatePromotionRequest,
        client_ip: str = "127.0.0.1",
    ) -> CreatePromotionResponse:
        """
        Tạo đơn hàng đẩy tin nổi bật và sinh liên kết thanh toán VNPay Sandbox.
        """
        # Ưu tiên lấy cấu hình giá từ DB
        pkg_code = data.package_code
        pkg_days = 0
        pkg_amount = 0
        pkg_name = ""

        stmt_pkg = select(PromotionPackage).where(
            PromotionPackage.code == data.package_code,
            PromotionPackage.is_active == True,
        )
        res_pkg = await db.execute(stmt_pkg)
        db_pkg = res_pkg.scalar_one_or_none()

        if db_pkg:
            pkg_code = db_pkg.code
            pkg_days = db_pkg.days
            pkg_amount = db_pkg.amount_vnd
            pkg_name = db_pkg.name
        else:
            pkg = PROMOTION_PACKAGES.get(data.package_code)
            if not pkg:
                raise ValidationException(f"Gói dịch vụ '{data.package_code}' không hợp lệ hoặc đã tạm dừng.")
            pkg_code = pkg["code"]
            pkg_days = pkg["days"]
            pkg_amount = pkg["amount_vnd"]
            pkg_name = pkg["name"]

        # Kiểm tra tin đăng tồn tại và quyền sở hữu
        stmt = (
            select(Listing)
            .options(selectinload(Listing.published_revision))
            .where(Listing.id == data.listing_id)
        )
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()

        if not listing:
            raise NotFoundException("Không tìm thấy tin đăng xe.")

        if listing.seller_user_id != user.id and user.role != "ADMIN":
            raise ForbiddenException("Bạn không có quyền thực hiện đẩy tin cho bài đăng này.")

        if listing.status != "PUBLISHED":
            raise ValidationException(
                "Chỉ các tin xe đã được duyệt và đang công khai (PUBLISHED) mới có thể đẩy nổi bật."
            )

        # Tạo mã đơn hàng duy nhất: ORD_{timestamp}_{random}
        order_code = f"AURA_{int(time.time())}_{uuid.uuid4().hex[:6].upper()}"

        transaction = PaymentTransaction(
            id=uuid.uuid4(),
            user_id=user.id,
            listing_id=listing.id,
            order_code=order_code,
            package_code=pkg_code,
            package_days=pkg_days,
            amount_vnd=pkg_amount,
            provider="VNPAY",
            status="PENDING",
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)

        car_title = (
            listing.published_revision.title
            if listing.published_revision
            else f"Tin {str(listing.id)[:8]}"
        )
        order_info = f"Thanh toan goi {pkg_days} ngay tin noi bat: {car_title[:50]}"

        payment_url = vnpay_service.build_payment_url(
            order_code=order_code,
            amount_vnd=pkg_amount,
            order_info=order_info,
            ip_addr=client_ip,
            bank_code=data.bank_code or "",
        )

        return CreatePromotionResponse(
            order_code=order_code,
            payment_url=payment_url,
            amount_vnd=pkg_amount,
            package_name=pkg_name,
            days=pkg_days,
        )

    async def handle_vnpay_return(
        self,
        db: AsyncSession,
        query_params: Dict[str, str],
    ) -> Tuple[bool, str, Optional[PaymentTransaction]]:
        """
        Xử lý callback trả về từ VNPay sau khi khách hàng thực hiện thanh toán.
        """
        is_valid, clean_params = vnpay_service.verify_return_signature(query_params)
        if not is_valid:
            return False, "Chữ ký giao dịch không hợp lệ (Invalid Checksum).", None

        order_code = clean_params.get("vnp_TxnRef", "")

        if not order_code:
            return False, "Mã đơn hàng không tồn tại.", None

        stmt = (
            select(PaymentTransaction)
            .options(selectinload(PaymentTransaction.listing).selectinload(Listing.published_revision))
            .where(PaymentTransaction.order_code == order_code)
            .with_for_update()
        )
        res = await db.execute(stmt)
        tx = res.scalar_one_or_none()

        if not tx:
            return False, f"Không tìm thấy giao dịch với mã {order_code}.", None

        response_code = clean_params.get("vnp_ResponseCode", "")
        tx_status = clean_params.get("vnp_TransactionStatus", "")

        tx.vnp_transaction_no = clean_params.get("vnp_TransactionNo")
        tx.vnp_bank_code = clean_params.get("vnp_BankCode")
        tx.vnp_response_code = response_code
        tx.raw_response = clean_params

        # Nếu đã thanh toán thành công trước đó (tránh duplicate xử lý)
        if tx.status == "SUCCESS":
            return True, "Giao dịch đã được ghi nhận thành công trước đó.", tx

        now = datetime.now(timezone.utc)

        # Kiểm tra số tiền: vnp_Amount trả về (đã nhân 100) phải khớp chính xác với đơn hàng
        received_amount = 0
        try:
            received_amount = int(clean_params.get("vnp_Amount", 0))
        except (ValueError, TypeError):
            pass

        expected_amount = int(tx.amount_vnd * 100)
        if received_amount != expected_amount:
            tx.status = "FAILED"
            await db.commit()
            logger.warning(
                f"[VNPay] Amount mismatch for order {order_code}: expected={expected_amount}, received={received_amount}"
            )
            return False, f"Số tiền thanh toán ({received_amount // 100} ₫) không khớp với đơn hàng ({tx.amount_vnd} ₫).", tx

        # Kiểm tra hợp lệ: Chữ ký đúng VÀ mã phản hồi 00 (Thành công)
        if is_valid and response_code == "00" and tx_status == "00":
            tx.status = "SUCCESS"
            tx.paid_at = now

            # Cập nhật thời hạn tin nổi bật cho xe
            listing = tx.listing
            if listing:
                # Nếu tin đang nổi bật và chưa hết hạn thì cộng dồn thêm số ngày
                if listing.is_featured and listing.featured_until and listing.featured_until > now:
                    listing.featured_until = listing.featured_until + timedelta(days=tx.package_days)
                else:
                    listing.featured_until = now + timedelta(days=tx.package_days)

                listing.is_featured = True
                listing.featured_tier = tx.package_code

            # Gửi thông báo đến tài khoản người dùng
            car_name = (
                listing.published_revision.title
                if (listing and listing.published_revision)
                else "Xe của bạn"
            )
            noti = Notification(
                id=uuid.uuid4(),
                user_id=tx.user_id,
                title="⭐ Đẩy tin nổi bật thành công!",
                body=f"Xe '{car_name}' đã được kích hoạt gói nổi bật {tx.package_days} ngày trên trang chủ.",
                type="SYSTEM",
                reference_type="listing",
                reference_id=tx.listing_id,
            )
            db.add(noti)

            await db.commit()
            await db.refresh(tx)
            await fast_cache.invalidate_prefix("listings:")

            # Đẩy thông báo thời gian thực qua WebSocket
            try:
                await ws_manager.send_notification_to_user(
                    user_id=tx.user_id,
                    notification_data={
                        "id": str(noti.id),
                        "title": noti.title,
                        "body": noti.body,
                        "reference_id": str(tx.listing_id),
                        "reference_type": "listing",
                    },
                )
            except Exception as e:
                logger.warning(f"Failed to push real-time notification: {e}")

            logger.info(
                f"[VNPay] Payment success for order {order_code}, listing {tx.listing_id} featured until {listing.featured_until if listing else ''}"
            )
            return True, "Thanh toán thành công. Tin xe của bạn đã được đưa lên mục nổi bật!", tx

        # Trường hợp thanh toán thất bại hoặc người dùng hủy giao dịch
        tx.status = "FAILED" if response_code != "24" else "CANCELLED"
        await db.commit()
        await db.refresh(tx)
        logger.warning(
            f"[VNPay] Payment failed for order {order_code}, response_code={response_code}"
        )
        return False, "Giao dịch thanh toán không thành công hoặc đã bị hủy.", tx

    async def get_listing_status(
        self,
        db: AsyncSession,
        listing_id: uuid.UUID,
    ) -> ListingPromotionStatusResponse:
        """Kiểm tra tình trạng gói nổi bật hiện tại của một tin xe."""
        stmt = select(Listing).where(Listing.id == listing_id)
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()
        if not listing:
            raise NotFoundException("Không tìm thấy tin xe.")

        now = datetime.now(timezone.utc)
        is_active = bool(listing.is_featured and listing.featured_until and listing.featured_until > now)
        days_rem = 0
        if is_active and listing.featured_until:
            days_rem = max(1, (listing.featured_until - now).days + 1)

        return ListingPromotionStatusResponse(
            listing_id=listing.id,
            is_featured=is_active,
            featured_until=listing.featured_until,
            featured_tier=listing.featured_tier,
            active_days_remaining=days_rem,
        )


payment_service = PaymentService()
