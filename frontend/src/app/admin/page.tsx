'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, formatVND, formatKm } from '@/lib/api';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminCard } from '@/features/admin/components/ui/AdminCard';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { ListingInspectionModal } from '@/features/admin/components/ListingInspectionModal';
import { useAdminUI } from '@/features/admin/context/AdminUIContext';
import { AdminMetrics, AdminListingItem, AdminUserItem, AdminReportItem, AdminAppointmentItem } from '@/features/admin/types';

// Analytical Chart Components
import { AdminTrendAreaChart } from '@/features/admin/components/charts/AdminTrendAreaChart';
import { AdminBrandShareBarChart } from '@/features/admin/components/charts/AdminBrandShareBarChart';
import { AdminPriceSegmentChart } from '@/features/admin/components/charts/AdminPriceSegmentChart';
import { AdminBodyTypeDonutChart } from '@/features/admin/components/charts/AdminBodyTypeDonutChart';
import { AdminFunnelKpiMetrics } from '@/features/admin/components/charts/AdminFunnelKpiMetrics';

export default function AdminDashboardPage() {
  const { toast } = useAdminUI();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentListings, setRecentListings] = useState<AdminListingItem[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUserItem[]>([]);
  const [pendingReports, setPendingReports] = useState<AdminReportItem[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<AdminAppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inspectListingId, setInspectListingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [metricsData, listingsData, usersData, reportsData, apptsData] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminListings(),
        api.getAdminUsers(),
        api.getAdminReports({ status: 'PENDING' }),
        api.getAdminAppointments({ limit: 5 }),
      ]);

      setMetrics(metricsData);
      setRecentListings(listingsData.slice(0, 8));
      setRecentUsers(usersData.slice(0, 5));
      setPendingReports(reportsData.slice(0, 5));
      setRecentAppointments(apptsData || []);
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu', err.message || 'Không thể tải dữ liệu bảng điều khiển');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleModalSuccess = (msg: string) => {
    toast.success('Thao tác thành công', msg);
    loadData();
  };

  // Calculations for distribution bar
  const totalListings = metrics?.total_listings || 1;
  const publishedCount = metrics?.published_listings || 0;
  const pendingCount = metrics?.pending_listings || 0;
  const soldCount = metrics?.sold_listings || 0;
  const rejectedCount = metrics?.rejected_listings || 0;

  const publishedPct = Math.round((publishedCount / totalListings) * 100);
  const pendingPct = Math.round((pendingCount / totalListings) * 100);
  const soldPct = Math.round((soldCount / totalListings) * 100);
  const rejectedPct = Math.max(0, 100 - publishedPct - pendingPct - soldPct);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      <AdminHeader
        title="Trung tâm Điều hành & Thống kê AuraAuto"
        subtitle="Hệ thống Báo cáo Trực quan, Giám sát Thị trường & Điều phối Doanh nghiệp"
        onRefresh={loadData}
        isRefreshing={refreshing}
      />

      <main className="p-8 space-y-8 flex-1">
        {/* 6 Top KPI Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Total Users */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-1 hover:border-secondary transition-colors">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-md text-xs font-semibold uppercase tracking-wider">Thành viên</span>
              <span className="material-symbols-outlined text-[20px] text-secondary">group</span>
            </div>
            <div className="font-headline-md text-2xl font-bold text-primary">
              {metrics ? metrics.total_users.toLocaleString() : '...'}
            </div>
            <div className="font-body-sm text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>
              <span>Người mua &amp; Bán</span>
            </div>
          </div>

          {/* Card 2: Total Listings */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-1 hover:border-secondary transition-colors">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-md text-xs font-semibold uppercase tracking-wider">Tổng tin xe</span>
              <span className="material-symbols-outlined text-[20px] text-secondary">directions_car</span>
            </div>
            <div className="font-headline-md text-2xl font-bold text-primary">
              {metrics ? metrics.total_listings.toLocaleString() : '...'}
            </div>
            <div className="font-body-sm text-[11px] text-outline">Toàn sàn giao dịch</div>
          </div>

          {/* Card 3: Pending Review */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs space-y-1 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between text-amber-800">
              <span className="font-label-md text-xs font-bold uppercase tracking-wider">Chờ thẩm định</span>
              <span className="material-symbols-outlined text-[20px] text-amber-600">hourglass_top</span>
            </div>
            <div className="font-headline-md text-2xl font-bold text-amber-900">
              {metrics ? metrics.pending_listings.toLocaleString() : '...'}
            </div>
            <div className="font-body-sm text-[11px] text-amber-700 font-semibold">Cần duyệt gấp</div>
          </div>

          {/* Card 4: Published */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-1 hover:border-secondary transition-colors">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-md text-xs font-semibold uppercase tracking-wider">Đang niêm yết</span>
              <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
            </div>
            <div className="font-headline-md text-2xl font-bold text-primary">
              {metrics ? metrics.published_listings.toLocaleString() : '...'}
            </div>
            <div className="font-body-sm text-[11px] text-emerald-700 font-medium">Sẵn sàng giao dịch</div>
          </div>

          {/* Card 5: Sold */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-1 hover:border-secondary transition-colors">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-md text-xs font-semibold uppercase tracking-wider">Đã giao dịch</span>
              <span className="material-symbols-outlined text-[20px] text-secondary">sell</span>
            </div>
            <div className="font-headline-md text-2xl font-bold text-primary">
              {metrics ? metrics.sold_listings.toLocaleString() : '...'}
            </div>
            <div className="font-body-sm text-[11px] text-outline">Xe đã sang tên</div>
          </div>

          {/* Card 6: Appointments */}
          <Link
            href="/admin/lich-hen"
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-1 hover:border-secondary transition-all block group"
          >
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-md text-xs font-semibold uppercase tracking-wider group-hover:text-secondary transition-colors">
                Lịch xem xe
              </span>
              <span className="material-symbols-outlined text-[20px] text-secondary">calendar_month</span>
            </div>
            <div className="font-headline-md text-2xl font-bold text-primary">
              {metrics ? metrics.total_appointments.toLocaleString() : '...'}
            </div>
            <div className="font-body-sm text-[11px] font-medium flex items-center justify-between">
              {metrics?.pending_appointments ? (
                <span className="text-amber-800 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span>{metrics.pending_appointments} chờ duyệt</span>
                </span>
              ) : (
                <span className="text-emerald-700">Tất cả đã duyệt</span>
              )}
              <span className="text-secondary text-[10px] group-hover:underline">Chi tiết &rarr;</span>
            </div>
          </Link>
        </div>

        {/* SECTION 1: Operational Efficiency & GMV Metrics */}
        <AdminFunnelKpiMetrics
          totalListings={metrics?.total_listings}
          publishedListings={metrics?.published_listings}
          soldListings={metrics?.sold_listings}
          pendingListings={metrics?.pending_listings}
          rejectedListings={metrics?.rejected_listings}
          totalAppointments={metrics?.total_appointments}
          appointmentSuccessRate={metrics?.appointment_success_rate}
          totalInventoryVal={metrics?.total_inventory_value_vnd}
          totalSoldVal={metrics?.total_sold_value_vnd}
        />

        {/* SECTION 2: Analytics Charts - Row 1 (Trend Area Chart & Body Type Donut) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AdminTrendAreaChart data={metrics?.monthly_trend} />
          </div>
          <div className="lg:col-span-1">
            <AdminBodyTypeDonutChart data={metrics?.body_type_distribution} />
          </div>
        </div>

        {/* SECTION 3: Analytics Charts - Row 2 (Brand Market Share & Price Segment Histogram) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AdminBrandShareBarChart data={metrics?.brand_distribution} />
          <AdminPriceSegmentChart data={metrics?.price_segments} />
        </div>

        {/* SECTION 4: Inventory Status Progress Bar */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">donut_large</span>
                <span>Phân bổ Trạng thái Kho Phương tiện Toàn Sàn</span>
              </h3>
              <p className="font-body-sm text-xs text-outline mt-0.5">
                Tổng cộng {totalListings} tin xe trên toàn bộ hệ thống AuraAuto
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Đang bán ({publishedPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Chờ duyệt ({pendingPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Đã bán ({soldPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span>Khác ({rejectedPct}%)</span>
              </span>
            </div>
          </div>

          {/* Progress Stack Bar */}
          <div className="h-3 w-full rounded-full bg-surface-container-high overflow-hidden flex">
            <div
              style={{ width: `${publishedPct}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Đang bán: ${publishedCount} tin (${publishedPct}%)`}
            />
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`Chờ duyệt: ${pendingCount} tin (${pendingPct}%)`}
            />
            <div
              style={{ width: `${soldPct}%` }}
              className="bg-blue-500 transition-all duration-500"
              title={`Đã bán: ${soldCount} tin (${soldPct}%)`}
            />
            <div
              style={{ width: `${rejectedPct}%` }}
              className="bg-gray-400 transition-all duration-500"
              title={`Khác / Bị từ chối: ${rejectedCount} tin`}
            />
          </div>
        </div>

        {/* SECTION 5: Appointments Conversion & Direct Inspection Monitoring */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">calendar_month</span>
                <span>Giám sát Lịch hẹn Xem xe &amp; Tỷ lệ Chuyển đổi Thực tế</span>
              </h3>
              <p className="font-body-sm text-xs text-outline mt-0.5">
                Hiệu quả kết nối Người mua &amp; Showroom/Người bán trực tiếp trên sàn AuraAuto
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs font-semibold text-primary">
                Tỷ lệ hoàn thành: <span className="font-mono text-emerald-700 font-bold">{metrics?.appointment_success_rate || 0}%</span>
              </div>
              <Link href="/admin/lich-hen">
                <AdminButton variant="outline" size="xs" iconRight="arrow_forward">
                  Trung tâm Lịch hẹn ({metrics?.total_appointments || 0})
                </AdminButton>
              </Link>
            </div>
          </div>

          {/* Quick Metrics 4 Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-0.5">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                <span>Chờ xác nhận</span>
                <span className="material-symbols-outlined text-[15px] text-amber-600">hourglass_top</span>
              </div>
              <div className="font-mono font-bold text-xl text-amber-950">
                {metrics?.pending_appointments || 0}
              </div>
              <div className="text-[10px] text-amber-700">Người bán chưa phản hồi</div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-0.5">
              <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center justify-between">
                <span>Đã xác nhận</span>
                <span className="material-symbols-outlined text-[15px] text-blue-600">event_available</span>
              </div>
              <div className="font-mono font-bold text-xl text-blue-950">
                {metrics?.confirmed_appointments || 0}
              </div>
              <div className="text-[10px] text-blue-700">Đã chốt lịch gặp xem xe</div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-0.5">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                <span>Đã hoàn tất</span>
                <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
              </div>
              <div className="font-mono font-bold text-xl text-emerald-950">
                {metrics?.completed_appointments || 0}
              </div>
              <div className="text-[10px] text-emerald-700">Buổi xem xe thành công</div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200/80 space-y-0.5">
              <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center justify-between">
                <span>Đã hủy / Từ chối</span>
                <span className="material-symbols-outlined text-[15px] text-red-600">event_busy</span>
              </div>
              <div className="font-mono font-bold text-xl text-red-950">
                {(metrics?.cancelled_appointments || 0) + (metrics?.declined_appointments || 0)}
              </div>
              <div className="text-[10px] text-red-700">Không diễn ra cuộc hẹn</div>
            </div>
          </div>

          {/* Mini Table of Recent Appointments */}
          {recentAppointments.length > 0 && (
            <div className="rounded-xl border border-surface-container-high overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low text-outline uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Mã &amp; Xe quan tâm</th>
                    <th className="py-2.5 px-3">Người mua</th>
                    <th className="py-2.5 px-3">Người bán</th>
                    <th className="py-2.5 px-3">Thời gian hẹn</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {recentAppointments.slice(0, 4).map((appt) => (
                    <tr key={appt.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container-highest shrink-0 relative">
                            {appt.listing?.primary_image_url ? (
                              <img src={appt.listing.primary_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-outline">
                                <span className="material-symbols-outlined text-[14px]">directions_car</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-primary block truncate max-w-[180px]">{appt.listing?.title}</span>
                            <span className="font-mono text-[10px] text-secondary font-bold">#{appt.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-primary font-medium">{appt.buyer?.display_name}</td>
                      <td className="py-2.5 px-3 text-outline">{appt.seller?.display_name}</td>
                      <td className="py-2.5 px-3 text-outline font-mono text-[11px]">
                        {new Date(appt.scheduled_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <AdminBadge status={appt.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link href="/admin/lich-hen">
                          <span className="text-secondary hover:underline font-semibold text-[11px]">Xem &rarr;</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 5: Recent Vehicle Listings & Trust Alerts / Recent Users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Recent Listings */}
          <div className="lg:col-span-2">
            <AdminCard
              title="Tin đăng phương tiện mới nhất"
              subtitle="Hồ sơ xe người bán vừa cập nhật lên sàn giao dịch"
              icon="directions_car"
              action={
                <Link href="/admin/tin-dang">
                  <AdminButton variant="outline" size="xs" iconRight="arrow_forward">
                    Xem tất cả ({metrics?.total_listings || 0})
                  </AdminButton>
                </Link>
              }
              bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-container-high bg-surface-container-low text-outline uppercase font-semibold text-[11px]">
                      <th className="py-3 px-4">Phương tiện</th>
                      <th className="py-3 px-4">Giá niêm yết</th>
                      <th className="py-3 px-4">Người bán</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thẩm định</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {recentListings.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setInspectListingId(item.id)}
                        className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded-lg overflow-hidden bg-surface-container-high border border-surface-container-high shrink-0">
                              {item.primary_image_url ? (
                                <img
                                  src={item.primary_image_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-outline">
                                  <span className="material-symbols-outlined text-[16px]">image</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-primary truncate max-w-[220px] group-hover:text-secondary transition-colors">
                                {item.title}
                              </span>
                              <span className="text-[11px] text-outline">
                                Năm {item.manufacture_year} • {formatKm(item.odometer_km)} • {item.province_code}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-secondary text-xs">
                          {formatVND(item.price_vnd)}
                        </td>

                        <td className="py-3 px-4 text-on-surface">
                          <div className="flex flex-col">
                            <span className="font-medium text-primary">{item.seller_name}</span>
                            <span className="text-[10px] text-outline truncate max-w-[120px]">
                              {item.seller_phone || item.seller_email || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <AdminBadge status={item.status} size="sm" />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectListingId(item.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-secondary hover:text-white transition-all text-xs font-semibold cursor-pointer"
                          >
                            Thẩm định
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          </div>

          {/* Column 3: Trust & Safety Alerts + Recent Users */}
          <div className="space-y-6">
            {/* Trust & Safety Pending Reports Box */}
            <AdminCard
              title="Khiếu nại & Vi phạm"
              subtitle="Tố cáo gian lận / xe lỗi cần xử lý"
              icon="gavel"
              action={
                <Link href="/admin/bao-cao">
                  <AdminButton variant="outline" size="xs" iconRight="arrow_forward">
                    Xem hết
                  </AdminButton>
                </Link>
              }
              bodyClassName="p-0"
            >
              {pendingReports.length === 0 ? (
                <div className="p-6 text-center text-xs text-outline space-y-1">
                  <span className="material-symbols-outlined text-emerald-600 text-[24px]">verified_user</span>
                  <p>Không có khiếu nại nào đang tồn đọng</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-container-high">
                  {pendingReports.map((r) => (
                    <div key={r.id} className="p-3.5 space-y-1 hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px]">
                          {r.reason_code}
                        </span>
                        <span className="text-[10px] text-outline">
                          {new Date(r.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-primary font-medium line-clamp-2">
                        {r.description}
                      </p>
                      <div className="text-[10px] text-outline">
                        Gửi bởi: <span className="text-on-surface font-semibold">{r.reporter_name || r.reporter_email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>

            {/* Recent Registered Users */}
            <AdminCard
              title="Thành viên mới gia nhập"
              subtitle="Tài khoản vừa kích hoạt"
              icon="group"
              action={
                <Link href="/admin/nguoi-dung">
                  <AdminButton variant="outline" size="xs" iconRight="arrow_forward">
                    Tất cả
                  </AdminButton>
                </Link>
              }
              bodyClassName="p-0"
            >
              <div className="divide-y divide-surface-container-high">
                {recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 flex items-center justify-between hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-surface-container-high border border-surface-container-high flex items-center justify-center font-bold text-xs uppercase text-primary shrink-0">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.display_name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          u.display_name.charAt(0)
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-primary truncate">
                          {u.display_name}
                        </span>
                        <span className="text-[11px] text-outline truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    <AdminBadge status={u.role} size="sm" showDot={false} />
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>
        </div>
      </main>

      {/* 160-Point Inspection Modal */}
      {inspectListingId && (
        <ListingInspectionModal
          listingId={inspectListingId}
          onClose={() => setInspectListingId(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
