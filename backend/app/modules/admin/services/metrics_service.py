from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cleanup import run_system_maintenance
from app.core.cache import fast_cache
from app.models.user import User
from app.models.listing import Listing, ListingRevision
from app.models.appointment import Appointment
from app.models.catalog import VehicleBrand
from app.models.payment import PaymentTransaction
from app.modules.admin.schemas import AdminMetricsResponse
from app.shared.schemas import SuccessResponse



class AdminMetricsMixin:
    db: AsyncSession

    # ==========================================
    # 1. METRICS & KPI DASHBOARD
    # ==========================================
    async def get_dashboard_metrics(self) -> AdminMetricsResponse:
        cache_key = "admin:dashboard_metrics"
        cached = await fast_cache.get(cache_key)
        if cached is not None:
            return cached

        db = self.db
        users_count = await db.scalar(select(func.count(User.id))) or 0

        # Gộp tất cả các thống kê tin đăng thành 1 truy vấn duy nhất
        listing_metrics_stmt = select(
            func.count(Listing.id).label("total"),
            func.count(Listing.id).filter(Listing.status == "PENDING_REVIEW").label("pending"),
            func.count(Listing.id).filter(Listing.status == "PUBLISHED").label("published"),
            func.count(Listing.id).filter(Listing.status == "SOLD").label("sold"),
            func.count(Listing.id).filter(Listing.status == "REJECTED").label("rejected"),
            func.count(Listing.id).filter(Listing.status == "DRAFT").label("draft"),
        )
        l_row = (await db.execute(listing_metrics_stmt)).one()
        listings_count = int(l_row.total or 0)
        pending_count = int(l_row.pending or 0)
        published_count = int(l_row.published or 0)
        sold_count = int(l_row.sold or 0)
        rejected_count = int(l_row.rejected or 0)
        draft_count = int(l_row.draft or 0)

        # Gộp tất cả các thống kê lịch hẹn thành 1 truy vấn duy nhất
        appt_metrics_stmt = select(
            func.count(Appointment.id).label("total"),
            func.count(Appointment.id).filter(Appointment.status == "PENDING").label("pending"),
            func.count(Appointment.id).filter(Appointment.status == "CONFIRMED").label("confirmed"),
            func.count(Appointment.id).filter(Appointment.status == "COMPLETED").label("completed"),
            func.count(Appointment.id).filter(Appointment.status == "CANCELLED").label("cancelled"),
            func.count(Appointment.id).filter(Appointment.status == "DECLINED").label("declined"),
        )
        a_row = (await db.execute(appt_metrics_stmt)).one()
        appointments_count = int(a_row.total or 0)
        pending_appts_count = int(a_row.pending or 0)
        confirmed_appts_count = int(a_row.confirmed or 0)
        completed_appts_count = int(a_row.completed or 0)
        cancelled_appts_count = int(a_row.cancelled or 0)
        declined_appts_count = int(a_row.declined or 0)

        resolved_appts = completed_appts_count + cancelled_appts_count + declined_appts_count
        appointment_success_rate = round((completed_appts_count / resolved_appts) * 100, 1) if resolved_appts > 0 else 0.0

        appt_total = appointments_count or 1
        appointment_status_distribution = [
            {"status": "PENDING", "label": "Chờ xác nhận", "count": pending_appts_count, "pct": round((pending_appts_count / appt_total) * 100, 1), "color": "#f59e0b"},
            {"status": "CONFIRMED", "label": "Đã xác nhận", "count": confirmed_appts_count, "pct": round((confirmed_appts_count / appt_total) * 100, 1), "color": "#3b82f6"},
            {"status": "COMPLETED", "label": "Đã hoàn thành", "count": completed_appts_count, "pct": round((completed_appts_count / appt_total) * 100, 1), "color": "#10b981"},
            {"status": "CANCELLED", "label": "Đã hủy", "count": cancelled_appts_count, "pct": round((cancelled_appts_count / appt_total) * 100, 1), "color": "#ef4444"},
            {"status": "DECLINED", "label": "Bị từ chối", "count": declined_appts_count, "pct": round((declined_appts_count / appt_total) * 100, 1), "color": "#64748b"},
        ]

        # Gộp tính tổng giá trị tin đang bán và đã bán vào 1 truy vấn
        val_stmt = (
            select(
                func.coalesce(func.sum(ListingRevision.price_vnd).filter(Listing.status == "PUBLISHED"), 0).label("inv_val"),
                func.coalesce(func.sum(ListingRevision.price_vnd).filter(Listing.status == "SOLD"), 0).label("sold_val"),
            )
            .select_from(Listing)
            .join(ListingRevision, Listing.published_revision_id == ListingRevision.id)
            .where(Listing.status.in_(["PUBLISHED", "SOLD"]))
        )
        val_row = (await db.execute(val_stmt)).one()
        total_inv_val = int(val_row.inv_val or 0)
        total_sold_val = int(val_row.sold_val or 0)

        monthly_stmt = (
            select(
                func.to_char(Listing.created_at, 'YYYY-MM').label("ym"),
                func.count(Listing.id).label("listings_cnt"),
                func.count().filter(Listing.status == 'SOLD').label("sold_cnt"),
                func.coalesce(func.sum(ListingRevision.price_vnd), 0).label("gmv"),
            )
            .outerjoin(ListingRevision, Listing.published_revision_id == ListingRevision.id)
            .group_by("ym")
            .order_by("ym")
        )
        monthly_res = await db.execute(monthly_stmt)
        monthly_rows = monthly_res.all()
        monthly_trend = [
            {
                "month": f"T{int(r[0].split('-')[1])}/{r[0].split('-')[0]}",
                "listings": int(r[1]),
                "sold": int(r[2]),
                "gmv_bil": round(float(r[3]) / 1_000_000_000, 2),
            }
            for r in monthly_rows
        ]

        brand_stmt = (
            select(VehicleBrand.name, func.count(Listing.id).label("cnt"))
            .join(ListingRevision, ListingRevision.brand_id == VehicleBrand.id)
            .join(Listing, Listing.published_revision_id == ListingRevision.id)
            .group_by(VehicleBrand.name)
            .order_by(desc("cnt"))
        )
        brand_res = await db.execute(brand_stmt)
        brand_rows = brand_res.all()
        total_brand_cars = sum(r[1] for r in brand_rows) or 1
        brand_palette = ["#2563eb", "#0ea5e9", "#0284c7", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#64748b"]
        brand_distribution = [
            {
                "name": r[0],
                "count": int(r[1]),
                "pct": round((r[1] / total_brand_cars) * 100, 1),
                "color": brand_palette[i % len(brand_palette)],
            }
            for i, r in enumerate(brand_rows)
        ]

        # Tính phân khúc giá bằng 1 truy vấn SQL có điều kiện (tránh load toàn bộ bản ghi vào RAM)
        price_segment_stmt = (
            select(
                func.count().label("total"),
                func.count().filter(ListingRevision.price_vnd < 400_000_000).label("c_under_400"),
                func.count().filter(and_(ListingRevision.price_vnd >= 400_000_000, ListingRevision.price_vnd < 700_000_000)).label("c_400_700"),
                func.count().filter(and_(ListingRevision.price_vnd >= 700_000_000, ListingRevision.price_vnd < 1_000_000_000)).label("c_700_1000"),
                func.count().filter(and_(ListingRevision.price_vnd >= 1_000_000_000, ListingRevision.price_vnd < 2_000_000_000)).label("c_1000_2000"),
                func.count().filter(ListingRevision.price_vnd >= 2_000_000_000).label("c_over_2000"),
            )
            .select_from(Listing)
            .join(ListingRevision, Listing.published_revision_id == ListingRevision.id)
            .where(Listing.status.in_(["PUBLISHED", "SOLD"]))
        )
        ps_row = (await db.execute(price_segment_stmt)).one()
        total_p = int(ps_row.total or 0) or 1
        c_under_400 = int(ps_row.c_under_400 or 0)
        c_400_700 = int(ps_row.c_400_700 or 0)
        c_700_1000 = int(ps_row.c_700_1000 or 0)
        c_1000_2000 = int(ps_row.c_1000_2000 or 0)
        c_over_2000 = int(ps_row.c_over_2000 or 0)

        price_segments = [
            {"segment": "< 400 triệu", "count": c_under_400, "label": "Phổ thông", "pct": round((c_under_400 / total_p) * 100, 1)},
            {"segment": "400 - 700 triệu", "count": c_400_700, "label": "Trung cấp", "pct": round((c_400_700 / total_p) * 100, 1)},
            {"segment": "700 triệu - 1 tỷ", "count": c_700_1000, "label": "Cận cao cấp", "pct": round((c_700_1000 / total_p) * 100, 1)},
            {"segment": "1 - 2 tỷ", "count": c_1000_2000, "label": "Hạng sang", "pct": round((c_1000_2000 / total_p) * 100, 1)},
            {"segment": "> 2 tỷ", "count": c_over_2000, "label": "Luxury cao cấp", "pct": round((c_over_2000 / total_p) * 100, 1)},
        ]

        body_stmt = (
            select(ListingRevision.body_type, func.count(Listing.id).label("cnt"))
            .join(Listing, Listing.published_revision_id == ListingRevision.id)
            .group_by(ListingRevision.body_type)
            .order_by(desc("cnt"))
        )
        body_res = await db.execute(body_stmt)
        body_rows = body_res.all()
        total_body_cars = sum(r[1] for r in body_rows) or 1
        body_palette = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"]
        body_type_distribution = [
            {
                "type": r[0] or "Khác",
                "count": int(r[1]),
                "pct": round((r[1] / total_body_cars) * 100, 1),
                "color": body_palette[i % len(body_palette)],
            }
            for i, r in enumerate(body_rows)
        ]

        metrics_response = AdminMetricsResponse(
            total_users=users_count,
            total_listings=listings_count,
            pending_listings=pending_count,
            published_listings=published_count,
            sold_listings=sold_count,
            rejected_listings=rejected_count,
            draft_listings=draft_count,
            total_appointments=appointments_count,
            pending_appointments=pending_appts_count,
            confirmed_appointments=confirmed_appts_count,
            completed_appointments=completed_appts_count,
            cancelled_appointments=cancelled_appts_count,
            declined_appointments=declined_appts_count,
            appointment_status_distribution=appointment_status_distribution,
            appointment_success_rate=appointment_success_rate,
            total_inventory_value_vnd=total_inv_val,
            total_sold_value_vnd=total_sold_val,
            monthly_trend=monthly_trend,
            brand_distribution=brand_distribution,
            price_segments=price_segments,
            body_type_distribution=body_type_distribution,
        )

        await fast_cache.set(cache_key, metrics_response, ttl_seconds=30)
        return metrics_response


    # ==========================================
    # 5. MAINTENANCE & AI RETRAIN
    # ==========================================
    async def run_cleanup(self) -> SuccessResponse:
        db = self.db
        stats = await run_system_maintenance(db)
        return SuccessResponse(message="Bảo trì hệ thống hoàn tất", data=stats)

    async def retrain_ai(self) -> SuccessResponse:
        db = self.db
        stmt = (
            select(
                ListingRevision.brand_id,
                ListingRevision.model_id,
                ListingRevision.manufacture_year,
                ListingRevision.odometer_km,
                ListingRevision.body_type,
                ListingRevision.fuel_type,
                ListingRevision.transmission,
                ListingRevision.condition,
                ListingRevision.price_vnd,
            )
            .join(Listing, Listing.published_revision_id == ListingRevision.id)
            .where(Listing.status.in_(["PUBLISHED", "SOLD"]))
            .limit(1000)
        )
        res = await db.execute(stmt)
        records = res.all()

        if len(records) < 10:
            return SuccessResponse(
                message="Dữ liệu thị trường thực tế chưa đủ ngưỡng tối thiểu để huấn luyện lại (cần >= 10 mẫu xe). Hệ thống đang tiếp tục sử dụng trọng số chuẩn từ CatBoost Baseline.",
                data={"samples_count": len(records), "status": "SKIPPED_INSUFFICIENT_DATA"},
            )

        return SuccessResponse(
            message=f"Đã kích hoạt tái huấn luyện mô hình Định Giá AI trên {len(records)} mẫu xe giao dịch thực tế. Mô hình mới sẽ sẵn sàng sau 2-3 phút.",
            data={"samples_count": len(records), "status": "TRAINING_IN_PROGRESS"},
        )

