import os
import json
from pathlib import Path
from typing import Tuple, Optional, List

from app.modules.ai.schemas import ValuationRequest, ValuationBreakdownItem

# Global CatBoost Model & Metadata Singleton
_catboost_model = None
_conformal_rel_ratio = 0.2134  # Relative 80% conformal coverage from evaluation report (21.34%)
_optimized_model = None
_optimized_report = None

LUXURY_BRANDS = {
    "porsche", "land rover", "lexus", "mercedes-benz", "mercedes benz", "mercedes",
    "bmw", "audi", "volvo", "bentley", "rolls-royce", "rolls royce", "maserati",
    "aston martin", "ferrari", "lamborghini", "jaguar", "maybach", "cadillac", "lincoln", "mclaren"
}


def get_conformal_rel_ratio() -> float:
    return _conformal_rel_ratio


def get_optimized_artifacts(version: str = "v3"):
    global _optimized_model, _optimized_report
    if _optimized_model is None or _optimized_report is None:
        import catboost as cb
        base = Path(__file__).resolve().parents[3] / "ml_training" / "artifacts"
        model_file = base / f"catboost_log_price_{version}.cbm"
        report_file = base / f"evaluation_report_{version}.json"
        if not model_file.exists() or not report_file.exists():
            model_file = base / "catboost_log_price_v3.cbm"
            report_file = base / "evaluation_report_v3.json"
        model = cb.CatBoostRegressor()
        model.load_model(str(model_file))
        report = json.loads(report_file.read_text(encoding="utf-8"))
        _optimized_model, _optimized_report = model, report
    return _optimized_model, _optimized_report


