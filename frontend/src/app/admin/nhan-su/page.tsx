'use client';

import React, { useState } from 'react';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminTable } from '@/features/admin/components/ui/AdminTable';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { AdminBadge } from '@/features/admin/components/ui/AdminBadge';
import { AdminSearchInput } from '@/features/admin/components/ui/AdminSearchInput';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { AdminUserItem, TableColumn } from '@/features/admin/types';
import { useAdminUI } from '@/features/admin/context/AdminUIContext';
import { api } from '@/lib/api';
import { UserFormModal } from '@/features/admin/components/UserFormModal';

export default function AdminStaffPage() {
  const { confirm, toast } = useAdminUI();

  const {
    users,
    loading,
    refreshing,
    searchKeyword,
    setSearchKeyword,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    loadUsers,
    handleToggleStatus,
  } = useAdminUsers({ initialRoleFilter: 'STAFF' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [defaultRole, setDefaultRole] = useState<string>('INSPECTOR');

  // Filter internal staff: only ADMIN, INSPECTOR, SUPPORT
  const internalStaff = users.filter(
    (u) => u.role === 'ADMIN' || u.role === 'INSPECTOR' || u.role === 'SUPPORT'
  );

  const adminCount = internalStaff.filter((u) => u.role === 'ADMIN').length;
  const inspectorCount = internalStaff.filter((u) => u.role === 'INSPECTOR').length;
  const supportCount = internalStaff.filter((u) => u.role === 'SUPPORT').length;

  const handleDeleteStaff = async (u: AdminUserItem) => {
    const isConfirmed = await confirm({
      title: 'Thu hồi quyền & vô hiệu hóa nhân sự',
      message: `CẢNH BÁO: Bạn có chắc chắn muốn thu hồi quyền và vô hiệu hóa tài khoản nhân viên "${u.display_name}" (${u.email})?\n\nTài khoản này sẽ không thể đăng nhập vào cổng quản trị nữa.`,
      confirmText: 'Thu hồi quyền',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      icon: 'person_remove',
    });

    if (!isConfirmed) return;

    try {
      await api.deleteAdminUser(u.id);
      toast.success('Đã thu hồi', `Đã vô hiệu hóa tài khoản nhân viên ${u.email}.`);
      loadUsers();
    } catch (err: any) {
      toast.error('Lỗi thao tác', err.message || 'Không thể thu hồi quyền nhân viên');
    }
  };

  const columns: TableColumn<AdminUserItem>[] = [
    {
      key: 'user',
      header: 'Nhân viên & Tài khoản',
      width: '30%',
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
      key: 'role',
      header: 'Phòng ban & Vai trò',
      width: '20%',
      render: (u) => (
        <div className="flex flex-col gap-1 items-start">
          <AdminBadge status={u.role} size="sm" showDot={false} />
          <span className="text-[10px] text-outline">
            {u.role === 'ADMIN'
              ? 'Quản trị viên tối cao'
              : u.role === 'INSPECTOR'
              ? 'Bộ phận Kiểm duyệt & Thẩm định'
              : 'Bộ phận CSKH & Điều phối'}
          </span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Liên hệ & Khu vực',
      width: '20%',
      render: (u) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[14px] text-outline">call</span>
            <span>{u.phone || 'Chưa cập nhật'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-outline">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            <span>{u.province_name || u.province_code || 'Trụ sở chính'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '14%',
      align: 'center',
      render: (u) => <AdminBadge status={u.status || 'ACTIVE'} size="sm" />,
    },
    {
      key: 'date',
      header: 'Ngày bổ nhiệm',
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
        title="Quản trị Nhân sự & Phân quyền Hệ thống (RBAC)"
        subtitle={`${internalStaff.length} tài khoản nhân sự nội bộ thuộc các phòng ban vận hành`}
        onRefresh={loadUsers}
        isRefreshing={refreshing}
        actions={
          <AdminButton
            variant="primary"
            size="sm"
            icon="person_add"
            onClick={() => {
              setEditingUser(null);
              setDefaultRole('INSPECTOR');
              setModalOpen(true);
            }}
          >
            Thêm Nhân Sự Mới
          </AdminButton>
        }
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Department Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: ADMIN */}
          <div
            onClick={() => setRoleFilter(roleFilter === 'ADMIN' ? 'STAFF' : 'ADMIN')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-2 ${
              roleFilter === 'ADMIN'
                ? 'bg-red-50/60 border-red-400 ring-2 ring-red-300'
                : 'bg-surface-container-lowest border-surface-container-high hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                <span>Quản trị viên (ADMIN)</span>
              </div>
              <span className="font-mono text-base font-extrabold text-red-700">
                {adminCount}
              </span>
            </div>
            <p className="text-[11px] text-outline leading-relaxed">
              Quyền hạn tối cao: Quản trị toàn sàn, phân quyền nhân sự, cơ sở dữ liệu và vận hành hệ thống AI MLOps.
            </p>
            <div className="text-[10px] text-red-600 font-medium">
              {roleFilter === 'ADMIN' ? '✓ Đang lọc ADMIN' : 'Nhấn để lọc phòng ban'}
            </div>
          </div>

          {/* Card 2: INSPECTOR */}
          <div
            onClick={() => setRoleFilter(roleFilter === 'INSPECTOR' ? 'STAFF' : 'INSPECTOR')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-2 ${
              roleFilter === 'INSPECTOR'
                ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-300'
                : 'bg-surface-container-lowest border-surface-container-high hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Bộ phận Kiểm duyệt &amp; Thẩm định</span>
              </div>
              <span className="font-mono text-base font-extrabold text-amber-700">
                {inspectorCount}
              </span>
            </div>
            <p className="text-[11px] text-outline leading-relaxed">
              Quyền hạn: Phê duyệt/từ chối tin đăng xe, thẩm định kỹ thuật 160 điểm và giải quyết báo cáo vi phạm.
            </p>
            <div className="text-[10px] text-amber-600 font-medium">
              {roleFilter === 'INSPECTOR' ? '✓ Đang lọc INSPECTOR' : 'Nhấn để lọc phòng ban'}
            </div>
          </div>

          {/* Card 3: SUPPORT */}
          <div
            onClick={() => setRoleFilter(roleFilter === 'SUPPORT' ? 'STAFF' : 'SUPPORT')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-2 ${
              roleFilter === 'SUPPORT'
                ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-300'
                : 'bg-surface-container-lowest border-surface-container-high hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                <span>Bộ phận CSKH &amp; Điều phối</span>
              </div>
              <span className="font-mono text-base font-extrabold text-blue-700">
                {supportCount}
              </span>
            </div>
            <p className="text-[11px] text-outline leading-relaxed">
              Quyền hạn: Tiếp nhận hỗ trợ người dùng, điều phối lịch hẹn lái thử / xem xe và chăm sóc đối tác showroom.
            </p>
            <div className="text-[10px] text-blue-600 font-medium">
              {roleFilter === 'SUPPORT' ? '✓ Đang lọc SUPPORT' : 'Nhấn để lọc phòng ban'}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
            >
              <option value="STAFF">Tất cả vai trò nội bộ</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
              <option value="INSPECTOR">Kiểm duyệt &amp; Thẩm định (INSPECTOR)</option>
              <option value="SUPPORT">CSKH &amp; Điều phối (SUPPORT)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="SUSPENDED">Đang tạm khóa (SUSPENDED)</option>
            </select>
          </div>

          <div className="w-full md:w-80">
            <AdminSearchInput
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="Tìm nhân viên theo tên, email, SĐT..."
            />
          </div>
        </div>

        {/* Staff Table */}
        <AdminTable<AdminUserItem>
          columns={columns}
          data={internalStaff}
          keyExtractor={(u) => u.id}
          loading={loading}
          emptyMessage="Không tìm thấy nhân viên nào phù hợp"
          emptyIcon="shield_person"
          rowActions={(u) => {
            const currentStatus = u.status || 'ACTIVE';
            return (
              <div className="flex items-center justify-end gap-1.5">
                {/* Edit Staff Role & Info */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(u);
                    setModalOpen(true);
                  }}
                  title="Sửa quyền hạn & thông tin nhân sự"
                  className="p-1.5 rounded-lg border border-surface-container-high text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">edit</span>
                </button>

                {/* Lock / Suspend Staff */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(u, currentStatus)}
                  title={currentStatus === 'ACTIVE' ? 'Tạm khóa quyền nhân viên' : 'Mở khóa tài khoản'}
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

                {/* Revoke / Delete Staff */}
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(u)}
                  title="Thu hồi quyền nhân sự"
                  className="p-1.5 rounded-lg border border-surface-container-high text-outline hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">person_remove</span>
                </button>
              </div>
            );
          }}
        />
      </main>

      {/* Staff Create/Edit Modal */}
      {modalOpen && (
        <UserFormModal
          user={editingUser}
          defaultRole={defaultRole}
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
}
