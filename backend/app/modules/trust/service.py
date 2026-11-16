import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trust import Report, ReportEvidence, ModerationAction
from app.models.listing import Listing
from app.models.user import User
from app.models.showroom import Showroom
from app.modules.trust.schemas import ReportCreateRequest, ResolveReportRequest
from app.shared.exceptions import NotFoundException, ValidationException


async def create_report(
    db: AsyncSession,
    reporter_id: uuid.UUID,
    data: ReportCreateRequest,
) -> Report:
    """Tạo báo cáo vi phạm mới kèm bằng chứng."""
    target_type = data.target_type.upper()
    if target_type not in ("LISTING", "USER", "SHOWROOM"):
        raise ValidationException("Loại đối tượng báo cáo không hợp lệ (LISTING, USER, SHOWROOM)")

    # 1. Kiểm tra đối tượng tồn tại
    if target_type == "LISTING":
        target = await db.get(Listing, data.target_id)
        if not target:
            raise NotFoundException("Tin đăng xe được báo cáo không tồn tại")
    elif target_type == "USER":
        target = await db.get(User, data.target_id)
        if not target:
            raise NotFoundException("Người dùng được báo cáo không tồn tại")
    elif target_type == "SHOWROOM":
        target = await db.get(Showroom, data.target_id)
        if not target:
            raise NotFoundException("Showroom được báo cáo không tồn tại")

    # 2. Ngăn spam báo cáo trùng lặp đang chờ xử lý
    existing_stmt = select(Report).where(
        Report.reporter_user_id == reporter_id,
        Report.target_type == target_type,
        Report.target_id == data.target_id,
        Report.status.in_(["PENDING", "INVESTIGATING"]),
    )
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        raise ValidationException("Bạn đã gửi báo cáo cho đối tượng này và đang trong quá trình xử lý.")

    # 3. Tạo báo cáo
    report = Report(
        reporter_user_id=reporter_id,
        target_type=target_type,
        target_id=data.target_id,
        reason_code=data.reason_code,
        description=data.description,
        status="PENDING",
    )
    db.add(report)
    await db.flush()

    # 4. Lưu bằng chứng (nếu có)
    for url in data.evidence_urls:
        if url.strip():
            evidence = ReportEvidence(
                report_id=report.id,
                media_url=url.strip(),
            )
            db.add(evidence)

    await db.commit()

    # Refresh kèm quan hệ
    refreshed_stmt = (
        select(Report)
        .options(selectinload(Report.evidences), selectinload(Report.reporter))
        .where(Report.id == report.id)
    )
    return (await db.execute(refreshed_stmt)).scalar_one()


async def list_reports(
    db: AsyncSession,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Report]:
    """Lấy danh sách báo cáo vi phạm cho Admin."""
    stmt = (
        select(Report)
        .options(selectinload(Report.evidences), selectinload(Report.reporter))
        .order_by(desc(Report.created_at))
        .limit(limit)
        .offset(offset)
    )
    if status_filter:
        stmt = stmt.where(Report.status == status_filter.upper())

    res = await db.execute(stmt)
    return list(res.scalars().all())


async def resolve_report(
    db: AsyncSession,
    report_id: uuid.UUID,
    admin_user: User,
    data: ResolveReportRequest,
) -> Report:
    """Xử lý kết quả kiểm duyệt báo cáo vi phạm."""
    stmt = (
        select(Report)
        .options(selectinload(Report.evidences), selectinload(Report.reporter))
        .where(Report.id == report_id)
    )
    report = (await db.execute(stmt)).scalar_one_or_none()
    if not report:
        raise NotFoundException("Báo cáo vi phạm không tồn tại")

    action = data.action.upper()
    valid_actions = ("DISMISS", "WARNING", "HIDE_LISTING", "REMOVE_LISTING", "SUSPEND_USER", "BAN_USER")
    if action not in valid_actions:
        raise ValidationException(f"Hành động không hợp lệ. Chọn một trong: {', '.join(valid_actions)}")

    target_user_id: Optional[uuid.UUID] = None

    # Áp dụng chế tài theo từng hành động
    if action in ("HIDE_LISTING", "REMOVE_LISTING"):
        if report.target_type == "LISTING":
            listing = await db.get(Listing, report.target_id)
            if listing:
                target_user_id = listing.seller_user_id
                listing.status = "HIDDEN" if action == "HIDE_LISTING" else "REJECTED"
    elif action in ("SUSPEND_USER", "BAN_USER"):
        if report.target_type == "USER":
            target_user_id = report.target_id
        elif report.target_type == "LISTING":
            listing = await db.get(Listing, report.target_id)
            if listing:
                target_user_id = listing.seller_user_id
        elif report.target_type == "SHOWROOM":
            showroom = await db.get(Showroom, report.target_id)
            if showroom:
                target_user_id = showroom.owner_user_id

        if target_user_id:
            u = await db.get(User, target_user_id)
            if u:
                u.status = "SUSPENDED"

    # Ghi nhận ModerationAction audit log
    mod_action = ModerationAction(
        report_id=report.id,
        actor_user_id=admin_user.id,
        action_type=action,
        target_user_id=target_user_id,
        reason=data.resolution_note,
    )
    db.add(mod_action)

    # Cập nhật trạng thái báo cáo
    report.status = "REJECTED" if action == "DISMISS" else "RESOLVED"
    report.resolution_note = data.resolution_note
    report.resolved_by_user_id = admin_user.id
    report.resolved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(report)
    return report
