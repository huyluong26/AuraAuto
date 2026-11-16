'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminTable } from '@/features/admin/components/ui/AdminTable';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { AdminUserItem, TableColumn, AdminShowroomItem } from '@/features/admin/types';
import { useAdminUI } from '@/features/admin/context/AdminUIContext';
import { api } from '@/lib/api';

import { UserFormModal } from '@/features/admin/components/UserFormModal';
import { ShowroomFormModal } from '@/features/admin/components/ShowroomFormModal';

export default function AdminUsersPage() {
  const { confirm, prompt, toast } = useAdminUI();

  // Active Top Tab: 'USERS' | 'SHOWROOMS'
  const [activeTab, setActiveTab] = useState<'USERS' | 'SHOWROOMS'>('USERS');

  // Users hook
  const {
    users,
    loading: usersLoading,
    refreshing: usersRefreshing,
    searchKeyword: userSearchKeyword,
    setSearchKeyword: setUserSearchKeyword,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    loadUsers,
    handleToggleStatus,
  } = useAdminUsers({ initialStatusFilter: 'ACTIVE' });

  // Showrooms state
  const [showrooms, setShowrooms] = useState<AdminShowroomItem[]>([]);
  const [showroomsLoading, setShowroomsLoading] = useState(false);
  const [showroomSearch, setShowroomSearch] = useState('');
  const [showroomStatusFilter, setShowroomStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [showroomActionLoading, setShowroomActionLoading] = useState<string | null>(null);

  // Bulk selection states
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedShowroomIds, setSelectedShowroomIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [modalDefaultRole, setModalDefaultRole] = useState<string>('USER');

  const [showroomModalOpen, setShowroomModalOpen] = useState(false);
  const [editingShowroom, setEditingShowroom] = useState<AdminShowroomItem | null>(null);

  const loadShowrooms = useCallback(async () => {
    try {
      setShowroomsLoading(true);
      const res = await api.getShowrooms({
        search: showroomSearch || undefined,
        is_active: showroomStatusFilter === 'ALL' ? undefined : showroomStatusFilter === 'ACTIVE',
        page_size: 100,
      });
      setShowrooms(res?.items || []);
    } catch (err: any) {
      toast.error('Lỗi tải Showroom', err.message || 'Không thể tải danh sách Showroom');
    } finally {
      setShowroomsLoading(false);
    }
  }, [showroomSearch, showroomStatusFilter, toast]);

  useEffect(() => {
    if (activeTab === 'SHOWROOMS') {
      loadShowrooms();
    }
  }, [activeTab, loadShowrooms]);

  // Reset selections when filters or tabs change
  useEffect(() => {
    setSelectedUserIds([]);
  }, [statusFilter, userSearchKeyword, activeTab]);

  useEffect(() => {
    setSelectedShowroomIds([]);
  }, [showroomStatusFilter, showroomSearch, activeTab]);

  // Handlers for Showroom actions
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
      setShowroomActionLoading(sr.id);
      await api.verifyShowroom(sr.id, true);
      toast.success('Xác thực thành công', `Showroom "${sr.name}" đã được cấp tích xanh uy tín.`);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi xác thực', err.message || 'Không thể xác thực showroom');
    } finally {
      setShowroomActionLoading(null);
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
      setShowroomActionLoading(sr.id);
      await api.verifyShowroom(sr.id, false, reason.trim() || undefined);
      toast.info('Đã thu hồi xác thực', `Đã hủy tích xanh đối với "${sr.name}"`);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi thu hồi', err.message || 'Không thể thu hồi xác thực');
    } finally {
      setShowroomActionLoading(null);
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
      setShowroomActionLoading(sr.id);
      await api.updateAdminShowroom(sr.id, { is_active: newActive });
      toast.success('Thành công', `Đã ${newActive ? 'mở lại' : 'tạm khóa'} Showroom "${sr.name}".`);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi thao tác', err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setShowroomActionLoading(null);
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
      setShowroomActionLoading(sr.id);
      await api.deleteAdminShowroom(sr.id);
      toast.success('Đã xóa showroom', `Đã xóa "${sr.name}" khỏi hệ thống.`);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi xóa', err.message || 'Không thể xóa showroom');
    } finally {
      setShowroomActionLoading(null);
    }
  };

  const handleDeleteUser = async (u: AdminUserItem) => {
    const isConfirmed = await confirm({
      title: 'Vô hiệu hóa tài khoản',
      message: `Xác nhận vô hiệu hóa tài khoản "${u.display_name}" (${u.email})? Người dùng sẽ không thể đăng nhập vào hệ thống.`,
      confirmText: 'Vô hiệu hóa',
      cancelText: 'Hủy',
      variant: 'danger',
      icon: 'person_off',
    });

    if (!isConfirmed) return;

    try {
      await api.deleteAdminUser(u.id);
      toast.success('Đã vô hiệu hóa', `Tài khoản ${u.email} đã được đưa vào danh sách vô hiệu hóa.`);
      loadUsers();
    } catch (err: any) {
      toast.error('Lỗi xóa tài khoản', err.message || 'Không thể vô hiệu hóa');
    }
  };

  // ==============================================================
  // BULK ACTION HANDLERS
  // ==============================================================
  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(customerUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleBulkUpdateUserStatus = async (status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') => {
    if (selectedUserIds.length === 0) return;

    const actionText =
      status === 'ACTIVE'
        ? 'mở khóa / kích hoạt'
        : status === 'SUSPENDED'
        ? 'tạm khóa'
        : 'vô hiệu hóa';

    const isConfirmed = await confirm({
      title: `Thao tác hàng loạt: ${actionText.toUpperCase()} tài khoản`,
      message: `Bạn có chắc chắn muốn ${actionText} đồng loạt ${selectedUserIds.length} tài khoản thành viên đã chọn?`,
      confirmText: status === 'DELETED' ? 'Vô hiệu hóa tất cả' : 'Xác nhận thực hiện',
      cancelText: 'Hủy bỏ',
      variant: status === 'DELETED' || status === 'SUSPENDED' ? 'danger' : 'success',
      icon: status === 'ACTIVE' ? 'lock_open' : status === 'SUSPENDED' ? 'lock' : 'person_off',
    });

    if (!isConfirmed) return;

    try {
      setBulkActionLoading(true);
      const res = await api.bulkUpdateUserStatus(selectedUserIds, status);
      toast.success('Thành công', res.message || `Đã cập nhật trạng thái cho ${selectedUserIds.length} tài khoản`);
      setSelectedUserIds([]);
      loadUsers();
    } catch (err: any) {
      toast.error('Lỗi thao tác hàng loạt', err.message || 'Không thể cập nhật danh sách người dùng');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleToggleSelectShowroom = (id: string) => {
    setSelectedShowroomIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllShowrooms = (checked: boolean) => {
    if (checked) {
      setSelectedShowroomIds(showrooms.map((s) => s.id));
    } else {
      setSelectedShowroomIds([]);
    }
  };

  const handleBulkShowroomStatus = async (isActive: boolean) => {
    if (selectedShowroomIds.length === 0) return;
    const actionLabel = isActive ? 'mở lại hoạt động' : 'tạm dừng hoạt động';

    const isConfirmed = await confirm({
      title: `Thao tác hàng loạt: ${isActive ? 'Mở lại' : 'Tạm dừng'} Showroom`,
      message: `Xác nhận ${actionLabel} cho ${selectedShowroomIds.length} showroom đã chọn?`,
      confirmText: isActive ? 'Mở lại tất cả' : 'Tạm dừng tất cả',
      cancelText: 'Hủy bỏ',
      variant: isActive ? 'primary' : 'danger',
      icon: isActive ? 'store' : 'lock',
    });

    if (!isConfirmed) return;

    try {
      setBulkActionLoading(true);
      const res = await api.bulkUpdateShowroomStatus(selectedShowroomIds, isActive);
      toast.success('Thành công', res.message || `Đã ${actionLabel} cho ${selectedShowroomIds.length} showroom`);
      setSelectedShowroomIds([]);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi thao tác hàng loạt', err.message || 'Không thể cập nhật trạng thái showroom');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkShowroomVerify = async (isVerified: boolean) => {
    if (selectedShowroomIds.length === 0) return;
    const actionLabel = isVerified ? 'cấp tích xanh uy tín' : 'thu hồi tích xanh';

    const isConfirmed = await confirm({
      title: `Thao tác hàng loạt: ${isVerified ? 'Cấp tích xanh' : 'Thu hồi tích xanh'}`,
      message: `Xác nhận ${actionLabel} cho ${selectedShowroomIds.length} showroom đã chọn?`,
      confirmText: isVerified ? 'Cấp tích xanh tất cả' : 'Thu hồi tất cả',
      cancelText: 'Hủy bỏ',
      variant: isVerified ? 'success' : 'danger',
      icon: isVerified ? 'verified' : 'remove_moderator',
    });

    if (!isConfirmed) return;

    try {
      setBulkActionLoading(true);
      const res = await api.bulkVerifyShowrooms(selectedShowroomIds, isVerified);
      toast.success('Thành công', res.message || `Đã ${actionLabel} cho ${selectedShowroomIds.length} showroom`);
      setSelectedShowroomIds([]);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi thao tác hàng loạt', err.message || 'Không thể cập nhật xác thực showroom');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkShowroomDelete = async () => {
    if (selectedShowroomIds.length === 0) return;

    const isConfirmed = await confirm({
      title: 'CẢNH BÁO: XÓA HÀNG LOẠT SHOWROOM',
      message: `Hành động này sẽ XÓA VĨNH VIỄN ${selectedShowroomIds.length} Showroom đã chọn khỏi sàn giao dịch.\n\nBạn có chắc chắn muốn tiếp tục?`,
      confirmText: 'Xác nhận xóa tất cả',
      cancelText: 'Giữ lại',
      variant: 'danger',
      icon: 'delete_forever',
    });

    if (!isConfirmed) return;

    try {
      setBulkActionLoading(true);
      const res = await api.bulkDeleteShowrooms(selectedShowroomIds);
      toast.success('Thành công', res.message || `Đã xóa ${selectedShowroomIds.length} showroom`);
      setSelectedShowroomIds([]);
      loadShowrooms();
    } catch (err: any) {
      toast.error('Lỗi xóa hàng loạt', err.message || 'Không thể xóa danh sách showroom');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Filter users by normal members
  const customerUsers = users.filter((u) => u.role === 'USER');

  const userColumns: TableColumn<AdminUserItem>[] = [
    {
      key: 'user',
      header: 'Thành viên & Tài khoản',
      width: '32%',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-surface-container-high flex items-center justify-center font-bold text-sm text-primary uppercase shrink-0">
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
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-primary text-sm flex items-center gap-1.5 truncate">
              <span>{u.display_name}</span>
              {u.is_email_verified && (
                <span
                  className="material-symbols-outlined text-[15px] text-emerald-600"
                  title="Email đã xác thực"
                >
                  verified
                </span>
              )}
            </div>
            <div className="text-xs text-outline truncate">{u.email}</div>
            <div className="text-[10px] text-outline/80 font-mono mt-0.5">
              ID: {u.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Liên hệ & Khu vực',
      width: '24%',
      render: (u) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[14px] text-outline">call</span>
            <span>{u.phone || 'Chưa cập nhật'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-outline">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            <span>{u.province_name || u.province_code || 'Toàn quốc'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      width: '14%',
      align: 'center',
      render: (u) => <AdminBadge status={u.role} size="sm" showDot={false} />,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '14%',
      align: 'center',
      render: (u) => (
        <AdminBadge
          status={u.status || 'ACTIVE'}
          size="sm"
        />
      ),
    },
    {
      key: 'date',
      header: 'Ngày tham gia',
      width: '16%',
      render: (u) => (
        <div className="text-xs text-outline">
          <div>{new Date(u.created_at).toLocaleDateString('vi-VN')}</div>
          <div className="text-[10px] text-outline/80">
            {new Date(u.created_at).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      <AdminHeader
        title="Quản trị Thành viên & Showroom Đối Tác"
        subtitle={
          activeTab === 'USERS'
            ? `${customerUsers.length} khách hàng & thành viên trên sàn xe`
            : `${showrooms.length} đối tác Showroom kinh doanh`
        }
        onRefresh={activeTab === 'SHOWROOMS' ? loadShowrooms : loadUsers}
        isRefreshing={activeTab === 'SHOWROOMS' ? showroomsLoading : usersRefreshing}
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-container-high pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('USERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'USERS'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Khách hàng &amp; Thành viên ({customerUsers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SHOWROOMS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'SHOWROOMS'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">store</span>
              <span>Showroom đối tác ({showrooms.length})</span>
            </button>

            <Link
              href="/admin/nhan-su"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-container-low text-outline hover:text-secondary hover:bg-secondary-container/20 transition-all flex items-center gap-1.5 border border-surface-container-high cursor-pointer ml-1"
            >
              <span className="material-symbols-outlined text-[17px] text-amber-600">shield_person</span>
              <span>Nhân sự nội bộ &amp; Kiểm duyệt</span>
              <span className="text-[10px] text-outline">↗</span>
            </Link>
          </div>

          {/* Action Button for each tab */}
          <div>
            {activeTab === 'USERS' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon="person_add"
                onClick={() => {
                  setEditingUser(null);
                  setModalDefaultRole('USER');
                  setUserModalOpen(true);
                }}
              >
                Thêm Thành Viên Mới
              </AdminButton>
            )}

            {activeTab === 'SHOWROOMS' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon="add_business"
                onClick={() => {
                  setEditingShowroom(null);
                  setShowroomModalOpen(true);
                }}
              >
                Thêm Showroom Mới
              </AdminButton>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: CUSTOMERS / USERS */}
        {/* ============================================================== */}
        {activeTab === 'USERS' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary cursor-pointer font-medium"
                >
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="SUSPENDED">Đang tạm khóa (SUSPENDED)</option>
                  <option value="DELETED">Đã vô hiệu hóa (DELETED)</option>
                  <option value="">Tất cả trạng thái</option>
                </select>
              </div>

              <div className="w-full md:w-80">
                <AdminSearchInput
                  value={userSearchKeyword}
                  onChange={setUserSearchKeyword}
                  placeholder="Tìm thành viên theo tên, email, SĐT..."
                />
              </div>
            </div>

            {/* Bulk Action Toolbar for Users */}
            {selectedUserIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary-container/20 border border-secondary/30 p-3.5 rounded-2xl shadow-sm transition-all animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                    {selectedUserIds.length}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary">
                      Đã chọn {selectedUserIds.length} / {customerUsers.length} thành viên
                    </span>
                    <span className="hidden sm:inline text-xs text-outline ml-2">
                      (Chọn thao tác áp dụng đồng loạt)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <AdminButton
                    variant="secondary"
                    size="xs"
                    icon="lock_open"
                    loading={bulkActionLoading}
                    onClick={() => handleBulkUpdateUserStatus('ACTIVE')}
                  >
                    Kích hoạt
                  </AdminButton>

                  <AdminButton
                    variant="outline"
                    size="xs"
                    icon="lock"
                    loading={bulkActionLoading}
                    onClick={() => handleBulkUpdateUserStatus('SUSPENDED')}
                    className="text-amber-700 hover:bg-amber-50 border-amber-300"
                  >
                    Tạm khóa
                  </AdminButton>

                  <AdminButton
                    variant="danger"
                    size="xs"
                    icon="person_off"
                    loading={bulkActionLoading}
                    onClick={() => handleBulkUpdateUserStatus('DELETED')}
                  >
                    Vô hiệu hóa
                  </AdminButton>

                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="text-xs text-outline hover:text-primary px-2.5 py-1.5 rounded-lg border border-surface-container-high hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    <span>Bỏ chọn</span>
                  </button>
                </div>
              </div>
            )}

            <AdminTable<AdminUserItem>
              columns={userColumns}
              data={customerUsers}
              keyExtractor={(u) => u.id}
              loading={usersLoading}
              selectedIds={selectedUserIds}
              onToggleSelect={handleToggleSelectUser}
              onSelectAll={handleSelectAllUsers}
              emptyMessage="Không tìm thấy thành viên nào"
              emptyIcon="group"
              rowActions={(u) => {
                const currentStatus = u.status || 'ACTIVE';
                return (
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(u);
                        setUserModalOpen(true);
                      }}
                      title="Chỉnh sửa tài khoản"
                      className="p-1.5 rounded-lg border border-surface-container-high text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">edit</span>
                    </button>

                    {/* Toggle Lock / Suspend */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u, currentStatus)}
                      title={currentStatus === 'ACTIVE' ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        currentStatus === 'ACTIVE'
                          ? 'text-outline hover:text-amber-600 hover:bg-amber-50 border-surface-container-high'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {currentStatus === 'ACTIVE' ? 'lock' : 'lock_open'}
                      </span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      title="Vô hiệu hóa tài khoản"
                      className="p-1.5 rounded-lg border border-surface-container-high text-outline hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                );
              }}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: SHOWROOMS */}
        {/* ============================================================== */}
        {activeTab === 'SHOWROOMS' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={showroomStatusFilter}
                  onChange={(e) => setShowroomStatusFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary cursor-pointer font-medium"
                >
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="INACTIVE">Đang tạm khóa (INACTIVE)</option>
                  <option value="ALL">Tất cả trạng thái Showroom</option>
                </select>

                {showrooms.length > 0 && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high transition-all">
                    <input
                      type="checkbox"
                      checked={showrooms.length > 0 && selectedShowroomIds.length === showrooms.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedShowroomIds.length > 0 &&
                            selectedShowroomIds.length < showrooms.length;
                        }
                      }}
                      onChange={(e) => handleSelectAllShowrooms(e.target.checked)}
                      className="w-4 h-4 rounded border-outline/50 text-secondary accent-secondary cursor-pointer"
                    />
                    <span>Chọn tất cả ({showrooms.length})</span>
                  </label>
                )}
              </div>

              <div className="w-full md:w-80">
                <AdminSearchInput
                  value={showroomSearch}
                  onChange={setShowroomSearch}
                  placeholder="Tìm showroom theo tên, địa chỉ..."
                />
              </div>
            </div>

            {/* Bulk Action Toolbar for Showrooms */}
            {selectedShowroomIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary-container/20 border border-secondary/30 p-3.5 rounded-2xl shadow-sm transition-all animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                    {selectedShowroomIds.length}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary">
                      Đã chọn {selectedShowroomIds.length} / {showrooms.length} showroom
                    </span>
                    <span className="hidden sm:inline text-xs text-outline ml-2">
                      (Chọn thao tác áp dụng đồng loạt)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <AdminButton
                    variant="primary"
                    size="xs"
                    icon="verified"
                    loading={bulkActionLoading}
                    onClick={() => handleBulkShowroomVerify(true)}
                  >
                    Cấp tích xanh
                  </AdminButton>

                  <AdminButton
                    variant="outline"
                    size="xs"
                    icon="remove_moderator"
                    loading={bulkActionLoading}
                    onClick={() => handleBulkShowroomVerify(false)}
                    className="text-amber-700 hover:bg-amber-50 border-amber-300"
                  >
                    Hủy tích xanh
                  </AdminButton>

                  <AdminButton
                    variant="secondary"
                    size="xs"
                    icon="store"
                    loading={bulkActionLoading}
                    onClick={() => handleBulkShowroomStatus(true)}
                  >
                    Mở lại hoạt động
                  </AdminButton>

                  <AdminButton
                    variant="outline"
                    size="xs"
                    icon="lock"
                    loading={bulkActionLoading}
                    onClick={() => handleBulkShowroomStatus(false)}
                    className="text-amber-700 hover:bg-amber-50 border-amber-300"
                  >
                    Tạm khóa
                  </AdminButton>

                  <AdminButton
                    variant="danger"
                    size="xs"
                    icon="delete"
                    loading={bulkActionLoading}
                    onClick={handleBulkShowroomDelete}
                  >
                    Xóa Showroom
                  </AdminButton>

                  <button
                    type="button"
                    onClick={() => setSelectedShowroomIds([])}
                    className="text-xs text-outline hover:text-primary px-2.5 py-1.5 rounded-lg border border-surface-container-high hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    <span>Bỏ chọn</span>
                  </button>
                </div>
              </div>
            )}

            {showroomsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                <p className="font-body-sm text-xs text-outline">Đang tải danh sách showroom...</p>
              </div>
            ) : showrooms.length === 0 ? (
              <div className="p-16 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low text-outline mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">store</span>
                </div>
                <h4 className="font-headline-sm text-base text-primary font-bold">Chưa có Showroom nào</h4>
                <p className="font-body-sm text-xs text-outline max-w-sm mx-auto">
                  Hãy bấm &ldquo;Thêm Showroom Mới&rdquo; hoặc điều chỉnh bộ lọc để xem các đại lý đối tác.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showrooms.map((sr) => {
                  const isSelected = selectedShowroomIds.includes(sr.id);
                  return (
                    <div
                      key={sr.id}
                      onClick={() => handleToggleSelectShowroom(sr.id)}
                      className={`p-5 rounded-2xl bg-surface-container-lowest border transition-all shadow-xs space-y-4 cursor-pointer select-none relative ${
                        isSelected
                          ? 'border-secondary ring-2 ring-secondary/30 bg-secondary-container/10'
                          : sr.is_verified
                          ? 'border-emerald-200 ring-1 ring-emerald-100'
                          : 'border-surface-container-high'
                      } ${!sr.is_active ? 'opacity-70 bg-surface-container-low/50' : ''}`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Checkbox */}
                        <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectShowroom(sr.id)}
                            className="w-4 h-4 rounded border-outline/50 text-secondary accent-secondary cursor-pointer focus:ring-secondary/30"
                          />
                        </div>

                        {/* Logo */}
                        <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-surface-container-high overflow-hidden flex items-center justify-center shrink-0">
                          {sr.logo_url ? (
                            <img src={sr.logo_url} alt={sr.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[28px] text-secondary">store</span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-headline-sm text-base text-primary font-bold truncate">
                              {sr.name}
                            </h3>
                            {sr.is_verified ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 shrink-0">
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                <span>Tích xanh</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-medium shrink-0">
                                Chờ xác minh
                              </span>
                            )}

                            {!sr.is_active && (
                              <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[11px] font-bold shrink-0">
                                Đang tạm khóa
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-outline mt-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-primary">
                              <span className="material-symbols-outlined text-[14px] text-outline">call</span>
                              <span>Hotline: {sr.phone || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-outline">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>
                              <span className="truncate">{sr.address || sr.province_code || 'Toàn quốc'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {sr.description && (
                        <p className="font-body-sm text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl border border-surface-container-high line-clamp-2">
                          {sr.description}
                        </p>
                      )}

                      {/* Footer Actions */}
                      <div
                        className="flex items-center justify-between pt-2 border-t border-surface-container-high text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[11px] text-outline">
                          Gia nhập: {new Date(sr.created_at).toLocaleDateString('vi-VN')}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Edit Showroom */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingShowroom(sr);
                              setShowroomModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-surface-container-high text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                            title="Sửa thông tin showroom"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>

                          {/* Toggle Active / Lock Showroom */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleShowroomActive(sr);
                            }}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              sr.is_active
                                ? 'text-outline hover:text-amber-600 hover:bg-amber-50 border-surface-container-high'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={sr.is_active ? 'Tạm dừng hoạt động showroom' : 'Kích hoạt lại showroom'}
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              {sr.is_active ? 'lock' : 'lock_open'}
                            </span>
                          </button>

                          {/* Verify / Revoke Badge */}
                          {sr.is_verified ? (
                            <AdminButton
                              variant="outline"
                              size="xs"
                              icon="remove_moderator"
                              loading={showroomActionLoading === sr.id}
                              onClick={() => handleRevokeShowroom(sr)}
                              className="text-amber-700 hover:bg-amber-50 border-amber-300"
                            >
                              Hủy tích xanh
                            </AdminButton>
                          ) : (
                            <AdminButton
                              variant="primary"
                              size="xs"
                              icon="verified"
                              loading={showroomActionLoading === sr.id}
                              onClick={() => handleVerifyShowroom(sr)}
                            >
                              Cấp tích xanh
                            </AdminButton>
                          )}

                          {/* Delete Showroom */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShowroom(sr);
                            }}
                            className="p-1.5 rounded-lg border border-surface-container-high text-outline hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa showroom"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* User / Staff Form Modal */}
      {userModalOpen && (
        <UserFormModal
          user={editingUser}
          defaultRole={modalDefaultRole}
          onClose={() => {
            setUserModalOpen(false);
            setEditingUser(null);
          }}
          onSuccess={(msg) => {
            toast.success('Thành công', msg);
            loadUsers();
          }}
        />
      )}

      {/* Showroom Form Modal */}
      {showroomModalOpen && (
        <ShowroomFormModal
          showroom={editingShowroom}
          onClose={() => {
            setShowroomModalOpen(false);
            setEditingShowroom(null);
          }}
          onSuccess={(msg) => {
            toast.success('Thành công', msg);
            loadShowrooms();
          }}
        />
      )}
    </div>
  );
}
