import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class ReportCreateRequest(BaseModel):
    target_type: str = Field(..., description="LISTING, USER, SHOWROOM")
    target_id: uuid.UUID
    reason_code: str = Field(..., description="FAKE_LISTING, SPAM, SCAM, INAPPROPRIATE, OTHER")
    description: Optional[str] = Field(None, max_length=2000)
    evidence_urls: List[str] = Field(default_factory=list, description="Danh sách URL hình ảnh bằng chứng")


class ReportEvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    media_url: str


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reporter_user_id: uuid.UUID
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    target_type: str
    target_id: uuid.UUID
    reason_code: str
    description: Optional[str] = None
    status: str
    resolution_note: Optional[str] = None
    resolved_by_user_id: Optional[uuid.UUID] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    evidences: List[ReportEvidenceResponse] = []


class ResolveReportRequest(BaseModel):
    action: str = Field(..., description="DISMISS, WARNING, HIDE_LISTING, REMOVE_LISTING, SUSPEND_USER, BAN_USER")
    resolution_note: str = Field(..., min_length=3, max_length=1000)
