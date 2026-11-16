"""Evaluate richer trims against the deployed v3 route on one held-out split."""
import json
import time
from pathlib import Path

import catboost as cb
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

from ml_training.preprocess import extract_variant_legacy, run_preprocessing
from ml_training.train import calculate_metrics
from ml_training.train_optimized import ARTIFACTS, CATEGORIES, NUMBERS, ROOT


def train():
    df = run_preprocessing(str(ROOT / "Data.xlsx"), str(Path(__file__).resolve().parent / "data" / "cleaned_cars_v4.csv"))
    # Remove repeated listings with identical observable features and asking price.
    df = df.drop_duplicates(subset=CATEGORIES + NUMBERS + ["Year", "Price_Million"]).reset_index(drop=True)
    x = df[CATEGORIES + NUMBERS].copy()
    x[CATEGORIES] = x[CATEGORIES].fillna("UNKNOWN").astype(str)
    y = df.Price_Million.to_numpy()
    # Listings that look identical must stay on the same side of the split.
    groups = df[["Brand", "Model", "Year", "Odometer_Km"]].astype(str).agg("|".join, axis=1)
    splitter = GroupShuffleSplit(n_splits=1, test_size=.15, random_state=42)
    dev, test = next(splitter.split(x, y, groups))
    train_val, calibration = next(GroupShuffleSplit(n_splits=1, test_size=.18, random_state=43).split(x.iloc[dev], y[dev], groups.iloc[dev]))
    dev_train, val = next(GroupShuffleSplit(n_splits=1, test_size=.18, random_state=44).split(x.iloc[dev[train_val]], y[dev[train_val]], groups.iloc[dev[train_val]]))
    training, validation, calibration = dev[train_val[dev_train]], dev[train_val[val]], dev[calibration]

    candidate = cb.CatBoostRegressor(iterations=950, learning_rate=.05, depth=7,
        cat_features=CATEGORIES, monotone_constraints={"Age": -1, "Odometer_Km": -1},
        loss_function="RMSE", eval_metric="MAE", random_seed=42, verbose=False)
    candidate.fit(x.iloc[training], np.log1p(y[training]),
        eval_set=(x.iloc[validation], np.log1p(y[validation])), early_stopping_rounds=65)
    prediction = np.expm1(candidate.predict(x.iloc[test]))

    v3 = cb.CatBoostRegressor()
    v3.load_model(str(ARTIFACTS / "catboost_log_price_v3.cbm"))
    legacy = cb.CatBoostRegressor()
    legacy.load_model(str(ARTIFACTS / "catboost_used_cars.cbm"))
    old_x = x.iloc[test].copy()
    old_x["Variant"] = [extract_variant_legacy(row.Brand, row.Model, row.Name) for row in df.iloc[test].itertuples()]
    deployed = np.expm1(v3.predict(old_x[CATEGORIES + NUMBERS]))
    report_v3 = json.loads((ARTIFACTS / "evaluation_report_v3.json").read_text(encoding="utf-8"))
    old_cols = ["Brand", "Model", "Body_Type", "Fuel_Type", "Location_Region", "Age", "Odometer_Km", "Mileage_Unknown", "Engine_Displacement", "Seats", "Doors", "Is_Imported"]
    old_pred = legacy.predict(old_x[old_cols])
    premium = cb.CatBoostRegressor(iterations=950, learning_rate=.05, depth=7,
        cat_features=CATEGORIES, monotone_constraints={"Age": -1, "Odometer_Km": -1},
        loss_function="RMSE", eval_metric="MAE", random_seed=42, verbose=False)
    # Select training groups using training data only; routing never looks at the test price.
    reference_medians = df.iloc[training].groupby(["Brand", "Model"]).Price_Million.median()
    premium_mask = np.array([reference_medians.get((row.Brand, row.Model), 0) >= 1500 for row in df.iloc[training].itertuples()])
    premium_val_mask = np.array([reference_medians.get((row.Brand, row.Model), 0) >= 1500 for row in df.iloc[validation].itertuples()])
    premium.fit(x.iloc[training[premium_mask]], y[training[premium_mask]],
        eval_set=(x.iloc[validation[premium_val_mask]], y[validation[premium_val_mask]]), early_stopping_rounds=65)
    premium_prediction = premium.predict(x.iloc[test])
    routed = deployed.copy()
    for i, row in enumerate(df.iloc[test].itertuples()):
        support = report_v3["support_by_brand_model"].get(f"{row.Brand}|{row.Model}")
        if support and support["median_price_million"] >= 1500:
            deployed[i] = old_pred[i]
            routed[i] = old_pred[i]
        if 1500 <= reference_medians.get((row.Brand, row.Model), 0) < 3000:
            routed[i] = premium_prediction[i]

    def bands(pred):
        result = {}
        for name, lo, hi in (("under_300m", 0, 300), ("300m_to_700m", 300, 700),
                             ("700m_to_1_5b", 700, 1500), ("1_5b_to_3b", 1500, 3000),
                             ("over_3b", 3000, float("inf"))):
            mask = (y[test] >= lo) & (y[test] < hi)
            result[name] = {"count": int(mask.sum()), **calculate_metrics(y[test][mask], pred[mask])}
        return result

    errors = np.abs(y[calibration] - np.expm1(candidate.predict(x.iloc[calibration]))) / np.maximum(1, np.expm1(candidate.predict(x.iloc[calibration])))
    q90 = float(np.sort(errors)[min(len(errors) - 1, int(np.ceil((len(errors) + 1) * .90)) - 1)])
    reference = df.iloc[training]
    support = {}
    for (brand, model), group in reference.groupby(["Brand", "Model"]):
        support[f"{brand}|{model}"] = {"count": len(group), "min_year": int(group.Year.min()),
            "max_year": int(group.Year.max()), "max_odo": float(group.Odometer_Km.max()),
            "median_engine": float(group.Engine_Displacement.median()),
            "median_price_million": float(group.Price_Million.median())}
    report = {"version": "4.0.0", "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "training_reference_year": 2026, "dataset_rows": len(df),
        "split_rows": {"train": len(training), "validation": len(validation), "calibration": len(calibration), "test": len(test)},
        "categorical_features": CATEGORIES, "numerical_features": NUMBERS,
        "metrics_summary": {"deployed_v3": calculate_metrics(y[test], deployed), "candidate_v4": calculate_metrics(y[test], routed)},
        "price_band_metrics": {"deployed_v3": bands(deployed), "candidate_v4": bands(routed)},
        "conformal_calibration": {"method": "SPLIT_RELATIVE_CONFORMAL", "q90_relative_ratio": q90},
        "support_by_brand_model": support}
    print(json.dumps({k: report[k] for k in ("split_rows", "metrics_summary", "price_band_metrics")}, indent=2))
    # Gate on the reported problem segments, as well as aggregate accuracy.
    old, new = report["price_band_metrics"]["deployed_v3"], report["price_band_metrics"]["candidate_v4"]
    passed = all(new[k]["MAE_Million"] < old[k]["MAE_Million"] for k in ("300m_to_700m", "1_5b_to_3b", "over_3b"))
    passed &= report["metrics_summary"]["candidate_v4"]["MAE_Million"] < report["metrics_summary"]["deployed_v3"]["MAE_Million"]
    report["deployment_gate_passed"] = bool(passed)
    (ARTIFACTS / "evaluation_report_v4.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    if passed:
        candidate.save_model(str(ARTIFACTS / "catboost_log_price_v4.cbm"))
        premium.save_model(str(ARTIFACTS / "catboost_premium_v4.cbm"))
    print(f"Deployment gate: {passed}")


if __name__ == "__main__":
    train()
