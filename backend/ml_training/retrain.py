"""Automated AI Valuation Model Retraining Pipeline.

Extracts real sold vehicle transactions from database and updates CatBoost regressor.
Run from backend/ root:
  python -m ml_training.retrain
"""
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parents[1]
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

import catboost as cb
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sqlalchemy import create_engine, text

from app.core.config import settings

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
DATA_DIR = Path(__file__).resolve().parent / "data"

CATEGORIES = ["Brand", "Model", "Variant", "Body_Type", "Fuel_Type", "Location_Region"]
NUMBERS = [
    "Age",
    "Odometer_Km",
    "Mileage_Unknown",
    "Engine_Displacement",
    "Engine_Unknown",
    "Seats",
    "Doors",
    "Is_Imported",
]


def _map_province_to_region(province_code: Optional[str]) -> str:
    """Ánh xạ mã tỉnh thành sang 3 miền: MIEN_BAC, MIEN_TRUNG, MIEN_NAM."""
    if not province_code:
        return "MIEN_BAC"
    code = str(province_code).strip()
    # Danh sách mã tỉnh miền Bắc: 01-37
    # Danh sách miền Trung: 38-60
    # Danh sách miền Nam: 62-96 (79: TP.HCM)
    try:
        c_int = int(code)
        if c_int <= 37:
            return "MIEN_BAC"
        elif c_int <= 60:
            return "MIEN_TRUNG"
        else:
            return "MIEN_NAM"
    except ValueError:
        return "MIEN_BAC"


def extract_sold_listings_df(sync_database_url: Optional[str] = None) -> pd.DataFrame:
    """Truy vấn các giao dịch xe đã chốt bán thành công từ cơ sở dữ liệu."""
    urls_to_try = [
        sync_database_url or settings.DATABASE_SYNC_URL,
        "postgresql://postgres:postgres@localhost:5434/used_cars_db",
    ]
    current_year = datetime.now(timezone.utc).year

    query = text("""
        SELECT 
            b.name AS "Brand",
            m.name AS "Model",
            r.title AS "Name",
            r.manufacture_year AS "Year",
            r.odometer_km AS "Odometer_Km",
            r.mileage_unknown AS "Mileage_Unknown",
            r.body_type AS "Body_Type",
            r.fuel_type AS "Fuel_Type",
            r.seats AS "Seats",
            r.doors AS "Doors",
            r.origin AS "Origin",
            r.province_code AS "Province_Code",
            r.price_vnd AS "Price_VND"
        FROM listings l
        JOIN listing_revisions r ON (l.published_revision_id = r.id OR l.id = r.listing_id)
        JOIN vehicle_brands b ON r.brand_id = b.id
        JOIN vehicle_models m ON r.model_id = m.id
        WHERE l.status = 'SOLD' AND r.price_vnd > 0
    """)

    df_sold = pd.DataFrame()
    for db_url in urls_to_try:
        try:
            engine = create_engine(db_url)
            with engine.connect() as conn:
                df_sold = pd.read_sql(query, conn)
            break
        except Exception as exc:
            logger.debug(f"[RETRAIN] DB connection to {db_url} failed: {exc}")

    if df_sold.empty:
        return pd.DataFrame()

    # Xử lý các cột đặc trưng chuẩn hóa
    df_sold["Age"] = current_year - df_sold["Year"]
    df_sold["Price_Million"] = df_sold["Price_VND"] / 1_000_000.0
    df_sold["Location_Region"] = df_sold["Province_Code"].apply(_map_province_to_region)
    df_sold["Variant"] = "Standard"
    df_sold["Engine_Displacement"] = 1.5
    df_sold["Engine_Unknown"] = 0
    df_sold["Seats"] = df_sold["Seats"].fillna(5).astype(int)
    df_sold["Doors"] = df_sold["Doors"].fillna(4).astype(int)
    df_sold["Is_Imported"] = df_sold["Origin"].apply(lambda x: 1 if str(x).upper() == "IMPORTED" else 0)
    df_sold["Mileage_Unknown"] = df_sold["Mileage_Unknown"].apply(lambda x: 1 if x else 0)
    df_sold["Odometer_Km"] = df_sold["Odometer_Km"].fillna(0).astype(int)

    return df_sold


