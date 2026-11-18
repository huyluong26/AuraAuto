'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { AdminShowroomItem } from '../types';
import { useAdminUI } from '../context/AdminUIContext';

export function useAdminShowrooms() {
  const { confirm, prompt, toast } = useAdminUI();

  const [showrooms, setShowrooms] = useState<AdminShowroomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadShowrooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getShowrooms({
        search: search || undefined,
        is_active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        page_size: 100,
      });
      setShowrooms(res?.items || []);
    } catch (err: any) {
      toast.error('Lỗi tải Showroom', err.message || 'Không thể tải danh sách Showroom');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    loadShowrooms();
  }, [loadShowrooms]);

  // Reset selections when filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [statusFilter, search]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(showrooms.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleVerifyShowroom = async (sr: AdminShowroomItem) => {
    const isConfirmed = await confirm({
      title: 'Cấp Tích Xanh Uy Tín Showroom',
      message: `Xác nhận phê duyệt và gắn nhãn "Đại lý uy tín / Đã xác thực" cho "${sr.name}"?\n\nShowroom này sẽ được ưu tiên hiển thị và tăng độ tin cậy với người mua.`,
      confirmText: 'Cấp Tích Xanh',
      cancelText: 'Hủy bỏ',
      variant: 'success',
      icon: 'verified',
    });

    if (!isConfirmed) return;

    try {
      setActionLoadingId(sr.id);
      await api.verifyShowroom(sr.id, true);
      toast.success('Xác thực thành công', `Showroom "${sr.name}" đã được cấp tích xanh uy tín.`);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi xác thực', err.message || 'Không thể xác thực showroom');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeShowroom = async (sr: AdminShowroomItem) => {
    const reason = await prompt({
      title: 'Thu hồi tích xanh Showroom',
      message: `Nhập lý do thu hồi xác thực của "${sr.name}":`,
      placeholder: 'Ví dụ: Hết hạn giấy phép kinh doanh, phản hồi khiếu nại khách hàng tiêu cực...',
      confirmText: 'Thu hồi xác thực',
      cancelText: 'Giữ lại',
      variant: 'danger',
      icon: 'remove_moderator',
    });

    if (reason === null) return;

    try {
      setActionLoadingId(sr.id);
      await api.verifyShowroom(sr.id, false, reason.trim() || undefined);
      toast.info('Đã thu hồi xác thực', `Đã hủy tích xanh đối với "${sr.name}"`);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi thu hồi', err.message || 'Không thể thu hồi xác thực');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleShowroomActive = async (sr: AdminShowroomItem) => {
    const newActive = !sr.is_active;
    const isConfirmed = await confirm({
      title: newActive ? 'Mở lại hoạt động Showroom' : 'Tạm khóa hoạt động Showroom',
      message: newActive
        ? `Xác nhận mở lại hoạt động cho Showroom "${sr.name}"? Tin đăng của showroom sẽ hiển thị lại bình thường.`
        : `Xác nhận tạm dừng hoạt động đối với Showroom "${sr.name}"?`,
      confirmText: newActive ? 'Mở lại' : 'Tạm dừng',
      cancelText: 'Hủy',
      variant: newActive ? 'primary' : 'danger',
      icon: newActive ? 'store' : 'lock',
    });

    if (!isConfirmed) return;

    try {
      setActionLoadingId(sr.id);
      await api.updateAdminShowroom(sr.id, { is_active: newActive });
      toast.success('Thành công', `Đã ${newActive ? 'mở lại' : 'tạm khóa'} Showroom "${sr.name}".`);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi thao tác', err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteShowroom = async (sr: AdminShowroomItem) => {
    const isConfirmed = await confirm({
      title: 'CẢNH BÁO: XÓA SHOWROOM',
      message: `Hành động này sẽ XÓA Showroom "${sr.name}" khỏi sàn giao dịch.\n\nBạn có chắc chắn muốn tiếp tục?`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Giữ lại',
      variant: 'danger',
      icon: 'delete_forever',
    });

    if (!isConfirmed) return;

    try {
      setActionLoadingId(sr.id);
      await api.deleteAdminShowroom(sr.id);
      toast.success('Đã xóa showroom', `Đã xóa "${sr.name}" khỏi hệ thống.`);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi xóa', err.message || 'Không thể xóa showroom');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkShowroomStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    const actionLabel = isActive ? 'mở lại hoạt động' : 'tạm dừng hoạt động';

    const isConfirmed = await confirm({
      title: `Thao tác hàng loạt: ${isActive ? 'Mở lại' : 'Tạm dừng'} Showroom`,
      message: `Xác nhận ${actionLabel} cho ${selectedIds.length} showroom đã chọn?`,
      confirmText: isActive ? 'Mở lại tất cả' : 'Tạm dừng tất cả',
      cancelText: 'Hủy bỏ',
      variant: isActive ? 'primary' : 'danger',
      icon: isActive ? 'store' : 'lock',
    });

    if (!isConfirmed) return;

    try {
      setBulkLoading(true);
      const res = await api.bulkUpdateShowroomStatus(selectedIds, isActive);
      toast.success('Thành công', res.message || `Đã ${actionLabel} cho ${selectedIds.length} showroom`);
      setSelectedIds([]);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi thao tác hàng loạt', err.message || 'Không thể cập nhật trạng thái showroom');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkShowroomVerify = async (isVerified: boolean) => {
    if (selectedIds.length === 0) return;
    const actionLabel = isVerified ? 'cấp tích xanh uy tín' : 'thu hồi tích xanh';

    const isConfirmed = await confirm({
      title: `Thao tác hàng loạt: ${isVerified ? 'Cấp tích xanh' : 'Thu hồi tích xanh'}`,
      message: `Xác nhận ${actionLabel} cho ${selectedIds.length} showroom đã chọn?`,
      confirmText: isVerified ? 'Cấp tích xanh tất cả' : 'Thu hồi tất cả',
      cancelText: 'Hủy bỏ',
      variant: isVerified ? 'success' : 'danger',
      icon: isVerified ? 'verified' : 'remove_moderator',
    });

    if (!isConfirmed) return;

    try {
      setBulkLoading(true);
      const res = await api.bulkVerifyShowrooms(selectedIds, isVerified);
      toast.success('Thành công', res.message || `Đã ${actionLabel} cho ${selectedIds.length} showroom`);
      setSelectedIds([]);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi thao tác hàng loạt', err.message || 'Không thể cập nhật xác thực showroom');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkShowroomDelete = async () => {
    if (selectedIds.length === 0) return;

    const isConfirmed = await confirm({
      title: 'CẢNH BÁO: XÓA HÀNG LOẠT SHOWROOM',
      message: `Hành động này sẽ XÓA VĨNH VIỄN ${selectedIds.length} Showroom đã chọn khỏi sàn giao dịch.\n\nBạn có chắc chắn muốn tiếp tục?`,
      confirmText: 'Xác nhận xóa tất cả',
      cancelText: 'Giữ lại',
      variant: 'danger',
      icon: 'delete_forever',
    });

    if (!isConfirmed) return;

    try {
      setBulkLoading(true);
      const res = await api.bulkDeleteShowrooms(selectedIds);
      toast.success('Thành công', res.message || `Đã xóa ${selectedIds.length} showroom`);
      setSelectedIds([]);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi xóa hàng loạt', err.message || 'Không thể xóa danh sách showroom');
    } finally {
      setBulkLoading(false);
    }
  };

  return {
    showrooms,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    actionLoadingId,
    selectedIds,
    setSelectedIds,
    bulkLoading,
    loadShowrooms,
    handleToggleSelect,
    handleSelectAll,
    handleVerifyShowroom,
    handleRevokeShowroom,
    handleToggleShowroomActive,
    handleDeleteShowroom,
    handleBulkShowroomStatus,
    handleBulkShowroomVerify,
    handleBulkShowroomDelete,
  };
}
