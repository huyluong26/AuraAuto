import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy import select, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentEvent
from app.models.notification import Notification
from app.models.user import AuthSession, EmailVerificationToken, PasswordResetToken

logger = logging.getLogger(__name__)


async def cleanup_expired_pending_appointments(db: AsyncSession, hours_threshold: int = 48) -> int:
    """Tự động hủy các lịch hẹn ở trạng thái PENDING quá ngưỡng giờ mà người bán không phản hồi."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_threshold)
    stmt = (
        select(Appointment)
        .where(
            Appointment.status == "PENDING",
            Appointment.created_at < cutoff,
        )
        .with_for_update()
    )
    res = await db.execute(stmt)
    stale_appts = res.scalars().all()

    cancelled_count = 0
    now = datetime.now(timezone.utc)

    for appt in stale_appts:
        appt.status = "CANCELLED"
        appt.cancel_reason_code = "SELLER_NO_RESPONSE"
        appt.cancel_reason_text = f"Tự động hủy do người bán không phản hồi sau {hours_threshold} giờ"

        event = AppointmentEvent(
            appointment_id=appt.id,
            actor_user_id=appt.buyer_user_id,
            from_status="PENDING",
            to_status="CANCELLED",
            note=appt.cancel_reason_text,
        )
        db.add(event)

        # Thông báo cho người mua để họ chủ động liên hệ xe khác
        noti = Notification(
            user_id=appt.buyer_user_id,
            title="Lịch xem xe đã tự động hủy",
            body="Yêu cầu xem xe của bạn đã hết hạn do người bán không phản hồi sau 48 giờ. Bạn có thể chọn đặt lịch xe khác.",
            type="APPOINTMENT",
            reference_type="appointment",
            reference_id=appt.id,
        )
        db.add(noti)
        cancelled_count += 1

    if cancelled_count > 0:
        await db.commit()
        logger.info(f"[CLEANUP] Auto-cancelled {cancelled_count} stale pending appointments")

    return cancelled_count


async def cleanup_expired_tokens_and_sessions(db: AsyncSession) -> Dict[str, int]:
    """Dọn dẹp các token email, token đặt lại mật khẩu và session đã hết hạn hoặc đã thu hồi."""
    now = datetime.now(timezone.utc)

    # 1. Dọn dẹp EmailVerificationToken (đã dùng hoặc hết hạn)
    stmt_email = (
        delete(EmailVerificationToken)
        .where(
            or_(
                EmailVerificationToken.used_at.is_not(None),
                EmailVerificationToken.expires_at < now,
            )
        )
    )
    res_email = await db.execute(stmt_email)
    deleted_email_tokens = res_email.rowcount or 0

    # 2. Dọn dẹp PasswordResetToken (đã dùng hoặc hết hạn)
    stmt_pwd = (
        delete(PasswordResetToken)
        .where(
            or_(
                PasswordResetToken.used_at.is_not(None),
                PasswordResetToken.expires_at < now,
            )
        )
    )
    res_pwd = await db.execute(stmt_pwd)
    deleted_pwd_tokens = res_pwd.rowcount or 0

    # 3. Dọn dẹp AuthSession (đã thu hồi hoặc hết hạn)
    stmt_session = (
        delete(AuthSession)
        .where(
            or_(
                AuthSession.revoked_at.is_not(None),
                AuthSession.expires_at < now,
            )
        )
    )
    res_session = await db.execute(stmt_session)
    deleted_sessions = res_session.rowcount or 0

    await db.commit()
    logger.info(
        f"[CLEANUP] Purged {deleted_email_tokens} email tokens, {deleted_pwd_tokens} reset tokens, {deleted_sessions} auth sessions"
    )

    return {
        "deleted_email_tokens": deleted_email_tokens,
        "deleted_password_reset_tokens": deleted_pwd_tokens,
        "deleted_auth_sessions": deleted_sessions,
    }


async def run_system_maintenance(db: AsyncSession) -> Dict[str, Any]:
    """Thực thi toàn bộ các tác vụ dọn dẹp hệ thống ngầm."""
    cancelled_appts = await cleanup_expired_pending_appointments(db)
    purged_tokens = await cleanup_expired_tokens_and_sessions(db)
    return {
        "auto_cancelled_appointments": cancelled_appts,
        **purged_tokens,
    }
