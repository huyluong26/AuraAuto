'use client';

import React from 'react';
import { POPULAR_PROVINCES } from '@/features/auth/constants/provinces';

interface ProfileInfoTabProps {
  user: any;
  displayName: string;
  setDisplayName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  provinceCode: string;
  setProvinceCode: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  avatarUrl: string;
  uploadingAvatar: boolean;
  savingInfo: boolean;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveAvatar: () => Promise<void>;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
}

export const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  user,
  displayName,
  setDisplayName,
  phone,
  setPhone,
  provinceCode,
  setProvinceCode,
  address,
  setAddress,
  avatarUrl,
  uploadingAvatar,
  savingInfo,
  handleAvatarUpload,
  handleRemoveAvatar,
  handleSaveProfile,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container-high/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-primary font-headline-sm">Thông tin hồ sơ cá nhân</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Cập nhật ảnh đại diện, họ tên, số điện thoại và khu vực liên lạc để người mua và hệ thống dễ dàng kết nối.
          </p>
        </div>

        {/* Dedicated Avatar Card */}
        <div className="mb-6 p-4 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary font-bold text-2xl flex items-center justify-center uppercase overflow-hidden shrink-0 border border-surface-container-high shadow-xs">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (displayName || user?.email || 'U')[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-primary">Ảnh đại diện cá nhân</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Hỗ trợ định dạng JPG, PNG, WEBP (tối đa 10MB). Ảnh hiển thị trên Navbar và các tin đăng xe của bạn.
            </p>
            <div className="mt-2.5 flex items-center gap-2.5">
              <input
                type="file"
                id="tab-avatar-file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <label
                htmlFor="tab-avatar-file"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-lowest border border-surface-container-high hover:border-primary text-primary transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">upload</span>
                <span>{uploadingAvatar ? 'Đang tải lên...' : (avatarUrl ? 'Thay đổi ảnh' : 'Tải ảnh đại diện')}</span>
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="text-xs text-error hover:underline cursor-pointer px-2 py-1"
                >
                  Gỡ ảnh
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Họ và tên */}
          <div className="space-y-1.5">
            <label htmlFor="info-name" className="block text-sm font-semibold text-primary">
              Họ và tên hiển thị <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="info-name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-primary">
              Địa chỉ Email
            </label>
            <div className="flex items-center justify-between h-11 px-3.5 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface-variant">
              <span>{user?.email || 'Chưa cập nhật'}</span>
              <span className="inline-flex items-center gap-1 text-xs text-on-secondary-container bg-secondary-container/50 px-2 py-0.5 rounded-md font-semibold border border-secondary/20">
                <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                Đã xác thực
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Email dùng để đăng nhập và nhận thông báo lịch xem xe, không thể thay đổi trực tiếp.
            </p>
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label htmlFor="info-phone" className="block text-sm font-semibold text-primary">
              Số điện thoại di động
            </label>
            <input
              type="tel"
              id="info-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Tỉnh / Thành phố */}
          <div className="space-y-1.5">
            <label htmlFor="info-province" className="block text-sm font-semibold text-primary">
              Khu vực sinh sống / Giao dịch xe
            </label>
            <div className="relative">
              <select
                id="info-province"
                value={provinceCode}
                onChange={(e) => setProvinceCode(e.target.value)}
                className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
              >
                {POPULAR_PROVINCES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-on-surface-variant text-[20px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Địa chỉ chi tiết */}
          <div className="space-y-1.5">
            <label htmlFor="info-address" className="block text-sm font-semibold text-primary">
              Địa chỉ chi tiết (Số nhà, tên đường, phường/xã)
            </label>
            <input
              type="text"
              id="info-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ví dụ: 123 Phố Huế, P. Hàng Bài, Hoàn Kiếm"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={savingInfo}
              className="h-12 px-6 rounded-xl bg-primary hover:bg-inverse-surface text-on-primary font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {savingInfo && (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              )}
              <span>{savingInfo ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
