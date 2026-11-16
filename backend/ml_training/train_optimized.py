"""Train the price model from the supplied workbook, with an untouched test set.

Run from backend/: python -m ml_training.train_optimized
"""
import json
import time
from pathlib import Path

import catboost as cb
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from ml_training.preprocess import run_preprocessing
from ml_training.train import calculate_metrics


ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = Path(__file__).resolve().parent / "artifacts"
CATEGORIES = ["Brand", "Model", "Variant", "Body_Type", "Fuel_Type", "Location_Region"]
NUMBERS = ["Age", "Odometer_Km", "Mileage_Unknown", "Engine_Displacement", "Engine_Unknown", "Seats", "Doors", "Is_Imported"]


def train():
    # Build the features from the same source every time, preserving Car_code deduplication.
    df = run_preprocessing(str(ROOT / "Data.xlsx"), str(Path(__file__).resolve().parent / "data" / "cleaned_cars.csv"))
    X = df[CATEGORIES + NUMBERS].copy()
    X[CATEGORIES] = X[CATEGORIES].fillna("UNKNOWN").astype(str)
    y = df["Price_Million"].to_numpy()
    indices = np.arange(len(df))
    train_val_cal, test = train_test_split(indices, test_size=.15, random_state=42)
    train_val, calibration = train_test_split(train_val_cal, test_size=.15 / .85, random_state=43)
    training, validation = train_test_split(train_val, test_size=.15 / .70, random_state=44)

    model = cb.CatBoostRegressor(
        iterations=800, learning_rate=.06, depth=6, cat_features=CATEGORIES,
        monotone_constraints={"Age": -1, "Odometer_Km": -1},
        loss_function="RMSE", eval_metric="MAE", random_seed=42, verbose=False,
    )
    model.fit(X.iloc[training], np.log1p(y[training]),
              eval_set=(X.iloc[validation], np.log1p(y[validation])),
              early_stopping_rounds=50, verbose=False)

    pred_cal = np.expm1(model.predict(X.iloc[calibration]))
    rel_error_cal = np.abs(y[calibration] - pred_cal) / np.maximum(pred_cal, 1)
    # Finite-sample split-conformal quantile. Validation was used for early stopping,
    # so it must not also be used for calibration.
    k = min(len(calibration), int(np.ceil((len(calibration) + 1) * .90)))
    q90 = float(np.sort(rel_error_cal)[k - 1])
    pred_test = np.expm1(model.predict(X.iloc[test]))
    actual = y[test]
    baseline = cb.CatBoostRegressor()
    baseline.load_model(str(ARTIFACTS / "catboost_used_cars.cbm"))
    old_features = ["Brand", "Model", "Body_Type", "Fuel_Type", "Location_Region", "Age", "Odometer_Km", "Mileage_Unknown", "Engine_Displacement", "Seats", "Doors", "Is_Imported"]
    old_pred = baseline.predict(X.iloc[test][old_features])

    def bands(pred):
        result = {}
        for name, lo, hi in [("under_300m", 0, 300), ("300m_to_700m", 300, 700),
                             ("700m_to_1_5b", 700, 1500), ("1_5b_to_3b", 1500, 3000),
                             ("over_3b", 3000, float("inf"))]:
            mask = (actual >= lo) & (actual < hi)
            result[name] = {"count": int(mask.sum()), **calculate_metrics(actual[mask], pred[mask])}
        return result

    reference = df.iloc[training]
    counts = reference.groupby(["Brand", "Model"]).size()
    support = {}
    for (brand, model_name), count in counts.items():
        group = reference[(reference.Brand == brand) & (reference.Model == model_name)]
        support[f"{brand}|{model_name}"] = {
            "count": int(count), "min_year": int(group.Year.min()), "max_year": int(group.Year.max()),
            "max_odo": float(group.Odometer_Km.max()),
            "median_engine": float(group.Engine_Displacement.median()),
            "median_price_million": float(group.Price_Million.median()),
        }
    report = {
        "model_name": "CatBoost log-price", "version": "3.0.0",
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "training_reference_year": 2026, "target_transform": "log1p",
        "dataset_rows": len(df), "split_rows": {"train": len(training), "validation": len(validation),
            "calibration": len(calibration), "test": len(test)},
        "categorical_features": CATEGORIES, "numerical_features": NUMBERS,
        "metrics_summary": {"baseline": calculate_metrics(actual, old_pred),
                            "optimized": calculate_metrics(actual, pred_test)},
        "price_band_metrics": {"baseline": bands(old_pred), "optimized": bands(pred_test)},
        "conformal_calibration": {"method": "SPLIT_RELATIVE_CONFORMAL", "q90_relative_ratio": q90,
            "test_coverage_90_percent": round(float(np.mean(np.abs(actual - pred_test) / np.maximum(pred_test, 1) <= q90) * 100), 2)},
        "support_by_brand_model": support,
    }
    ARTIFACTS.mkdir(exist_ok=True)
    model.save_model(str(ARTIFACTS / "catboost_log_price_v3.cbm"))
    (ARTIFACTS / "evaluation_report_v3.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("split_rows", "metrics_summary", "price_band_metrics", "conformal_calibration")}, indent=2))


if __name__ == "__main__":
    train()
