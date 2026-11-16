import uuid

import pytest
from pydantic import ValidationError

from app.modules.listings.schemas import CreateListingRequest


def make_request(**history):
    return CreateListingRequest(
        brand_id=uuid.uuid4(), model_id=uuid.uuid4(), title="Toyota Vios 2022",
        price_vnd=500_000_000, manufacture_year=2022, body_type="SEDAN",
        fuel_type="GASOLINE", transmission="AUTOMATIC", province_code="01",
        **history,
    )


def test_vehicle_history_defaults_and_validation():
    request = make_request(accident_status="MINOR", owner_count=2, replaced_parts="Cản trước")
    assert request.accident_status == "MINOR"
    assert request.owner_count == 2
    assert request.flood_status == "UNKNOWN"

    with pytest.raises(ValidationError):
        make_request(accident_status="YES")
