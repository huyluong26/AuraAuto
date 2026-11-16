'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api, formatVND } from '@/lib/api';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminTable } from '@/features/admin/components/ui/AdminTable';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminTabs } from '@/features/admin/components/ui/AdminTabs';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { useAdminUI } from '@/features/admin/context/AdminUIContext';
import { AdminAppointmentItem, AppointmentStatus, TableColumn } from '@/features/admin/types';

export default function AdminAppointmentsPage() {
  const { prompt, toast } = useAdminUI();

  const [appointments, setAppointments] = useState<AdminAppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<AdminAppointmentItem | null>(null);

  // Load appointments from backend API
  const loadAppointments = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await api.getAdminAppointments({
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchKeyword.trim() || undefined,
      });
      setAppointments(data || []);
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu', err.message || 'Không thể tải danh sách lịch hẹn xem xe');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchKeyword, toast]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Handle Admin cancellation
  const handleAdminCancel = async (appt: AdminAppointmentItem) => {
    const reason = await prompt({
      title: 'Quản trị viên Can thiệp Hủy Lịch hẹn',
      message: `Bạn đang thực hiện hủy lịch hẹn mã #${appt.id.slice(0, 8)} giữa "${appt.buyer.display_name}" và "${appt.seller.display_name}". Vui lòng nhập lý do can thiệp:`,
      placeholder: 'Nhập lý do hủy lịch hẹn...',
      suggestions: [
        'Khách hàng phản ánh sai lệch địa điểm hoặc thông tin xe',
        'Phát hiện dấu hiệu gian lận hoặc spam lịch hẹn',
        'Yêu cầu hỗ trợ can thiệp từ người mua hoặc người bán',
        'Phương tiện đã được bán hoặc giao dịch ngoài sàn',
      ],
      confirmText: 'Xác nhận hủy lịch',
      cancelText: 'Đóng',
      variant: 'danger',
      icon: 'event_busy',
    });

    if (reason && reason.trim()) {
      try {
        await api.adminCancelAppointment(appt.id, reason.trim());
        toast.success('Hủy lịch hẹn thành công', `Đã hủy lịch hẹn #${appt.id.slice(0, 8)} và gửi thông báo tới 2 bên.`);
        loadAppointments();
        if (selectedAppointment && selectedAppointment.id === appt.id) {
          setSelectedAppointment(null);
        }
      } catch (err: any) {
        toast.error('Không thể hủy lịch hẹn', err.message || 'Đã có lỗi xảy ra');
      }
    }
  };

  // Status Tabs
  const STATUS_TABS = useMemo(() => [
    { label: 'Tất cả cuộc hẹn', value: 'ALL', count: appointments.length },
    { label: 'Chờ xác nhận', value: 'PENDING', count: appointments.filter((a) => a.status === 'PENDING').length },
    { label: 'Đã xác nhận', value: 'CONFIRMED', count: appointments.filter((a) => a.status === 'CONFIRMED').length },
    { label: 'Đã hoàn tất', value: 'COMPLETED', count: appointments.filter((a) => a.status === 'COMPLETED').length },
    { label: 'Đã hủy', value: 'CANCELLED', count: appointments.filter((a) => a.status === 'CANCELLED').length },
    { label: 'Bị từ chối', value: 'DECLINED', count: appointments.filter((a) => a.status === 'DECLINED').length },
  ], [appointments]);

  // Compute live KPI summaries
  const kpiStats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => a.status === 'PENDING').length;
    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;
    const declined = appointments.filter((a) => a.status === 'DECLINED').length;
    const resolved = completed + cancelled + declined;
    const successRate = resolved > 0 ? Math.round((completed / resolved) * 100) : 0;

    return { total, pending, confirmed, completed, cancelled, declined, successRate };
  }, [appointments]);

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
            <div className="flex items-center justify-end gap-1.5">
              <AdminButton
                size="sm"
                variant="ghost"
                icon="visibility"
                onClick={() => setSelectedAppointment(item)}
                title="Xem chi tiết lịch hẹn"
              >
                Chi tiết
              </AdminButton>

              {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
                <AdminButton
                  size="sm"
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
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-3xl border border-surface-container-high shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-primary flex items-center gap-2">
                    <span>Chi tiết Lịch hẹn Xem xe</span>
                    <span className="font-mono text-secondary text-xs">#{selectedAppointment.id.slice(0, 8).toUpperCase()}</span>
                  </h3>
                  <p className="font-body-sm text-xs text-outline">
                    Khởi tạo lúc: {new Date(selectedAppointment.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AdminBadge status={selectedAppointment.status} />
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Vehicle Card */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container-highest shrink-0 relative">
                  {selectedAppointment.listing?.primary_image_url ? (
                    <img
                      src={selectedAppointment.listing.primary_image_url}
                      alt={selectedAppointment.listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-[24px]">directions_car</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-[11px] font-semibold text-outline uppercase tracking-wider">Phương tiện giao dịch</div>
                  <h4 className="font-bold text-primary text-sm truncate">{selectedAppointment.listing?.title}</h4>
                  <div className="font-mono font-bold text-secondary text-base">
                    {formatVND(selectedAppointment.listing?.price_vnd || 0)}
                  </div>
                </div>
                <Link
                  href={`/xe/${selectedAppointment.listing_id}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl border border-secondary text-secondary text-xs font-semibold hover:bg-secondary hover:text-on-secondary transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Mở tin</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </Link>
              </div>

              {/* Two Parties: Buyer & Seller */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buyer */}
                <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>Bên mua (Khách hàng)</span>
                  </div>
                  <div className="font-bold text-primary text-sm">{selectedAppointment.buyer?.display_name}</div>
                  <div className="text-xs text-outline space-y-0.5">
                    {selectedAppointment.buyer?.phone && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">phone</span>
                        <a href={`tel:${selectedAppointment.buyer.phone}`} className="text-primary hover:underline font-mono">
                          {selectedAppointment.buyer.phone}
                        </a>
                      </div>
                    )}
                    {selectedAppointment.buyer?.email && (
                      <div className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[13px]">email</span>
                        <span>{selectedAppointment.buyer.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seller */}
                <div className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">storefront</span>
                    <span>Bên bán (Chủ xe / Showroom)</span>
                  </div>
                  <div className="font-bold text-primary text-sm">{selectedAppointment.seller?.display_name}</div>
                  <div className="text-xs text-outline space-y-0.5">
                    {selectedAppointment.seller?.phone && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">phone</span>
                        <a href={`tel:${selectedAppointment.seller.phone}`} className="text-primary hover:underline font-mono">
                          {selectedAppointment.seller.phone}
                        </a>
                      </div>
                    )}
                    {selectedAppointment.seller?.email && (
                      <div className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[13px]">email</span>
                        <span>{selectedAppointment.seller.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule and Location info */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-outline">
                  <span className="material-symbols-outlined text-[16px] text-secondary">pin_drop</span>
                  <span>Thời gian &amp; Địa điểm gặp mặt</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-outline block text-[11px]">Thời gian hẹn:</span>
                    <span className="font-semibold text-primary text-sm">
                      {new Date(selectedAppointment.scheduled_at).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px]">Địa điểm xem xe:</span>
                    <span className="font-medium text-primary">
                      {selectedAppointment.location || 'Tại địa chỉ theo tin đăng'}
                    </span>
                  </div>
                </div>

                {selectedAppointment.note && (
                  <div className="pt-2 border-t border-surface-container-high/60 text-xs">
                    <span className="text-outline block text-[11px]">Ghi chú của người mua:</span>
                    <p className="text-primary mt-0.5 italic bg-surface-container/40 p-2.5 rounded-xl border border-surface-container-high">
                      &quot;{selectedAppointment.note}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Cancellation Reason if cancelled */}
              {selectedAppointment.status === 'CANCELLED' && (
                <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 text-xs space-y-1.5">
                  <div className="font-bold text-red-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <span className="material-symbols-outlined text-[16px] text-red-600">cancel</span>
                    <span>Thông tin Hủy lịch hẹn</span>
                  </div>
                  <div className="text-red-800">
                    <span className="font-semibold">Mã lý do:</span> {selectedAppointment.cancel_reason_code || 'OTHER'}
                  </div>
                  {selectedAppointment.cancel_reason_text && (
                    <div className="text-red-900">
                      <span className="font-semibold">Lý do chi tiết:</span> {selectedAppointment.cancel_reason_text}
                    </div>
                  )}
                  {selectedAppointment.cancelled_by_name && (
                    <div className="text-red-700 text-[11px]">
                      Thực hiện bởi: <span className="font-bold">{selectedAppointment.cancelled_by_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Event Timeline */}
              {selectedAppointment.events && selectedAppointment.events.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-headline-sm text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">history</span>
                    <span>Nhật ký Sự kiện &amp; Trạng thái Lịch hẹn</span>
                  </h4>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
                    {selectedAppointment.events.map((ev, idx) => (
                      <div key={ev.id || idx} className="relative flex items-start gap-3">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-secondary border-2 border-surface-container-lowest"></div>
                        <div className="flex-1 bg-surface-container-low p-3 rounded-xl border border-surface-container-high text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary font-mono text-[11px]">
                              {ev.from_status ? `${ev.from_status} → ` : ''}{ev.to_status}
                            </span>
                            <span className="text-[10px] text-outline font-mono">
                              {ev.created_at ? new Date(ev.created_at).toLocaleString('vi-VN') : ''}
                            </span>
                          </div>
                          {ev.note && <p className="text-outline text-xs mt-0.5">{ev.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex items-center justify-between">
              <div>
                {(selectedAppointment.status === 'PENDING' || selectedAppointment.status === 'CONFIRMED') && (
                  <AdminButton
                    variant="danger"
                    size="sm"
                    icon="cancel"
                    onClick={() => handleAdminCancel(selectedAppointment)}
                  >
                    Can thiệp Hủy lịch
                  </AdminButton>
                )}
              </div>

              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedAppointment(null)}
              >
                Đóng cửa sổ
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
