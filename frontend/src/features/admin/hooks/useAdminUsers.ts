'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { AdminUserItem } from '../types';
import { useAdminUI } from '../context/AdminUIContext';

export function useAdminUsers(options?: { initialRoleFilter?: string; initialStatusFilter?: string }) {
  const { confirm, toast } = useAdminUI();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(options?.initialStatusFilter || '');
  const [roleFilter, setRoleFilter] = useState<string>(options?.initialRoleFilter || '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await api.getAdminUsers({
        status_filter: statusFilter || undefined,
        role_filter: roleFilter || undefined,
        search: searchKeyword.trim() || undefined,
      });
      setUsers(data);
    } catch (err: any) {
      toast.error('Lỗi tải người dùng', err.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, roleFilter, searchKeyword, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleStatus = useCallback(
    async (user: AdminUserItem, currentStatus: string): Promise<boolean> => {
      const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const actionText = newStatus === 'SUSPENDED' ? 'TẠM KHÓA' : 'MỞ KHÓA KÍCH HOẠT LẠI';

      const isConfirmed = await confirm({
        title: `Xác nhận ${actionText.toLowerCase()} tài khoản`,
        message: `Bạn có chắc chắn muốn ${actionText} tài khoản của "${user.display_name}" (${user.email})?`,
        confirmText: newStatus === 'SUSPENDED' ? 'Khóa tài khoản' : 'Mở khóa ngay',
        cancelText: 'Hủy bỏ',
        variant: newStatus === 'SUSPENDED' ? 'danger' : 'success',
        icon: newStatus === 'SUSPENDED' ? 'lock' : 'lock_open',
      });

      if (!isConfirmed) return false;

      try {
        await api.updateUserStatus(user.id, newStatus);
        toast.success(
          'Cập nhật thành công',
          `Đã ${actionText.toLowerCase()} tài khoản "${user.display_name}".`
        );
        loadUsers();
        return true;
      } catch (err: any) {
        toast.error('Lỗi cập nhật', err.message || 'Không thể thay đổi trạng thái');
        return false;
      }
    },
    [confirm, toast, loadUsers]
  );

  const handleToggleRole = useCallback(
    async (user: AdminUserItem): Promise<boolean> => {
      const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      const isPromote = newRole === 'ADMIN';

      const isConfirmed = await confirm({
        title: isPromote ? 'Thăng cấp Quản trị viên' : 'Hạ cấp thành viên',
        message: isPromote
          ? `CẢNH BÁO: Bạn có chắc chắn muốn thăng cấp tài khoản "${user.display_name}" (${user.email}) thành QUẢN TRỊ VIÊN (ADMIN)?\nTài khoản này sẽ có toàn quyền can thiệp hệ thống.`
          : `Bạn có chắc chắn muốn hạ cấp tài khoản "${user.display_name}" về Thành viên thường (USER)?`,
        confirmText: isPromote ? 'Xác nhận thăng cấp' : 'Hạ cấp',
        cancelText: 'Hủy bỏ',
        variant: isPromote ? 'warning' : 'danger',
        icon: isPromote ? 'shield_person' : 'person_remove',
      });

      if (!isConfirmed) return false;

      try {
        await api.updateUserRole(user.id, newRole);
        toast.success(
          'Phân quyền thành công',
          `Đã đổi vai trò của ${user.display_name} sang ${newRole}.`
        );
        loadUsers();
        return true;
      } catch (err: any) {
        toast.error('Lỗi phân quyền', err.message || 'Không thể thay đổi vai trò');
        return false;
      }
    },
    [confirm, toast, loadUsers]
  );

  return {
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
    handleToggleRole,
  };
}
