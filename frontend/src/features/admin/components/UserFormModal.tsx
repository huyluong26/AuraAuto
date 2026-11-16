'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { AdminUserItem } from '../types';
import { useAdminUI } from '../context/AdminUIContext';
import { AdminButton } from './ui/AdminButton';

interface UserFormModalProps {
  user?: AdminUserItem | null; // If null -> Create Mode; If present -> Edit Mode
  defaultRole?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function UserFormModal({
  user,
  defaultRole = 'USER',
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const { toast } = useAdminUI();
  const isEdit = !!user;

  const [email, setEmail] = useState(user?.email || '');
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState<string>(user?.role || defaultRole);
  const [status, setStatus] = useState<string>(user?.status || 'ACTIVE');
  const [provinceCode, setProvinceCode] = useState(user?.province_code || 'HN');
  const [provinceName, setProvinceName] = useState(user?.province_name || 'Hà Nội');
  const [address, setAddress] = useState(user?.address || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.warning('Thiếu họ tên', 'Vui lòng nhập họ và tên hoặc tên hiển thị.');
      return;
    }

    if (!isEdit && !email.trim()) {
      toast.warning('Thiếu email', 'Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (!isEdit && (!password || password.length < 6)) {
      toast.warning('Mật khẩu yếu', 'Mật khẩu khởi tạo phải có tối thiểu 6 ký tự.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit && user) {
        await api.updateAdminUser(user.id, {
          display_name: displayName.trim(),
          phone: phone.trim() || undefined,
          role,
          status,
          province_code: provinceCode,
          province_name: provinceName,
          address: address.trim() || undefined,
          new_password: password.trim() ? password.trim() : undefined,
        });
        toast.success('Thành công', `Đã cập nhật thông tin tài khoản "${displayName}".`);
        onSuccess(`Cập nhật tài khoản ${displayName} thành công!`);
      } else {
        await api.createAdminUser({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          display_name: displayName.trim(),
          phone: phone.trim() || undefined,
          province_code: provinceCode,
          province_name: provinceName,
          address: address.trim() || undefined,
          role,
        });
        toast.success('Tạo thành công', `Đã khởi tạo tài khoản "${displayName}" (${role}).`);
        onSuccess(`Tạo tài khoản mới thành công!`);
      }
      onClose();
    } catch (err: any) {
      toast.error('Lỗi thao tác', err.message || 'Không thể lưu thông tin tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container-high bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/60 text-secondary border border-secondary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">
                {isEdit ? 'manage_accounts' : 'person_add'}
              </span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base text-primary font-bold">
                {isEdit ? 'Chỉnh sửa Tài khoản' : 'Khởi tạo Tài khoản Mới'}
              </h3>
              <p className="font-body-sm text-xs text-outline">
                {isEdit
                  ? `ID: ${user?.id.slice(0, 8)}... • ${user?.email}`
                  : 'Tạo tài khoản thành viên hoặc phân quyền nhân sự nội bộ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-surface-container-high flex items-center justify-center text-outline hover:text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="font-label-md text-xs font-bold text-primary block">
              Họ và tên / Tên hiển thị <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                Địa chỉ Email <span className="text-red-500">*</span>:
              </label>
              <input
                type="email"
                required
                disabled={isEdit}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                  isEdit
                    ? 'bg-surface-container-high text-outline cursor-not-allowed border-surface-container-high'
                    : 'bg-surface-container-low text-primary border-surface-container-high focus:border-secondary'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                Số điện thoại liên hệ:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          {/* Role & Status Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                Vai trò / Bộ phận phân quyền <span className="text-red-500">*</span>:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary font-semibold"
              >
                <option value="USER">Thành viên thường (USER)</option>
                <option value="INSPECTOR">Kiểm duyệt &amp; Thẩm định (INSPECTOR)</option>
                <option value="SUPPORT">CSKH &amp; Điều phối (SUPPORT)</option>
                <option value="ADMIN">Quản trị viên tối cao (ADMIN)</option>
              </select>
            </div>

            {isEdit && (
              <div className="space-y-1">
                <label className="font-label-md text-xs font-bold text-primary block">
                  Trạng thái tài khoản:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary font-semibold"
                >
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="SUSPENDED">Tạm khóa truy cập (SUSPENDED)</option>
                  <option value="DELETED">Vô hiệu hóa (DELETED)</option>
                </select>
              </div>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="font-label-md text-xs font-bold text-primary block">
              {isEdit ? 'Mật khẩu mới (Bỏ trống nếu không muốn đổi):' : 'Mật khẩu khởi tạo *:'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Nhập mật khẩu mới...' : 'Mật khẩu ít nhất 6 ký tự'}
              className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
            />
          </div>

          {/* Location info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                Tỉnh / Thành phố:
              </label>
              <select
                value={provinceCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setProvinceCode(val);
                  setProvinceName(val === 'HN' ? 'Hà Nội' : val === 'SG' ? 'TP. Hồ Chí Minh' : val === 'DN' ? 'Đà Nẵng' : 'Tỉnh thành khác');
                }}
                className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
              >
                <option value="HN">Hà Nội</option>
                <option value="SG">TP. Hồ Chí Minh</option>
                <option value="DN">Đà Nẵng</option>
                <option value="BD">Bình Dương</option>
                <option value="HP">Hải Phòng</option>
                <option value="CT">Cần Thơ</option>
                <option value="ALL">Toàn quốc</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                Địa chỉ chi tiết:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường..."
                className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="px-0 pt-4 border-t border-surface-container-high flex items-center justify-end gap-3">
            <AdminButton variant="outline" size="sm" type="button" onClick={onClose}>
              Hủy bỏ
            </AdminButton>
            <AdminButton variant="primary" size="sm" type="submit" loading={submitting}>
              {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
