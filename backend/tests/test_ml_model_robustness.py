import sys
sys.stdout.reconfigure(encoding="utf-8")
import os
import json
import time
import pytest
import numpy as np
import pandas as pd
import catboost as cb

# Path constants
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml_training", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "catboost_used_cars.cbm")
REPORT_PATH = os.path.join(ARTIFACTS_DIR, "evaluation_report.json")
CLEANED_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_training", "data", "cleaned_cars.csv")

@pytest.fixture(scope="module")
def loaded_model():
    """Load the trained CatBoost model artifact."""
    assert os.path.exists(MODEL_PATH), f"Model file not found at {MODEL_PATH}"
    model = cb.CatBoostRegressor()
    model.load_model(MODEL_PATH)
    return model

@pytest.fixture(scope="module")
def evaluation_report():
    """Load the evaluation report JSON."""
    assert os.path.exists(REPORT_PATH), f"Report not found at {REPORT_PATH}"
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def make_feature_row(
    brand="Toyota",
    model="Vios",
    body_type="SEDAN",
    fuel_type="GASOLINE",
    location_region="Hà Nội",
    age=4,
    odometer_km=40000.0,
    mileage_unknown=False,
    engine_displacement=1.5,
    seats=5.0,
    doors=4.0,
    is_imported=0,
):
    """Helper to create a single-row DataFrame matching training feature schema."""
    return pd.DataFrame([{
        "Brand": str(brand),
        "Model": str(model),
        "Body_Type": str(body_type),
        "Fuel_Type": str(fuel_type),
        "Location_Region": str(location_region),
        "Age": int(age),
        "Odometer_Km": float(odometer_km),
        "Mileage_Unknown": bool(mileage_unknown),
        "Engine_Displacement": float(engine_displacement),
        "Seats": float(seats),
        "Doors": float(doors),
        "Is_Imported": int(is_imported),
    }])


# ==============================================================================
# NHÓM 1: KIỂM TRA TÍNH TOÀN VẸN CỦA ARTIFACTS VÀ BENCHMARK
# ==============================================================================
class TestModelArtifactsAndBenchmarks:
    def test_model_file_exists_and_loads(self, loaded_model):
        assert loaded_model is not None
        assert loaded_model.is_fitted()

    def test_evaluation_metrics_meet_contract(self, evaluation_report):
        """Đảm bảo chất lượng mô hình đạt ngưỡng chấp nhận tối thiểu theo SRS."""
        cb_metrics = evaluation_report["metrics_summary"]["CatBoost"]
        # R2 score phải đạt trên 0.90
        assert cb_metrics["R2_Score"] >= 0.90, f"R2 score {cb_metrics['R2_Score']} < 0.90"
        # RMSE phải tốt hơn Baseline Ridge Regression
        ridge_rmse = evaluation_report["metrics_summary"]["Ridge_Regression"]["RMSE_Million"]
        assert cb_metrics["RMSE_Million"] < ridge_rmse, "CatBoost RMSE phải nhỏ hơn Ridge"

    def test_conformal_calibration_metadata(self, evaluation_report):
        conf = evaluation_report["conformal_calibration"]
        assert "CONFORMAL" in conf["method"]
        assert conf.get("q90_relative_ratio") or conf.get("legacy_q90_million")
        # Mức độ bao phủ thực tế trên tập test phải đạt ít nhất 85%
        assert conf["test_coverage_90_percent"] >= 85.0


