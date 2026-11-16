import uuid
import pytest
from pydantic import ValidationError
from app.modules.trust.schemas import ReportCreateRequest, ResolveReportRequest, ReportResponse


def test_report_create_schema_valid():
    target_id = uuid.uuid4()
    req = ReportCreateRequest(
        target_type="LISTING",
        target_id=target_id,
        reason_code="FAKE_LISTING",
        description="Tin đăng giả mạo thông tin xe",
        evidence_urls=["https://res.cloudinary.com/demo/image/upload/v1/evidence1.jpg"],
    )
    assert req.target_type == "LISTING"
    assert req.target_id == target_id
    assert len(req.evidence_urls) == 1


def test_resolve_report_schema_valid():
    req = ResolveReportRequest(
        action="REMOVE_LISTING",
        resolution_note="Xác minh tin đăng vi phạm quy chế sàn, tiến hành gỡ bỏ.",
    )
    assert req.action == "REMOVE_LISTING"
    assert "gỡ bỏ" in req.resolution_note


def test_resolve_report_schema_too_short_note():
    with pytest.raises(ValidationError):
        ResolveReportRequest(
            action="DISMISS",
            resolution_note="ok",  # min_length=3
        )
