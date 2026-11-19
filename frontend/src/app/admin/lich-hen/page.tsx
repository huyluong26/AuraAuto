'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { formatVND } from '@/lib/api';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminTable } from '@/features/admin/components/ui/AdminTable';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminTabs } from '@/features/admin/components/ui/AdminTabs';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { useAdminAppointments } from '@/features/admin/hooks/useAdminAppointments';
import { AdminAppointmentDetailModal } from '@/features/admin/components/appointments/AdminAppointmentDetailModal';
import { AdminAppointmentItem, AppointmentStatus, TableColumn } from '@/features/admin/types';

export default function AdminAppointmentsPage() {
  const {
    appointments,
    loading,
    refreshing,
    statusFilter,
    setStatusFilter,
    searchKeyword,
    setSearchKeyword,
    selectedAppointment,
    setSelectedAppointment,
    loadAppointments,
    handleAdminCancel,
    kpiStats,
  } = useAdminAppointments();

  // Status Tabs
  const STATUS_TABS = useMemo(() => [
    { label: 'Tất cả cuộc hẹn', value: 'ALL', count: kpiStats.total },
    { label: 'Chờ xác nhận', value: 'PENDING', count: kpiStats.pending, badgeVariant: 'warning' as const },
    { label: 'Đã xác nhận', value: 'CONFIRMED', count: kpiStats.confirmed },
    { label: 'Đã hoàn tất', value: 'COMPLETED', count: kpiStats.completed },
    { label: 'Đã hủy', value: 'CANCELLED', count: kpiStats.cancelled },
    { label: 'Bị từ chối', value: 'DECLINED', count: kpiStats.declined },
  ], [kpiStats]);

  // Define Table Columns
  const columns: TableColumn<AdminAppointmentItem>[] = [
    {
      key: 'code_time',
      header: 'Mã & Thời gian tạo',
      width: '14%',
      render: (item) => (
        <div className="space-y-1">
          <div className="font-mono text-xs font-bold text-primary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
            <span>#{item.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="text-[11px] text-outline flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            <span>{new Date(item.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Phương tiện quan tâm',
      width: '24%',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container-high border border-surface-container-high shrink-0 relative">
            {item.listing?.primary_image_url ? (
              <img
                src={item.listing.primary_image_url}
                alt={item.listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/xe/${item.listing_id}`}
              target="_blank"
              className="font-semibold text-primary text-xs truncate leading-snug hover:text-secondary transition-colors block"
              title={item.listing?.title}
            >
              {item.listing?.title || 'Tin đăng xe'}
            </Link>
            <div className="font-mono font-bold text-secondary text-xs mt-0.5">
              {formatVND(item.listing?.price_vnd || 0)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'buyer',
      header: 'Người mua',
      width: '18%',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-primary text-xs truncate flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-blue-600">person</span>
            <span>{item.buyer?.display_name || 'Khách vãng lai'}</span>
          </div>
          {item.buyer?.phone && (
            <div className="text-[11px] text-outline font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">phone</span>
              <span>{item.buyer.phone}</span>
            </div>
          )}
          {item.buyer?.email && (
            <div className="text-[11px] text-outline truncate max-w-[160px]">
              {item.buyer.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'seller',
      header: 'Người bán / Showroom',
      width: '18%',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-primary text-xs truncate flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">storefront</span>
            <span>{item.seller?.display_name || 'Chủ xe'}</span>
          </div>
          {item.seller?.phone && (
            <div className="text-[11px] text-outline font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">phone</span>
              <span>{item.seller.phone}</span>
            </div>
          )}
          {item.seller?.email && (
            <div className="text-[11px] text-outline truncate max-w-[160px]">
              {item.seller.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Lịch hẹn & Địa điểm',
      width: '16%',
      render: (item) => {
        const d = new Date(item.scheduled_at);
        const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        return (
          <div className="space-y-1">
            <div className="font-semibold text-primary text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-secondary">calendar_today</span>
              <span>{timeStr} • {dateStr}</span>
            </div>
            <div className="text-[11px] text-outline line-clamp-1 flex items-start gap-1" title={item.location || 'Địa chỉ tin đăng'}>
              <span className="material-symbols-outlined text-[13px] shrink-0 text-red-500">pin_drop</span>
              <span className="truncate">{item.location || 'Tại địa chỉ người bán'}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '10%',
      render: (item) => (
        <div className="space-y-1">
          <AdminBadge status={item.status} size="sm" />
          {item.status === 'CANCELLED' && item.cancelled_by_name && (
            <div className="text-[10px] text-red-600 truncate max-w-[110px]" title={`Hủy bởi: ${item.cancelled_by_name}`}>
              Bởi {item.cancelled_by_name}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      <AdminHeader
        title="Quản lý Lịch hẹn Xem xe Toàn Sàn"
        subtitle="Giám sát Cuộc hẹn Trực tiếp giữa Người mua &amp; Người bán trên Toàn Bộ Hệ Thống"
        onRefresh={loadAppointments}
        isRefreshing={refreshing}
      />

      <main className="p-8 space-y-6 flex-1">
        {/* KPI Mini Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-1">
            <div className="text-outline text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Tổng lịch hẹn</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">event_note</span>
            </div>
            <div className="text-2xl font-bold text-primary font-mono">{kpiStats.total}</div>
            <div className="text-[11px] text-outline">Toàn bộ bản ghi</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs space-y-1">
            <div className="text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Chờ xác nhận</span>
              <span className="material-symbols-outlined text-[18px] text-amber-600">hourglass_top</span>
            </div>
            <div className="text-2xl font-bold text-amber-900 font-mono">{kpiStats.pending}</div>
            <div className="text-[11px] text-amber-700 font-medium">Người bán chưa duyệt</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs space-y-1">
            <div className="text-blue-800 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Đã xác nhận</span>
              <span className="material-symbols-outlined text-[18px] text-blue-600">event_available</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 font-mono">{kpiStats.confirmed}</div>
            <div className="text-[11px] text-blue-700 font-medium">Sắp diễn ra cuộc hẹn</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs space-y-1">
            <div className="text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Đã hoàn tất</span>
              <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            </div>
            <div className="text-2xl font-bold text-emerald-950 font-mono">{kpiStats.completed}</div>
            <div className="text-[11px] text-emerald-700 font-medium">Xem xe thành công</div>
          </div>

          <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 shadow-xs space-y-1">
            <div className="text-red-800 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Đã hủy / Từ chối</span>
              <span className="material-symbols-outlined text-[18px] text-red-600">event_busy</span>
            </div>
            <div className="text-2xl font-bold text-red-900 font-mono">{kpiStats.cancelled + kpiStats.declined}</div>
            <div className="text-[11px] text-red-700 font-medium">{kpiStats.cancelled} hủy, {kpiStats.declined} từ chối</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-1">
            <div className="text-outline text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Tỷ lệ hoàn thành</span>
              <span className="material-symbols-outlined text-[18px] text-emerald-600">insights</span>
            </div>
            <div className="text-2xl font-bold text-primary font-mono">{kpiStats.successRate}%</div>
            <div className="text-[11px] text-emerald-700 font-medium">Hoàn thành / Giải quyết</div>
          </div>
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <AdminTabs
            tabs={STATUS_TABS}
            activeValue={statusFilter}
            onChange={(tab) => setStatusFilter(tab as AppointmentStatus)}
          />

          <div className="w-full lg:w-80">
            <AdminSearchInput
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="Tìm theo người mua, bán, tên xe..."
            />
          </div>
        </div>

        {/* Table Data */}
        <AdminTable
          columns={columns}
          data={appointments}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage="Không tìm thấy lịch hẹn xem xe nào phù hợp với bộ lọc hiện tại"
          emptyIcon="calendar_month"
          rowActionsHeader="Thao tác"
          rowActions={(item) => (
            <div className="flex items-center justify-end gap-1">
              <AdminButton
                size="xs"
                variant="outline"
                icon="visibility"
                onClick={() => setSelectedAppointment(item)}
                title="Xem chi tiết lịch hẹn"
              >
                Chi tiết
              </AdminButton>

              {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
                <AdminButton
                  size="xs"
                  variant="danger"
                  icon="cancel"
                  onClick={() => handleAdminCancel(item)}
                  title="Quản trị viên can thiệp hủy lịch hẹn"
                >
                  Hủy lịch
                </AdminButton>
              )}
            </div>
          )}
        />
      </main>

      {/* Appointment Detail Modal */}
      <AdminAppointmentDetailModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onCancel={handleAdminCancel}
      />
    </div>
  );
}