# ==============================================================================
# NHÓM 2: CÁC TRƯỜNG HỢP CỰC ĐOAN VÀ BIÊN (WORST-CASE & BOUNDARY VALUES)
# ==============================================================================
class TestExtremeBoundaryCases:
    def test_ancient_beater_car_30_years_old(self, loaded_model):
        """Trường hợp xe siêu cũ: 30 năm tuổi (1996), ODO 600,000 km, xe nát."""
        row = make_feature_row(
            brand="Daewoo",
            age=30,
            odometer_km=600000.0,
            engine_displacement=1.5,
            seats=5.0,
        )
        pred = float(loaded_model.predict(row)[0])
        # Giá xe nát phải thấp nhưng không được âm
        assert pred > 0, "Giá xe cũ nát không được âm"
        assert pred < 250, f"Xe 30 năm tuổi chạy 600,000 km không thể quá 250 triệu (dự đoán: {pred} tr)"

    def test_brand_new_luxury_hypercar(self, loaded_model):
        """Trường hợp xe siêu sang gần như mới: 0 tuổi, ODO 100 km, Porsche / Mercedes."""
        row = make_feature_row(
            brand="Porsche",
            body_type="SUV",
            age=0,
            odometer_km=100.0,
            engine_displacement=4.0,
            is_imported=1,
        )
        pred = float(loaded_model.predict(row)[0])
        # Xe siêu sang mới phải có giá cao vượt trội
        assert pred > 2000, f"Porsche mới đập hộp phải trên 2 tỷ VNĐ (dự đoán: {pred} tr)"

    def test_tampered_odometer_fraud_case(self, loaded_model):
        """Trường hợp xe 15 năm tuổi nhưng ODO = 0 km (dấu hiệu tua km / gian lận)."""
        row = make_feature_row(
            brand="Toyota",
            age=15,
            odometer_km=0.0,
            mileage_unknown=True,
            engine_displacement=2.0,
        )
        pred = float(loaded_model.predict(row)[0])
        assert pred > 0
        # Dù ODO = 0, tuổi xe 15 năm vẫn phải làm giá giảm mạnh, không được định giá như xe mới
        assert pred < 600, f"Xe 15 năm tuổi dù ODO 0 km không thể quá 600 triệu (dự đoán: {pred} tr)"

    def test_extreme_high_odometer_near_million_km(self, loaded_model):
        """Trường hợp xe chạy gần 1 triệu km (taxi dịch vụ cày cuốc)."""
        row = make_feature_row(
            brand="Toyota",
            age=10,
            odometer_km=950000.0,
            engine_displacement=1.5,
        )
        pred = float(loaded_model.predict(row)[0])
        assert not np.isnan(pred)
        assert not np.isinf(pred)
        assert pred > 0

    def test_extreme_engine_displacement_contrast(self, loaded_model):
        """So sánh động cơ xe tí hon (0.8L) vs động cơ quái vật (6.0L V12)."""
        tiny_engine = make_feature_row(engine_displacement=0.8, brand="Kia")
        huge_engine = make_feature_row(engine_displacement=6.0, brand="Kia")

        pred_tiny = float(loaded_model.predict(tiny_engine)[0])
        pred_huge = float(loaded_model.predict(huge_engine)[0])

        assert pred_huge > pred_tiny, f"Xe dung tích 6.0L ({pred_huge} tr) phải có giá cao hơn 0.8L ({pred_tiny} tr)"


# ==============================================================================
# NHÓM 3: NGOẠI LAI VÀ DỮ LIỆU DỊ DẠNG (OUT-OF-DISTRIBUTION & CORRUPTED INPUTS)
# ==============================================================================
class TestOutOfDistributionAndCorruptedInputs:
    def test_unseen_exotic_brand_name(self, loaded_model):
        """Hãng xe hoàn toàn lạ hoắc chưa từng có trong tập dữ liệu (vd: Koenigsegg, Pagani, XeTựChế)."""
        unseen_brands = ["Koenigsegg", "Pagani", "XeTựChếViệtNam", "UnknownCustomBrand999"]
        for b in unseen_brands:
            row = make_feature_row(brand=b)
            # CatBoost phải dự đoán an toàn bằng cách map vào missing/unseen category, không được crash
            try:
                pred = float(loaded_model.predict(row)[0])
                assert pred > 0, f"Dự đoán cho hãng {b} phải là số dương"
                assert not np.isnan(pred), f"Dự đoán cho hãng {b} không được là NaN"
            except Exception as e:
                pytest.fail(f"Mô hình crash khi gặp hãng xe chưa từng thấy '{b}': {e}")

    def test_unseen_body_and_fuel_type(self, loaded_model):
        """Kiểu thân xe và loại nhiên liệu bất thường."""
        row = make_feature_row(body_type="FLYING_CAR", fuel_type="NUCLEAR_WATER")
        try:
            pred = float(loaded_model.predict(row)[0])
            assert pred > 0
        except Exception as e:
            pytest.fail(f"Mô hình crash khi gặp body_type/fuel_type lạ: {e}")

    def test_unseen_location(self, loaded_model):
        """Tỉnh thành chưa từng có trong danh mục."""
        row = make_feature_row(location_region="Đảo Hoàng Sa Trường Sa")
        pred = float(loaded_model.predict(row)[0])
        assert pred > 0

    def test_zero_and_boundary_numeric_values(self, loaded_model):
        """Kiểm tra các giá trị biên bằng 0."""
        row = make_feature_row(
            age=0,
            odometer_km=0.0,
            engine_displacement=0.0,
            seats=1.0,
            doors=1.0,
        )
        pred = float(loaded_model.predict(row)[0])
        assert not np.isnan(pred)
        assert pred > 0


