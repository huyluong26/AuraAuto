'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { AdminListingItem } from '../types';
import { useAdminUI } from '../context/AdminUIContext';

export function useAdminListings(initialStatus: string = 'ALL') {
  const { confirm, prompt, toast } = useAdminUI();

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [listings, setListings] = useState<AdminListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadListings = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await api.getAdminListings({
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchKeyword.trim() || undefined,
      });
      setListings(data);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu', err.message || 'Không thể tải danh sách bài đăng xe');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchKeyword, toast]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(listings.map((l) => l.id));
      } else {
        setSelectedIds([]);
      }
    },
    [listings]
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleQuickApprove = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      const isConfirmed = await confirm({
        title: 'Phê duyệt xuất bản bài đăng',
        message: `Xác nhận phê duyệt bài đăng xe "${title}" để đưa lên sàn giao dịch AuraAuto?`,
        confirmText: 'Phê duyệt ngay',
        cancelText: 'Hủy bỏ',
        variant: 'success',
        icon: 'verified',
      });

      if (!isConfirmed) return false;

      try {
        await api.approveListing(id);
        toast.success('Phê duyệt thành công', `Đã xuất bản tin "${title}" lên sàn công khai.`);
        loadListings();
        return true;
      } catch (err: any) {
        toast.error('Không thể phê duyệt', err.message || 'Lỗi xử lý duyệt tin');
        return false;
      }
    },
    [confirm, toast, loadListings]
  );

  const handleQuickReject = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      const reason = await prompt({
        title: 'Từ chối duyệt bài đăng',
        message: `Nhập lý do từ chối bài đăng "${title}". Lý do này sẽ gửi phản hồi đến người bán:`,
        placeholder: 'Ví dụ: Hình ảnh mờ, thông số kỹ thuật chưa chính xác...',
        defaultValue: 'Hình ảnh mờ hoặc thông số kỹ thuật chưa chính xác',
        suggestions: [
          'Hình ảnh mờ, không rõ biển số hoặc không đủ góc chụp theo tiêu chuẩn.',
          'Giá bán không hợp lý so với thị trường hiện tại.',
          'Thông số kỹ thuật không khớp với dòng xe đăng bán.',
          'Trùng lặp tin đăng đã có trên hệ thống.',
        ],
        confirmText: 'Xác nhận từ chối',
        variant: 'danger',
      });

      if (!reason || !reason.trim()) return false;

      try {
        await api.rejectListing(id, reason.trim());
        toast.info('Đã từ chối bài đăng', `Tin "${title}" đã được chuyển sang trạng thái Bị từ chối.`);
        loadListings();
        return true;
      } catch (err: any) {
        toast.error('Lỗi từ chối bài đăng', err.message || 'Không thể từ chối');
        return false;
      }
    },
    [prompt, toast, loadListings]
  );

  const handleQuickTakedown = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      const reason = await prompt({
        title: 'Gỡ tin đăng khỏi sàn giao dịch',
        message: `Nhập lý do gỡ bài đăng "${title}" khỏi sàn giao dịch:`,
        placeholder: 'Lý do gỡ tin...',
        defaultValue: 'Người bán yêu cầu gỡ bài hoặc thông tin xe đã thay đổi',
        suggestions: [
          'Người bán đã bán xe qua kênh khác.',
          'Người bán yêu cầu tạm dừng niêm yết xe.',
          'Phát hiện thông tin sai lệch sau khi duyệt.',
        ],
        confirmText: 'Xác nhận gỡ tin',
        variant: 'warning',
      });

      if (!reason || !reason.trim()) return false;

      try {
        await api.takedownListing(id, reason.trim());
        toast.info('Đã gỡ bài đăng', `Bài đăng "${title}" đã được ẩn khỏi sàn giao dịch.`);
        loadListings();
        return true;
      } catch (err: any) {
        toast.error('Lỗi gỡ bài đăng', err.message || 'Không thể gỡ tin');
        return false;
      }
    },
    [prompt, toast, loadListings]
  );

  const handleDeleteListing = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      const isConfirmed = await confirm({
        title: 'CẢNH BÁO BẢO MẬT: XÓA VĨNH VIỄN TIN ĐĂNG',
        message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN bài đăng "${title}"?\nHành động này sẽ xóa hoàn toàn bản ghi khỏi cơ sở dữ liệu và không thể hoàn tác!`,
        confirmText: 'Xóa vĩnh viễn',
        cancelText: 'Giữ lại',
        variant: 'danger',
        icon: 'delete_forever',
      });

      if (!isConfirmed) return false;

      try {
        await api.deleteListing(id);
        toast.success('Đã xóa vĩnh viễn', `Bài đăng "${title}" đã được xóa khỏi hệ thống.`);
        loadListings();
        return true;
      } catch (err: any) {
        toast.error('Lỗi xóa bài đăng', err.message || 'Không thể xóa');
        return false;
      }
    },
    [confirm, toast, loadListings]
  );

  const handleBulkApprove = useCallback(async (): Promise<boolean> => {
    if (selectedIds.length === 0) return false;

    const isConfirmed = await confirm({
      title: 'Phê duyệt hàng loạt',
      message: `Xác nhận PHÊ DUYỆT HÀNG LOẠT cho ${selectedIds.length} bài đăng đã chọn?`,
      confirmText: `Duyệt ${selectedIds.length} bài`,
      cancelText: 'Hủy bỏ',
      variant: 'success',
      icon: 'done_all',
    });

    if (!isConfirmed) return false;

    try {
      let successCount = 0;
      for (const id of selectedIds) {
        try {
          await api.approveListing(id);
          successCount++;
        } catch {
          // continue
        }
      }
      toast.success('Thao tác hàng loạt hoàn tất', `Đã duyệt thành công ${successCount}/${selectedIds.length} bài đăng.`);
      loadListings();
      return true;
    } catch (err: any) {
      toast.error('Lỗi thao tác hàng loạt', err.message || 'Có lỗi xảy ra');
      return false;
    }
  }, [selectedIds, confirm, toast, loadListings]);

  const handleBulkDelete = useCallback(async (): Promise<boolean> => {
    if (selectedIds.length === 0) return false;

    const isConfirmed = await confirm({
      title: 'CẢNH BÁO: XÓA HÀNG LOẠT BÀI ĐĂNG',
      message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedIds.length} bài đăng đã chọn?\nToàn bộ dữ liệu liên quan sẽ bị xóa sạch khỏi hệ thống!`,
      confirmText: `Xác nhận xóa ${selectedIds.length} bài`,
      cancelText: 'Giữ lại',
      variant: 'danger',
      icon: 'delete_sweep',
    });

    if (!isConfirmed) return false;

    try {
      let successCount = 0;
      for (const id of selectedIds) {
        try {
          await api.deleteListing(id);
          successCount++;
        } catch {
          // continue
        }
      }
      toast.success('Xóa hàng loạt hoàn tất', `Đã xóa vĩnh viễn ${successCount} bài đăng khỏi hệ thống.`);
      loadListings();
      return true;
    } catch (err: any) {
      toast.error('Lỗi thao tác xóa hàng loạt', err.message || 'Có lỗi xảy ra');
      return false;
    }
  }, [selectedIds, confirm, toast, loadListings]);

  const handleSaveEdit = useCallback(
    async (
      id: string,
      payload: {
        title: string;
        price_vnd: number;
        odometer_km?: number | null;
        status: string;
        description?: string;
      }
    ): Promise<boolean> => {
      try {
        await api.updateAdminListing(id, payload);
        toast.success('Đã lưu chỉnh sửa', 'Thông tin tin đăng đã được cập nhật thành công.');
        loadListings();
        return true;
      } catch (err: any) {
        toast.error('Lỗi lưu chỉnh sửa', err.message || 'Không thể lưu chỉnh sửa');
        return false;
      }
    },
    [toast, loadListings]
  );

  return {
    listings,
    loading,
    refreshing,
    statusFilter,
    setStatusFilter,
    searchKeyword,
    setSearchKeyword,
    selectedIds,
    setSelectedIds,
    loadListings,
    handleSelectAll,
    handleToggleSelect,
    handleQuickApprove,
    handleQuickReject,
    handleQuickTakedown,
    handleDeleteListing,
    handleBulkApprove,
    handleBulkDelete,
    handleSaveEdit,
  };
}
