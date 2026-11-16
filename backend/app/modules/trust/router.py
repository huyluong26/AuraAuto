import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.trust import Report
from app.modules.trust.schemas import (
    ReportCreateRequest,
    ReportResponse,
    ReportEvidenceResponse,
    ResolveReportRequest,
)
from app.modules.trust import service

router = APIRouter(tags=["Trust & Reports"])


def _to_report_response(r: Report) -> ReportResponse:
    evidences = [
        ReportEvidenceResponse(id=e.id, media_url=e.media_url)
        for e in (r.evidences or [])
    ]
    reporter_name = r.reporter.display_name if r.reporter else None
    reporter_email = r.reporter.email if r.reporter else None

    return ReportResponse(
        id=r.id,
        reporter_user_id=r.reporter_user_id,
        reporter_name=reporter_name,
        reporter_email=reporter_email,
        target_type=r.target_type,
        target_id=r.target_id,
        reason_code=r.reason_code,
        description=r.description,
        status=r.status,
        resolution_note=r.resolution_note,
        resolved_by_user_id=r.resolved_by_user_id,
        resolved_at=r.resolved_at,
        created_at=r.created_at,
        evidences=evidences,
    )


@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_report(
    data: ReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gửi báo cáo vi phạm tin đăng, người dùng hoặc showroom."""
    report = await service.create_report(db, current_user.id, data)
    return _to_report_response(report)


@router.get("/admin/reports", response_model=List[ReportResponse])
async def list_admin_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin xem danh sách báo cáo vi phạm."""
    reports = await service.list_reports(db, status_filter=status_filter, limit=limit, offset=offset)
    return [_to_report_response(r) for r in reports]


@router.post("/admin/reports/{report_id}/resolve", response_model=ReportResponse)
async def resolve_admin_report(
    report_id: uuid.UUID,
    data: ResolveReportRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin xử lý và ra quyết định đối với báo cáo vi phạm."""
    report = await service.resolve_report(db, report_id, admin_user, data)
    return _to_report_response(report)