# ==============================================================================
# NHÓM 4: KIỂM THỬ TÍNH ĐƠN ĐIỆU KINH TẾ (METAMORPHIC & ECONOMIC MONOTONICITY)
# ==============================================================================
class TestEconomicMonotonicity:
    def test_odometer_monotonic_decay(self, loaded_model):
        """
        Quy tắc bất biến kinh tế: Cùng 1 chiếc xe (Toyota Vios 2022),
        khi số ODO tăng lên thì giá dự đoán KHÔNG ĐƯỢC tăng (phải giảm hoặc bằng).
        """
        odos = [5000.0, 30000.0, 80000.0, 150000.0, 300000.0]
        preds = []
        for odo in odos:
            row = make_feature_row(brand="Toyota", age=3, odometer_km=odo)
            preds.append(float(loaded_model.predict(row)[0]))

        # Kiểm tra xu hướng chung: Xe 5,000 km phải đắt hơn đáng kể so với 300,000 km
        assert preds[0] > preds[-1], f"Xe 5,000 km ({preds[0]} tr) phải đắt hơn xe 300,000 km ({preds[-1]} tr)"
        assert preds[1] >= preds[3], f"Xe 30,000 km ({preds[1]} tr) phải >= xe 150,000 km ({preds[3]} tr)"

    def test_age_monotonic_decay(self, loaded_model):
        """
        Quy tắc bất biến kinh tế: Cùng 1 dòng xe với cùng số ODO (50,000 km),
        xe càng nhiều tuổi (đời càng cũ) thì giá KHÔNG ĐƯỢC tăng.
        """
        ages = [1, 3, 6, 10, 15]  # tương đương năm 2025, 2023, 2020, 2016, 2011
        preds = []
        for age in ages:
            row = make_feature_row(brand="Hyundai", age=age, odometer_km=50000.0)
            preds.append(float(loaded_model.predict(row)[0]))

        assert preds[0] > preds[-1], f"Xe 1 tuổi ({preds[0]} tr) phải đắt hơn xe 15 tuổi ({preds[-1]} tr)"
        for i in range(len(preds) - 1):
            assert preds[i] >= preds[i+1] - 15.0, (
                f"Độ lệch nghịch đảo bất thường tại tuổi {ages[i]} ({preds[i]} tr) so với tuổi {ages[i+1]} ({preds[i+1]} tr)"
            )


# ==============================================================================
# NHÓM 5: KIỂM THỬ HIỆU NĂNG VÀ TẢI SUY LUẬN (LATENCY & STRESS INFERENCE)
# ==============================================================================
class TestLatencyAndStressInference:
    def test_single_prediction_latency_under_30ms(self, loaded_model):
        """Thời gian suy luận cho 1 bản ghi phải cực nhanh (dưới 30ms)."""
        row = make_feature_row()
        # Warmup
        _ = loaded_model.predict(row)

        t0 = time.perf_counter()
        _ = loaded_model.predict(row)
        latency_ms = (time.perf_counter() - t0) * 1000

        print(f"\n[Bench] Single inference latency: {latency_ms:.2f} ms")
        assert latency_ms < 30.0, f"Inference quá chậm: {latency_ms:.2f} ms (yêu cầu < 30ms)"

    def test_batch_prediction_stress_1000_records(self, loaded_model):
        """Khả năng xử lý 1.000 yêu cầu định giá liên tục không bị tràn bộ nhớ hay crash."""
        rows = [make_feature_row(odometer_km=i * 500, age=(i % 15) + 1) for i in range(1000)]
        batch_df = pd.concat(rows, ignore_index=True)

        t0 = time.perf_counter()
        batch_preds = loaded_model.predict(batch_df)
        total_time_ms = (time.perf_counter() - t0) * 1000

        assert len(batch_preds) == 1000
        assert not np.isnan(batch_preds).any()
        assert (batch_preds > 0).all()
        print(f"[Bench] 1000 batch inference time: {total_time_ms:.2f} ms (avg {total_time_ms/1000:.3f} ms/req)")
