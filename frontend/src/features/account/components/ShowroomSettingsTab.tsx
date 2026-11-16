'use client';

import React from 'react';
import { POPULAR_PROVINCES } from '@/features/auth/constants/provinces';

interface ShowroomSettingsTabProps {
  isShowroomUser: boolean;
  showroomData: any;
  srName: string;
  setSrName: (val: string) => void;
  srPhone: string;
  setSrPhone: (val: string) => void;
  srProvinceCode: string;
  setSrProvinceCode: (val: string) => void;
  srAddress: string;
  setSrAddress: (val: string) => void;
  srDescription: string;
  setSrDescription: (val: string) => void;
  srLogoUrl: string;
  srBannerUrl: string;
  uploadingLogo: boolean;
  uploadingBanner: boolean;
  savingShowroom: boolean;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSaveShowroom: (e: React.FormEvent) => Promise<void>;
}

export const ShowroomSettingsTab: React.FC<ShowroomSettingsTabProps> = ({
  isShowroomUser,
  srName,
  setSrName,
  srPhone,
  setSrPhone,
  srProvinceCode,
  setSrProvinceCode,
  srAddress,
  setSrAddress,
  srDescription,
  setSrDescription,
  srLogoUrl,
  srBannerUrl,
  uploadingLogo,
  uploadingBanner,
  savingShowroom,
  handleLogoUpload,
  handleBannerUpload,
  handleSaveShowroom,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container-high/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="max-w-2xl">
        {isShowroomUser ? (
          <div>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary font-headline-sm flex items-center gap-2">
                  <span>Hồ sơ Doanh nghiệp / Showroom</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#b89b72]/20 text-[#917548] border border-[#b89b72]/40">
                    Đối Tác
                  </span>
                </h2>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Logo thương hiệu, ảnh bìa và thông tin Showroom sẽ được hiển thị trên mọi tin đăng xe và trang giới thiệu Salon công khai.
                </p>
              </div>
            </div>

            {/* Showroom Visual Branding (Logo & Banner) */}
            <div className="mb-8 space-y-5 p-5 rounded-2xl bg-surface-container-low border border-surface-container-high">
              <h3 className="text-sm font-bold text-primary font-title-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">palette</span>
                <span>Bộ nhận diện thương hiệu Showroom</span>
              </h3>

              {/* Banner Upload */}
              <div>
                <label className="block text-xs font-semibold text-primary mb-2">
                  Ảnh bìa Showroom (Banner)
                </label>
                <div className="w-full h-36 sm:h-44 rounded-xl overflow-hidden bg-surface-container-high relative border border-surface-container-high group">
                  {srBannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={srBannerUrl} alt="Showroom Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-primary to-[#2a2a2a] text-on-primary/70 p-4 text-center">
                      <span className="material-symbols-outlined text-[36px] text-secondary/80 mb-1">
                        add_photo_alternate
                      </span>
                      <span className="text-xs font-medium">Chưa có ảnh bìa Showroom</span>
                      <span className="text-[11px] text-on-surface-variant/80 mt-0.5">Khuyến nghị tỷ lệ 16:9 hoặc 3:1 (tối đa 15MB)</span>
                    </div>
                  )}

                  <input
                    type="file"
                    id="sr-banner-file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                  />
                  <label
                    htmlFor="sr-banner-file"
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur-sm border border-surface-container-high hover:border-primary text-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    {uploadingBanner ? (
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    )}
                    <span>{uploadingBanner ? 'Đang tải...' : (srBannerUrl ? 'Đổi ảnh bìa' : 'Tải ảnh bìa')}</span>
                  </label>
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-primary mb-2">
                  Logo thương hiệu Showroom
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest border-2 border-surface-container-high flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                    {srLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={srLogoUrl} alt="Showroom Logo" className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <span className="material-symbols-outlined text-[36px] text-secondary">storefront</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Logo nhận diện hiển thị nổi bật trên danh sách xe và trang cá nhân của Showroom. Khuyến nghị ảnh vuông (tỷ lệ 1:1, tối thiểu 300x300px).
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <input
                        type="file"
                        id="sr-logo-file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                      <label
                        htmlFor="sr-logo-file"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-lowest border border-surface-container-high hover:border-primary text-primary transition-colors cursor-pointer shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        <span>{uploadingLogo ? 'Đang tải lên...' : (srLogoUrl ? 'Thay đổi logo' : 'Tải logo thương hiệu')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveShowroom} className="space-y-5">
              {/* Tên Showroom */}
              <div className="space-y-1.5">
                <label htmlFor="sr-name" className="block text-sm font-semibold text-primary">
                  Tên Showroom / Doanh nghiệp <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="sr-name"
                  required
                  value={srName}
                  onChange={(e) => setSrName(e.target.value)}
                  placeholder="Ví dụ: Auto Nam Sài Gòn, Thế Giới Xe Đức..."
                  className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Hotline Showroom */}
              <div className="space-y-1.5">
                <label htmlFor="sr-phone" className="block text-sm font-semibold text-primary">
                  Hotline Showroom / Điện thoại liên hệ <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  id="sr-phone"
                  required
                  value={srPhone}
                  onChange={(e) => setSrPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Tỉnh / Thành phố Showroom */}
              <div className="space-y-1.5">
                <label htmlFor="sr-province" className="block text-sm font-semibold text-primary">
                  Tỉnh / Thành phố trụ sở Showroom <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    id="sr-province"
                    value={srProvinceCode}
                    onChange={(e) => setSrProvinceCode(e.target.value)}
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

              {/* Địa chỉ cụ thể */}
              <div className="space-y-1.5">
                <label htmlFor="sr-address" className="block text-sm font-semibold text-primary">
                  Địa chỉ Showroom chi tiết <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="sr-address"
                  required
                  value={srAddress}
                  onChange={(e) => setSrAddress(e.target.value)}
                  placeholder="Số 123 Nguyễn Văn Linh, P. Tân Phong, Quận 7..."
                  className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Giới thiệu / Mô tả */}
              <div className="space-y-1.5">
                <label htmlFor="sr-desc" className="block text-sm font-semibold text-primary">
                  Giới thiệu về Showroom / Triết lý kinh doanh
                </label>
                <textarea
                  id="sr-desc"
                  rows={3}
                  value={srDescription}
                  onChange={(e) => setSrDescription(e.target.value)}
                  placeholder="Chuyên phân phối các dòng xe Đức lướt nguyên bản, cam kết không đâm đụng, thủy kích..."
                  className="w-full p-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm resize-none"
                />
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingShowroom}
                  className="h-12 px-6 rounded-xl bg-primary hover:bg-inverse-surface text-on-primary font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {savingShowroom && (
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                  )}
                  <span>{savingShowroom ? 'Đang lưu...' : 'Lưu hồ sơ Showroom'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Upgrade to Showroom view */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#b89b72]/10 border border-[#b89b72]/30 flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary text-[32px] shrink-0 mt-1">
                workspace_premium
              </span>
              <div>
                <h3 className="font-bold text-primary font-title-md">
                  Nâng cấp lên Tài khoản Đối tác Showroom / Salon
                </h3>
                <p className="text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                  Dành cho các salon, đại lý và cơ sở kinh doanh xe chuyên nghiệp. Nhận ngay huy hiệu Showroom xác thực, tự động gắn logo, địa chỉ và hotline vào mọi tin đăng xe để tiếp cận hàng nghìn khách hàng tiềm năng.
                </p>
              </div>
            </div>

            {/* Showroom Logo upload during upgrade */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest border border-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                {srLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={srLogoUrl} alt="Showroom Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="material-symbols-outlined text-[28px] text-secondary">storefront</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-primary">Logo thương hiệu Salon (Tùy chọn)</h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Tải trước logo cho showroom của bạn</p>
                <div className="mt-2">
                  <input
                    type="file"
                    id="up-logo-file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <label
                    htmlFor="up-logo-file"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-surface-container-lowest border border-surface-container-high hover:border-primary text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">upload</span>
                    <span>{uploadingLogo ? 'Đang tải...' : (srLogoUrl ? 'Đổi logo' : 'Tải logo')}</span>
                  </label>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveShowroom} className="space-y-5">
              {/* Tên Showroom */}
              <div className="space-y-1.5">
                <label htmlFor="up-name" className="block text-sm font-semibold text-primary">
                  Tên Showroom / Doanh nghiệp <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="up-name"
                  required
                  value={srName}
                  onChange={(e) => setSrName(e.target.value)}
                  placeholder="Ví dụ: Auto Nam Sài Gòn, Thế Giới Xe Đức..."
                  className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Hotline Showroom */}
              <div className="space-y-1.5">
                <label htmlFor="up-phone" className="block text-sm font-semibold text-primary">
                  Hotline Showroom / Điện thoại liên hệ <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  id="up-phone"
                  required
                  value={srPhone}
                  onChange={(e) => setSrPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Tỉnh / Thành phố Showroom */}
              <div className="space-y-1.5">
                <label htmlFor="up-province" className="block text-sm font-semibold text-primary">
                  Tỉnh / Thành phố Showroom <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    id="up-province"
                    value={srProvinceCode}
                    onChange={(e) => setSrProvinceCode(e.target.value)}
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

              {/* Địa chỉ cụ thể */}
              <div className="space-y-1.5">
                <label htmlFor="up-address" className="block text-sm font-semibold text-primary">
                  Địa chỉ Showroom chi tiết <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="up-address"
                  required
                  value={srAddress}
                  onChange={(e) => setSrAddress(e.target.value)}
                  placeholder="Số 123 Nguyễn Văn Linh, P. Tân Phong, Quận 7..."
                  className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-xl text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingShowroom}
                  className="h-12 px-6 rounded-xl bg-primary hover:bg-inverse-surface text-on-primary font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {savingShowroom && (
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                  )}
                  <span>{savingShowroom ? 'Đang tạo hồ sơ...' : 'Đăng ký hồ sơ Showroom ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
