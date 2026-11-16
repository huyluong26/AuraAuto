'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { AdminShowroomItem } from '../types';
import { useAdminUI } from '../context/AdminUIContext';
import { AdminButton } from './ui/AdminButton';

interface ShowroomFormModalProps {
  showroom?: AdminShowroomItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ShowroomFormModal({
  showroom,
  onClose,
  onSuccess,
}: ShowroomFormModalProps) {
  const { toast } = useAdminUI();
  const isEdit = !!showroom;

  const [name, setName] = useState(showroom?.name || '');
  const [phone, setPhone] = useState(showroom?.phone || '');
  const [ownerEmail, setOwnerEmail] = useState(showroom?.user?.email || '');
  const [address, setAddress] = useState(showroom?.address || '');
  const [provinceCode, setProvinceCode] = useState(showroom?.province_code || 'HN');
  const [description, setDescription] = useState(showroom?.description || '');
  const [logoUrl, setLogoUrl] = useState(showroom?.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(showroom?.banner_url || '');
  const [isVerified, setIsVerified] = useState(showroom?.is_verified ?? false);
  const [isActive, setIsActive] = useState(showroom?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning('Thiếu tên showroom', 'Vui lòng nhập tên thương hiệu showroom.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit && showroom) {
        await api.updateAdminShowroom(showroom.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          province_code: provinceCode,
          description: description.trim() || undefined,
          logo_url: logoUrl.trim() || undefined,
          banner_url: bannerUrl.trim() || undefined,
          is_verified: isVerified,
          is_active: isActive,
        });
        toast.success('Thành công', `Đã cập nhật thông tin Showroom "${name}".`);
        onSuccess(`Cập nhật Showroom ${name} thành công!`);
      } else {
        await api.createAdminShowroom({
          name: name.trim(),
          phone: phone.trim() || undefined,
          owner_email: ownerEmail.trim() ? ownerEmail.trim().toLowerCase() : undefined,
          address: address.trim() || undefined,
          province_code: provinceCode,
          description: description.trim() || undefined,
          logo_url: logoUrl.trim() || undefined,
          banner_url: bannerUrl.trim() || undefined,
          is_verified: isVerified,
          is_active: isActive,
        });
        toast.success('Tạo thành công', `Đã khởi tạo Showroom "${name}".`);
        onSuccess(`Tạo mới Showroom thành công!`);
      }
      onClose();
    } catch (err: any) {
      toast.error('Lỗi thao tác', err.message || 'Không thể lưu thông tin Showroom');
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
              <span className="material-symbols-outlined text-[22px]">store</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base text-primary font-bold">
                {isEdit ? 'Chỉnh sửa Showroom Đối tác' : 'Khởi tạo Showroom Đối tác Mới'}
              </h3>
              <p className="font-body-sm text-xs text-outline">
                {isEdit ? `Mã: ${showroom?.id.slice(0, 8)}...` : 'Tạo hồ sơ pháp lý đối tác kinh doanh trên sàn'}
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
              Tên thương hiệu Showroom / Đại lý <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Auto 88 Luxury, Showroom Hà Thành Car..."
              className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                Hotline / SĐT Showroom:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0988123456"
                className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
              />
            </div>

            {!isEdit && (
              <div className="space-y-1">
                <label className="font-label-md text-xs font-bold text-primary block">
                  Email tài khoản đại diện:
                </label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@showroom.vn"
                  className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                Khu vực Tỉnh / Thành phố:
              </label>
              <select
                value={provinceCode}
                onChange={(e) => setProvinceCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
              >
                <option value="HN">Hà Nội</option>
                <option value="SG">TP. Hồ Chí Minh</option>
                <option value="DN">Đà Nẵng</option>
                <option value="BD">Bình Dương</option>
                <option value="HP">Hải Phòng</option>
                <option value="CT">Cần Thơ</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                Địa chỉ showroom:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ví dụ: 123 Lê Văn Lương, Cầu Giấy"
                className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                URL Logo đại lý:
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://.../logo.png"
                className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs font-bold text-primary block">
                URL Ảnh bìa Showroom:
              </label>
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://.../banner.jpg"
                className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-label-md text-xs font-bold text-primary block">
              Mô tả giới thiệu showroom:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu quy mô, các dòng xe thế mạnh, cam kết bảo hành..."
              rows={2}
              className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs text-primary focus:outline-none focus:border-secondary"
            />
          </div>

          {/* Verification & Active Toggles */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span className="font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                <span>Cấp Tích Xanh Uy Tín</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-secondary rounded"
              />
              <span className="font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                <span>Đang Hoạt Động (Active)</span>
              </span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="px-0 pt-4 border-t border-surface-container-high flex items-center justify-end gap-3">
            <AdminButton variant="outline" size="sm" type="button" onClick={onClose}>
              Hủy bỏ
            </AdminButton>
            <AdminButton variant="primary" size="sm" type="submit" loading={submitting}>
              {isEdit ? 'Lưu thay đổi' : 'Tạo Showroom'}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