def get_catboost_model():
    global _catboost_model, _conformal_rel_ratio
    if _catboost_model is None:
        try:
            import catboost as cb
            model_paths = [
                os.path.join(os.getcwd(), "ml_training", "artifacts", "catboost_used_cars.cbm"),
                os.path.join(os.getcwd(), "backend", "ml_training", "artifacts", "catboost_used_cars.cbm"),
                "/app/ml_training/artifacts/catboost_used_cars.cbm",
            ]
            for p in model_paths:
                if os.path.exists(p):
                    model = cb.CatBoostRegressor()
                    model.load_model(p)
                    _catboost_model = model
                    break

            report_paths = [
                os.path.join(os.getcwd(), "ml_training", "artifacts", "evaluation_report.json"),
                os.path.join(os.getcwd(), "backend", "ml_training", "artifacts", "evaluation_report.json"),
                "/app/ml_training/artifacts/evaluation_report.json",
            ]
            for rp in report_paths:
                if os.path.exists(rp):
                    with open(rp, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        calib = data.get("conformal_calibration", {})
                        if "q90_relative_ratio" in calib:
                            _conformal_rel_ratio = float(calib["q90_relative_ratio"])
                    break
        except Exception:
            _catboost_model = None
    return _catboost_model


def normalize_brand_and_model(brand_input: str, model_input: str) -> Tuple[str, str]:
    try:
        from ml_training.preprocess import normalize_brand, extract_model
        b = normalize_brand(brand_input)
        m = extract_model(b, model_input)
        return b, m
    except Exception:
        b = (brand_input or "Other").strip().title()
        if "mercedes" in b.lower():
            b = "Mercedes-Benz"
        m = (model_input or "Other").strip().title()
        return b, m


def resolve_valuation_support(report: dict, brand: str, model: str) -> Tuple[dict, str]:
    """Use the narrowest available reference group without refusing a valuation."""
    groups = report["support_by_brand_model"]
    exact = groups.get(f"{brand}|{model}")
    if exact:
        return exact, "EXACT" if exact["count"] >= 10 else "SPARSE"

    brand_groups = [value for key, value in groups.items() if key.startswith(f"{brand}|")]
    candidates = brand_groups or list(groups.values())
    level = "BRAND" if brand_groups else "GLOBAL"
    total = sum(item["count"] for item in candidates)

    def weighted_average(field: str) -> float:
        return sum(item[field] * item["count"] for item in candidates) / total

    return {
        "count": total,
        "min_year": min(item["min_year"] for item in candidates),
        "max_year": max(item["max_year"] for item in candidates),
        "max_odo": max(item["max_odo"] for item in candidates),
        "median_engine": weighted_average("median_engine"),
        "median_price_million": weighted_average("median_price_million"),
    }, level


def infer_specs(
    brand_norm: str,
    model_norm: str,
    body_type: str,
    user_disp: Optional[float],
    user_imported: Optional[int],
    origin: Optional[str]
) -> Tuple[float, int]:
    # 1. Engine displacement
    disp = user_disp
    if not disp or disp <= 0.5:
        m = model_norm.lower()
        if any(k in m for k in ["morning", "i10", "fadil", "wigo", "brio", "spark", "matiz"]):
            disp = 1.2
        elif any(k in m for k in ["vios", "accent", "city", "soluto", "yaris", "raize", "mazda 2", "attrage", "almera"]):
            disp = 1.5
        elif any(k in m for k in ["civic", "corolla altis", "elantra", "k3", "cerato", "mazda 3", "lux a"]):
            disp = 1.8
        elif any(k in m for k in ["camry", "k5", "mazda 6", "accord", "sonata"]):
            disp = 2.5
        elif any(k in m for k in ["cx-5", "tucson", "sportage", "cr-v", "c-class", "glc", "3 series", "x3", "q5"]):
            disp = 2.0
        elif any(k in m for k in ["santafe", "sorento", "everest", "ranger", "carnival", "sedona", "fortuner", "hilux", "triton"]):
            disp = 2.2
        elif any(k in m for k in ["prado", "explorer", "rx", "gle", "e-class", "5 series"]):
            disp = 2.7
        elif any(k in m for k in ["land cruiser", "lx", "gls", "s-class", "7 series", "cayenne", "range rover"]):
            disp = 4.0
        elif body_type in ["HATCHBACK"]:
            disp = 1.2
        elif body_type in ["SEDAN"]:
            disp = 1.6
        elif body_type in ["SUV", "PICKUP", "MPV"]:
            disp = 2.2
        else:
            disp = 2.0

    # 2. Origin / Imported status
    if user_imported is not None:
        imported = 1 if user_imported else 0
    elif origin and "nhập" in origin.lower():
        imported = 1
    elif origin and ("lắp ráp" in origin.lower() or "trong nước" in origin.lower()):
        imported = 0
    else:
        m = model_norm.lower()
        b = brand_norm.lower()
        if b in ["lexus", "porsche", "audi", "land rover", "volvo", "rolls-royce", "bentley", "ferrari"]:
            imported = 1
        elif any(k in m for k in ["land cruiser", "alphard", "prado", "raize", "everest", "explorer", "ranger raptor", "camry"]):
            imported = 1
        else:
            imported = 0

    return float(disp), imported


def calculate_condition_adjustments(
    base_price_vnd: int, req: ValuationRequest
) -> Tuple[int, float, int, List[ValuationBreakdownItem]]:
    """
    Áp dụng bảng chuẩn thẩm định kỹ thuật ô tô đã qua sử dụng:
    Tính toán chiết khấu hoặc cộng thưởng dựa trên tình trạng thủy kích, tai nạn,
    rã máy đại tu động cơ/hộp số, lịch sử bảo dưỡng và số đời chủ.
    """
    total_pct = 0.0
    items: List[ValuationBreakdownItem] = []

    # 1. Thủy kích / Ngập nước
    flood = (req.flood_status or "").upper()
    if flood in {"CONFIRMED", "SUBMERGED", "MAJOR", "SEVERE"}:
        pct = -28.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="FLOOD",
            label="Thủy kích / Ngập khoang động cơ",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Khấu trừ nghiêm trọng do xe từng bị thủy kích/ngập nước, tiềm ẩn rủi ro chập cháy điện tử và mục gầm",
        ))
    elif flood in {"SUSPECTED", "MINOR", "LIGHT"}:
        pct = -10.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="FLOOD",
            label="Dấu hiệu nghi ngờ ngập nước / Ẩm sàn xe",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Khấu trừ do ẩm sàn nội thất và ảnh hưởng giắc điện gầm xe",
        ))
    elif flood in {"NONE", "NO", "FALSE", "CLEAN"}:
        items.append(ValuationBreakdownItem(
            category="FLOOD",
            label="Cam kết không ngập nước / thủy kích",
            impact="NGUYÊN BẢN",
            percentage=0.0,
            amount_vnd=0,
            note="Khoang động cơ và sàn xe nguyên bản, bảo toàn 100% giá trị",
        ))

    # 2. Tai nạn đâm đụng
    accident = (req.accident_status or "").upper()
    if accident in {"MAJOR", "SEVERE"}:
        pct = -25.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="ACCIDENT",
            label="Tai nạn đâm đụng biến dạng kết cấu sắt-xi",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Khấu trừ nghiêm trọng do tổn hại khung gầm sắt-xi chịu lực, túi khí đã kích hoạt",
        ))
    elif accident == "MODERATE":
        pct = -10.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="ACCIDENT",
            label="Va chạm biến dạng thân vỏ phụ tùng",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Khấu trừ các chi tiết vỏ đã từng nắn chỉnh hoặc gò hàn lại",
        ))
    elif accident in {"MINOR", "LIGHT"}:
        pct = -2.5
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="ACCIDENT",
            label="Xước xát thân vỏ nhẹ theo thời gian",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Khấu trừ nhẹ chi phí đánh bóng và sơn tỉa dặm ngoại thất",
        ))
    elif accident in {"NONE", "NO", "CLEAN"}:
        items.append(ValuationBreakdownItem(
            category="ACCIDENT",
            label="Cam kết không đâm đụng tai nạn",
            impact="NGUYÊN BẢN",
            percentage=0.0,
            amount_vnd=0,
            note="Khung xương, cột kèo và keo chỉ sắt-xi 100% nguyên bản",
        ))

    # 3. Đại tu động cơ & hộp số (Mất zin máy)
    if req.engine_repaired is True:
        pct = -18.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="ENGINE",
            label="Động cơ đã từng rã máy / đại tu (mất máy zin)",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Động cơ đã can thiệp cơ khí cẩu máy ra làm lại, làm giảm độ bền và tính nguyên bản",
        ))
    elif req.engine_repaired is False:
        items.append(ValuationBreakdownItem(
            category="ENGINE",
            label="Động cơ nguyên bản (Máy zin)",
            impact="NGUYÊN BẢN",
            percentage=0.0,
            amount_vnd=0,
            note="Ốc máy, chân máy và gioăng giàn cò nguyên bản từ nhà sản xuất",
        ))

    if req.transmission_repaired is True:
        pct = -12.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="TRANSMISSION",
            label="Hộp số đã từng rã sửa chữa / thay thế phụ tùng",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Hộp số đã qua đại tu, tiềm ẩn độ trễ sang số và giật cục",
        ))

    # 4. Lịch sử bảo dưỡng
    srv = (req.service_history or "").upper()
    if srv in {"FULL", "FULL_DEALER"}:
        pct = +4.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="SERVICE",
            label="Lịch sử bảo dưỡng chính hãng đầy đủ",
            impact="TĂNG",
            percentage=pct,
            amount_vnd=amt,
            note="Điểm cộng: Xe được bảo dưỡng định kỳ đúng chuẩn hãng, máy móc vận hành mượt mà",
        ))
    elif srv in {"NONE", "IRREGULAR", "NO"}:
        pct = -4.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="SERVICE",
            label="Lịch sử bảo dưỡng không rõ ràng",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Khấu trừ chi phí kiểm tra và bảo dưỡng tổng thể dự phòng",
        ))
    elif srv in {"PARTIAL", "REGULAR_GARAGE"}:
        items.append(ValuationBreakdownItem(
            category="SERVICE",
            label="Có sổ theo dõi bảo dưỡng định kỳ",
            impact="NGUYÊN BẢN",
            percentage=0.0,
            amount_vnd=0,
            note="Xe duy trì bảo dưỡng thường xuyên tại gara/xưởng dịch vụ uy tín",
        ))

    # 5. Số đời chủ & Sơn lại
    if req.owner_count == 1:
        pct = +2.5
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="OWNERSHIP",
            label="Xe 1 đời chủ từ lúc mua mới",
            impact="TĂNG",
            percentage=pct,
            amount_vnd=amt,
            note="Điểm cộng uy tín: Xe được 1 chủ sử dụng từ đầu, rõ ràng lai lịch",
        ))
    elif req.owner_count and req.owner_count >= 3:
        pct = -4.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="OWNERSHIP",
            label=f"Xe đã qua {req.owner_count} đời chủ",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Xe đổi chủ nhiều lần làm giảm tính liền mạch trong lịch sử vận hành",
        ))

    if req.repainted_parts_count and req.repainted_parts_count >= 5:
        pct = -3.0
        amt = int(round(base_price_vnd * (pct / 100.0) / 1_000_000) * 1_000_000)
        total_pct += pct
        items.append(ValuationBreakdownItem(
            category="PAINT",
            label=f"Đã sơn dặm lại {req.repainted_parts_count} chi tiết",
            impact="GIẢM",
            percentage=pct,
            amount_vnd=amt,
            note="Khấu trừ chi tiết sơn không đồng màu so với sơn zin nguyên bản",
        ))

    # Tính toán hệ số tổng (giới hạn từ 0.35 đến 1.12)
    condition_multiplier = round(max(0.35, min(1.12, 1.0 + (total_pct / 100.0))), 4)
    adjusted_price_vnd = int(round(base_price_vnd * condition_multiplier / 5_000_000) * 5_000_000)
    total_adj_vnd = adjusted_price_vnd - base_price_vnd

    return adjusted_price_vnd, condition_multiplier, total_adj_vnd, items
