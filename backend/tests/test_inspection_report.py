import pytest
from pydantic import ValidationError
from app.modules.admin.schemas import SubmitInspectionRequest


def test_submit_inspection_schema_valid():
    req = SubmitInspectionRequest(
        inspection_score=96,
        inspection_inspector_name="Nguyen Van Kiem Dinh",
        inspection_report_pdf_url="https://res.cloudinary.com/demo/image/upload/inspection_v123.pdf",
        inspection_checklist={
            "chassis": {"status": "PASSED", "passed_items": 30, "total_items": 30},
            "engine": {"status": "PASSED", "passed_items": 40, "total_items": 40},
            "transmission": {"status": "PASSED", "passed_items": 25, "total_items": 25},
            "brakes_tires": {"status": "PASSED", "passed_items": 25, "total_items": 25},
            "electrical": {"status": "PASSED", "passed_items": 20, "total_items": 20},
            "interior": {"status": "PASSED", "passed_items": 20, "total_items": 20},
        },
    )
    assert req.inspection_score == 96
    assert req.inspection_inspector_name == "Nguyen Van Kiem Dinh"
    assert "chassis" in req.inspection_checklist


def test_submit_inspection_schema_score_out_of_bounds():
    with pytest.raises(ValidationError):
        SubmitInspectionRequest(
            inspection_score=105,  # must be <= 100
            inspection_inspector_name="Kiem Dinh Vien",
        )

    with pytest.raises(ValidationError):
        SubmitInspectionRequest(
            inspection_score=-5,  # must be >= 0
            inspection_inspector_name="Kiem Dinh Vien",
        )
