import numpy as np
import pandas as pd

from app.modules.ai.service import (
    _get_optimized_artifacts,
    _normalize_brand_and_model,
    _resolve_valuation_support,
)
from ml_training.preprocess import extract_variant


def test_model_name_with_or_without_brand_matches_training_support():
    _, report = _get_optimized_artifacts()
    for brand, supplied_model, expected_model in (
        ("Mazda", "Mazda CX-5", "CX-5"),
        ("Mazda", "CX-5", "CX-5"),
        ("Mazda", "Mazda 3", "Mazda 3"),
        ("Toyota", "Toyota Vios", "Vios"),
    ):
        normalized = _normalize_brand_and_model(brand, supplied_model)
        assert normalized == (brand, expected_model)
        assert report["support_by_brand_model"][f"{brand}|{expected_model}"]["count"] >= 10


def test_support_falls_back_instead_of_rejecting_unknown_cars():
    model, report = _get_optimized_artifacts()

    mazda_support, mazda_level = _resolve_valuation_support(report, "Mazda", "Unknown Model")
    assert mazda_level == "BRAND"
    assert mazda_support["count"] >= 10

    global_support, global_level = _resolve_valuation_support(report, "Unknown Brand", "Unknown Model")
    assert global_level == "GLOBAL"
    assert global_support["count"] == report["split_rows"]["train"]

    row = pd.DataFrame([{
        "Brand": "Unknown Brand", "Model": "Unknown Model", "Variant": "UNKNOWN",
        "Body_Type": "SUV", "Fuel_Type": "GASOLINE", "Location_Region": "Khác",
        "Age": 4, "Odometer_Km": 40000.0, "Mileage_Unknown": False,
        "Engine_Displacement": 2.0, "Engine_Unknown": False,
        "Seats": 5.0, "Doors": 5.0, "Is_Imported": 0,
    }])
    prediction = float(np.expm1(model.predict(row[report["categorical_features"] + report["numerical_features"]])[0]))
    assert np.isfinite(prediction) and prediction > 0


def test_luxury_trim_from_listing_title_and_form():
    assert extract_variant("Mercedes-Benz", "G-Class", "Mercedes Benz G class G63 AMG") == "G63 AMG"
    assert extract_variant("Lexus", "LX", "Lexus LX 600 Vip") == "600"
    assert extract_variant("Rolls-Royce", "Cullinan", "Cullinan Black Badge 6.75 V12") == "BLACK BADGE"