def retrain_pipeline(
    iterations: int = 800,
    learning_rate: float = 0.05,
    depth: int = 7,
) -> Dict[str, Any]:
    """Quy trình tái huấn luyện mô hình CatBoost với dữ liệu sàn mở rộng."""
    # 1. Đọc dữ liệu nền tảng
    csv_path = DATA_DIR / "cleaned_cars_v4.csv"
    if not csv_path.exists():
        csv_path = DATA_DIR / "cleaned_cars.csv"

    df_base = pd.read_csv(csv_path)

    # 2. Bổ sung dữ liệu giao dịch thực tế
    df_sold = extract_sold_listings_df()
    if not df_sold.empty:
        common_cols = [c for c in df_base.columns if c in df_sold.columns]
        df = pd.concat([df_base[common_cols], df_sold[common_cols]], ignore_index=True)
        logger.info(f"[RETRAIN] Appended {len(df_sold)} sold transactions to base dataset.")
    else:
        df = df_base

    # Khử trùng lặp
    df = df.drop_duplicates(subset=CATEGORIES + NUMBERS + ["Year", "Price_Million"]).reset_index(drop=True)

    X = df[CATEGORIES + NUMBERS].copy()
    X[CATEGORIES] = X[CATEGORIES].fillna("UNKNOWN").astype(str)
    y = df["Price_Million"].to_numpy()

    # Phân chia dữ liệu theo nhóm tránh rò rỉ dữ liệu cùng dòng xe
    groups = df[["Brand", "Model", "Year", "Odometer_Km"]].astype(str).agg("|".join, axis=1)
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    dev, test = next(splitter.split(X, y, groups))

    train_val, calibration = next(
        GroupShuffleSplit(n_splits=1, test_size=0.18, random_state=43).split(X.iloc[dev], y[dev], groups.iloc[dev])
    )
    dev_train, val = next(
        GroupShuffleSplit(n_splits=1, test_size=0.18, random_state=44).split(
            X.iloc[dev[train_val]], y[dev[train_val]], groups.iloc[dev[train_val]]
        )
    )

    training, validation, cal_idx = dev[train_val[dev_train]], dev[train_val[val]], dev[calibration]

    # 3. Huấn luyện CatBoost với ràng buộc đơn điệu
    model = cb.CatBoostRegressor(
        iterations=iterations,
        learning_rate=learning_rate,
        depth=depth,
        cat_features=CATEGORIES,
        monotone_constraints={"Age": -1, "Odometer_Km": -1},
        loss_function="RMSE",
        eval_metric="MAE",
        random_seed=42,
        verbose=False,
    )
    model.fit(
        X.iloc[training],
        np.log1p(y[training]),
        eval_set=(X.iloc[validation], np.log1p(y[validation])),
        early_stopping_rounds=60,
        verbose=False,
    )

    # 4. Đánh giá kiểm thử và tính toán Conformal Residual Quantile (q90)
    pred_test = np.expm1(model.predict(X.iloc[test]))
    y_test = y[test]

    mae = float(np.mean(np.abs(y_test - pred_test)))
    mape = float(np.mean(np.abs(y_test - pred_test) / np.maximum(y_test, 1))) * 100.0
    r2 = float(1.0 - np.sum((y_test - pred_test) ** 2) / np.sum((y_test - np.mean(y_test)) ** 2))

    # Conformal calibration trên tập calibration riêng biệt
    pred_cal = np.expm1(model.predict(X.iloc[cal_idx]))
    errors_cal = np.abs(y[cal_idx] - pred_cal) / np.maximum(1, pred_cal)
    q90 = float(np.sort(errors_cal)[min(len(errors_cal) - 1, int(np.ceil((len(errors_cal) + 1) * 0.90)) - 1)])

    # Thống kê phân phối theo dòng xe trên tập training (support_by_brand_model)
    support = {}
    train_df = df.iloc[training]
    for (brand, model_name), group in train_df.groupby(["Brand", "Model"]):
        support[f"{brand}|{model_name}"] = {
            "count": int(len(group)),
            "min_year": int(group["Year"].min()) if "Year" in group else 2000,
            "max_year": int(group["Year"].max()) if "Year" in group else 2026,
            "max_odo": float(group["Odometer_Km"].max()) if "Odometer_Km" in group else 300000.0,
            "median_engine": float(group["Engine_Displacement"].median()) if "Engine_Displacement" in group else 1.5,
            "median_price_million": float(group["Price_Million"].median()),
        }

    # 5. Lưu trữ Model Artifacts an toàn
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = ARTIFACTS_DIR / "catboost_log_price_v4.cbm"
    report_path = ARTIFACTS_DIR / "evaluation_report_v4.json"

    model.save_model(str(model_path))

    report_data = {
        "model_name": "CatBoost log-price",
        "model_version": "CatBoost-v4.0-Retrained",
        "version": "4.0.0",
        "training_reference_year": 2026,
        "retrained_at": datetime.now(timezone.utc).isoformat(),
        "total_samples": len(df),
        "split_rows": {
            "train": int(len(training)),
            "validation": int(len(validation)),
            "calibration": int(len(cal_idx)),
            "test": int(len(test)),
        },
        "categorical_features": CATEGORIES,
        "numerical_features": NUMBERS,
        "sold_transactions_ingested": len(df_sold),
        "test_samples": len(test),
        "metrics": {
            "MAE_Million": round(mae, 2),
            "MAPE_Percent": round(mape, 2),
            "R2_Score": round(r2, 4),
        },
        "conformal_calibration": {
            "q90_relative_ratio": round(q90, 4),
            "coverage_target": 0.90,
        },
        "support_by_brand_model": support,
    }

    report_path.write_text(json.dumps(report_data, indent=2, ensure_ascii=False), encoding="utf-8")
    logger.info(f"[RETRAIN SUCCESS] R2: {r2:.4f} | MAPE: {mape:.2f}% | q90: {q90:.4f}")

    return report_data


if __name__ == "__main__":
    result = retrain_pipeline(iterations=400)
    print("Retraining completed successfully:", json.dumps(result, indent=2))
