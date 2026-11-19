'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAdminUI } from '../context/AdminUIContext';
import { AdminAppointmentItem, AppointmentStatus } from '../types';

export function useAdminAppointments(initialStatus: AppointmentStatus = 'ALL') {
  const { prompt, toast } = useAdminUI();

  const [appointments, setAppointments] = useState<AdminAppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus>(initialStatus);
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
      const sorted = (data || []).slice().sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || a.scheduled_at).getTime();
        const timeB = new Date(b.created_at || b.scheduled_at).getTime();
        return timeB - timeA;
      });
      setAppointments(sorted);
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
  const handleAdminCancel = useCallback(
    async (appt: AdminAppointmentItem) => {
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
          toast.success(
            'Hủy lịch hẹn thành công',
            `Đã hủy lịch hẹn #${appt.id.slice(0, 8)} và gửi thông báo tới 2 bên.`
          );
          loadAppointments();
          setSelectedAppointment((curr) => (curr && curr.id === appt.id ? null : curr));
        } catch (err: any) {
          toast.error('Không thể hủy lịch hẹn', err.message || 'Đã có lỗi xảy ra');
        }
      }
    },
    [prompt, toast, loadAppointments]
  );

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

  return {
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
  };
}

