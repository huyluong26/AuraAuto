'use client';

import React, { useState } from 'react';
import { AdminTable } from '@/features/admin/components/ui/AdminTable';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { AdminUserItem, TableColumn } from '@/features/admin/types';
import { useAdminUI } from '@/features/admin/context/AdminUIContext';
import { api } from '@/lib/api';
import { UserFormModal } from '@/features/admin/components/UserFormModal';

interface UsersManagementTabProps {
  users: AdminUserItem[];
  loading: boolean;
  searchKeyword: string;
  setSearchKeyword: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  loadUsers: () => void;
  handleToggleStatus: (u: AdminUserItem, status: string) => Promise<boolean>;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export const UsersManagementTab: React.FC<UsersManagementTabProps> = ({
  users,
  loading,
  searchKeyword,
  setSearchKeyword,
  statusFilter,
  setStatusFilter,
  loadUsers,
  handleToggleStatus,
  modalOpen,
  setModalOpen,
}) => {
  const { confirm, toast } = useAdminUI();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);

  // Filter users by normal members
  const customerUsers = users.filter((u) => u.role === 'USER');

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

  const userColumns: TableColumn<AdminUserItem>[] = [
    {
      key: 'user',
      header: 'Thành viên & Tài khoản',
      render: (u) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-[#e8e6e1] flex items-center justify-center font-bold text-sm text-[#111827] uppercase shrink-0">
            {u.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
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
            <div className="font-semibold text-[#111827] text-sm flex items-center gap-1.5 truncate">
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
            <div className="text-xs text-[#6b7280] truncate">{u.email}</div>
            <div className="text-[10px] text-[#9ca3af] font-mono mt-0.5">
              ID: #{u.id.slice(0, 8)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Liên hệ & Khu vực',
      width: '180px',
      render: (u) => (
        <div className="text-xs space-y-0.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-[#111827]">
            <span className="material-symbols-outlined text-[14px] text-[#9ca3af]">call</span>
            <span>{u.phone || 'Chưa cập nhật'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#6b7280]">
            <span className="material-symbols-outlined text-[14px] text-[#9ca3af]">location_on</span>
            <span>{u.province_name || u.province_code || 'Toàn quốc'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      width: '120px',
      align: 'center',
      render: (u) => <AdminBadge status={u.role} size="sm" showDot={false} />,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '130px',
      align: 'center',
      render: (u) => <AdminBadge status={u.status || 'ACTIVE'} size="sm" />,
    },
    {
      key: 'date',
      header: 'Ngày tham gia',
      width: '110px',
      render: (u) => (
        <div className="text-xs text-[#374151] whitespace-nowrap">
          <div className="font-medium">{new Date(u.created_at).toLocaleDateString('vi-VN')}</div>
          <div className="text-[10px] text-[#9ca3af]">
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
    <div className="space-y-6">
      {/* Filter Toolbar */}
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
            value={searchKeyword}
            onChange={setSearchKeyword}
            placeholder="Tìm thành viên theo tên, email, SĐT..."
          />
        </div>
      </div>

      {/* Bulk Action Toolbar */}
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

      {/* Table with Flat Clean Buttons */}
      <AdminTable<AdminUserItem>
        columns={userColumns}
        data={customerUsers}
        keyExtractor={(u) => u.id}
        loading={loading}
        selectedIds={selectedUserIds}
        onToggleSelect={handleToggleSelectUser}
        onSelectAll={handleSelectAllUsers}
        emptyMessage="Không tìm thấy thành viên nào"
        emptyIcon="group"
        rowActions={(u) => {
          const currentStatus = u.status || 'ACTIVE';
          return (
            <div className="flex items-center justify-end gap-1">
              {/* Edit button */}
              <button
                type="button"
                onClick={() => {
                  setEditingUser(u);
                  setModalOpen(true);
                }}
                title="Chỉnh sửa tài khoản"
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-slate-100 border border-[#d8d6d0] hover:border-slate-400 text-[#475569] hover:text-[#0f172a] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">edit</span>
              </button>

              {/* Toggle Lock / Suspend */}
              <button
                type="button"
                onClick={() => handleToggleStatus(u, currentStatus)}
                title={currentStatus === 'ACTIVE' ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                className={`w-6 h-6 rounded-md flex items-center justify-center bg-white border active:scale-[0.98] transition-all cursor-pointer ${
                  currentStatus === 'ACTIVE'
                    ? 'border-[#d8d6d0] hover:border-amber-400 text-[#64748b] hover:text-amber-700 hover:bg-amber-50'
                    : 'border-emerald-300 hover:border-emerald-500 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {currentStatus === 'ACTIVE' ? 'lock' : 'lock_open'}
                </span>
              </button>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDeleteUser(u)}
                title="Vô hiệu hóa tài khoản"
                className="w-6 h-6 rounded-md flex items-center justify-center bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">delete</span>
              </button>
            </div>
          );
        }}
      />

      {/* User Form Modal */}
      {modalOpen && (
        <UserFormModal
          user={editingUser}
          defaultRole="USER"
          onClose={() => {
            setModalOpen(false);
            setEditingUser(null);
          }}
          onSuccess={(msg) => {
            toast.success('Thành công', msg);
            loadUsers();
          }}
        />
      )}
    </div>
  );
};
