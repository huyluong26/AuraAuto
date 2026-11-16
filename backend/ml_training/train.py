import sys
sys.stdout.reconfigure(encoding="utf-8")
import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import catboost as cb

def calculate_metrics(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    return {
        "MAE_Million": round(float(mae), 2),
        "MAE_VND": int(round(mae * 1_000_000)),
        "RMSE_Million": round(float(rmse), 2),
        "RMSE_VND": int(round(rmse * 1_000_000)),
        "R2_Score": round(float(r2), 4),
        "MAPE_Percent": round(float(mape), 2),
    }

def train_and_evaluate(data_path="backend/ml_training/data/cleaned_cars.csv", artifacts_dir="backend/ml_training/artifacts"):
    os.makedirs(artifacts_dir, exist_ok=True)
    print("=== STARTING ML TRAINING & EVALUATION ===")

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} cleaned records from {data_path}")

    # Features and Target
    cat_features = ['Brand', 'Model', 'Body_Type', 'Fuel_Type', 'Location_Region']
    num_features = ['Age', 'Odometer_Km', 'Mileage_Unknown', 'Engine_Displacement', 'Seats', 'Doors', 'Is_Imported']

    X = df[cat_features + num_features].copy()
    for col in cat_features:
        X[col] = X[col].astype(str)
    y = df['Price_Million'].copy()

    # Split: 70% Train, 15% Validation, 15% Test
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.1765, random_state=42  # 0.85 * 0.1765 ~= 0.15
    )

    print(f"Dataset split: Train={len(X_train)} ({len(X_train)/len(X):.1%}), Val={len(X_val)} ({len(X_val)/len(X):.1%}), Test={len(X_test)} ({len(X_test)/len(X):.1%})")

    results = {}

    # -------------------------------------------------------------
    # 1. BASELINE: Linear Regression (Ridge)
    # -------------------------------------------------------------
    print("\n--- Training Model 1: Ridge Regression (Baseline) ---")
    t0 = time.time()
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features),
        ]
    )
    ridge_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', Ridge(alpha=1.0))
    ])
    ridge_pipeline.fit(X_train, y_train)
    t_train_ridge = time.time() - t0

    y_pred_ridge_test = ridge_pipeline.predict(X_test)
    results['Ridge_Regression'] = calculate_metrics(y_test, y_pred_ridge_test)
    results['Ridge_Regression']['Training_Time_Sec'] = round(t_train_ridge, 2)
    print(f"Ridge Test: MAE={results['Ridge_Regression']['MAE_Million']} tr | RMSE={results['Ridge_Regression']['RMSE_Million']} tr | R2={results['Ridge_Regression']['R2_Score']}")

    # -------------------------------------------------------------
    # 2. MODEL 2: Random Forest Regressor
    # -------------------------------------------------------------
    print("\n--- Training Model 2: Random Forest Regressor ---")
    t0 = time.time()
    rf_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=120, max_depth=16, random_state=42, n_jobs=-1))
    ])
    rf_pipeline.fit(X_train, y_train)
    t_train_rf = time.time() - t0

    y_pred_rf_test = rf_pipeline.predict(X_test)
    results['Random_Forest'] = calculate_metrics(y_test, y_pred_rf_test)
    results['Random_Forest']['Training_Time_Sec'] = round(t_train_rf, 2)
    print(f"Random Forest Test: MAE={results['Random_Forest']['MAE_Million']} tr | RMSE={results['Random_Forest']['RMSE_Million']} tr | R2={results['Random_Forest']['R2_Score']}")

    # -------------------------------------------------------------
    # 3. MODEL 3: CatBoost Regressor (Native Categorical Handling)
    # -------------------------------------------------------------
    print("\n--- Training Model 3: CatBoost Regressor ---")
    t0 = time.time()

    # Cast categoricals to string for CatBoost
    X_train_cb = X_train.copy()
    X_val_cb = X_val.copy()
    X_test_cb = X_test.copy()
    for col in cat_features:
        X_train_cb[col] = X_train_cb[col].astype(str)
        X_val_cb[col] = X_val_cb[col].astype(str)
        X_test_cb[col] = X_test_cb[col].astype(str)

    catboost_model = cb.CatBoostRegressor(
        iterations=800,
        learning_rate=0.06,
        depth=6,
        cat_features=cat_features,
        monotone_constraints={'Age': -1, 'Odometer_Km': -1},
        loss_function='RMSE',
        eval_metric='MAE',
        random_seed=42,
        verbose=100
    )
    catboost_model.fit(
        X_train_cb, y_train,
        eval_set=(X_val_cb, y_val),
        early_stopping_rounds=50,
        verbose=100
    )
    t_train_cb = time.time() - t0

    y_pred_cb_test = catboost_model.predict(X_test_cb)
    results['CatBoost'] = calculate_metrics(y_test, y_pred_cb_test)
    results['CatBoost']['Training_Time_Sec'] = round(t_train_cb, 2)
    print(f"CatBoost Test: MAE={results['CatBoost']['MAE_Million']} tr | RMSE={results['CatBoost']['RMSE_Million']} tr | R2={results['CatBoost']['R2_Score']}")

    # -------------------------------------------------------------
    # 4. CONFORMAL RESIDUAL CALIBRATION (on validation set)
    # -------------------------------------------------------------
    print("\n--- Conformal Residual Calibration ---")
    y_pred_cb_val = catboost_model.predict(X_val_cb)
    residuals_val = np.abs(y_val - y_pred_cb_val)
    rel_residuals_val = residuals_val / np.maximum(y_pred_cb_val, 1.0)
    
    # Absolute residuals (legacy)
    q90_conformal = float(np.percentile(residuals_val, 90))
    q80_conformal = float(np.percentile(residuals_val, 80))
    
    # Relative percentage residuals (production standard)
    q80_rel = float(np.percentile(rel_residuals_val, 80))
    q90_rel = float(np.percentile(rel_residuals_val, 90))
    
    print(f"Absolute Residual 80% coverage: +/- {q80_conformal:.2f} triệu VNĐ")
    print(f"Absolute Residual 90% coverage: +/- {q90_conformal:.2f} triệu VNĐ")
    print(f"Relative Residual 80% coverage: +/- {q80_rel * 100:.2f}%")
    print(f"Relative Residual 90% coverage: +/- {q90_rel * 100:.2f}%")

    # Verify coverage on test set
    residuals_test = np.abs(y_test - y_pred_cb_test)
    rel_residuals_test = residuals_test / np.maximum(y_pred_cb_test, 1.0)
    actual_coverage_90 = np.mean(residuals_test <= q90_conformal) * 100
    actual_coverage_rel_90 = np.mean(rel_residuals_test <= q90_rel) * 100
    print(f"Actual Test Coverage (Absolute 90%): {actual_coverage_90:.2f}%")
    print(f"Actual Test Coverage (Relative 90%): {actual_coverage_rel_90:.2f}%")

    # -------------------------------------------------------------
    # 5. SAVE ARTIFACTS
    # -------------------------------------------------------------
    # Save CatBoost model
    model_cbm_path = os.path.join(artifacts_dir, "catboost_used_cars.cbm")
    catboost_model.save_model(model_cbm_path)
    print(f"Saved CatBoost model to: {model_cbm_path}")

    # Save Random Forest Pipeline as backup
    joblib.dump(rf_pipeline, os.path.join(artifacts_dir, "random_forest_pipeline.joblib"))

    # Feature importances
    feature_importances = dict(zip(X_train_cb.columns, [round(float(x), 2) for x in catboost_model.get_feature_importance()]))
    sorted_fi = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

    metadata = {
        "model_name": "CatBoost Regressor",
        "version": "2.0.0",
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset_rows": len(df),
        "target": "Price_Million (VNĐ)",
        "categorical_features": cat_features,
        "numerical_features": num_features,
        "metrics_summary": results,
        "conformal_calibration": {
            "method": "RELATIVE_CONFORMAL_RESIDUAL",
            "q80_relative_ratio": round(q80_rel, 4),
            "q90_relative_ratio": round(q90_rel, 4),
            "q80_relative_percent": round(q80_rel * 100, 2),
            "q90_relative_percent": round(q90_rel * 100, 2),
            "test_coverage_90_percent": round(actual_coverage_rel_90, 2),
            "legacy_q90_million": round(q90_conformal, 2),
        },
        "feature_importances": sorted_fi,
    }

    report_path = os.path.join(artifacts_dir, "evaluation_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"Saved evaluation report to: {report_path}")

    print("\n=== FINAL MODEL COMPARISON TABLE ===")
    comp_df = pd.DataFrame(results).T[['MAE_Million', 'RMSE_Million', 'R2_Score', 'MAPE_Percent', 'Training_Time_Sec']]
    print(comp_df.to_string())

    return metadata

if __name__ == "__main__":
    train_and_evaluate()
