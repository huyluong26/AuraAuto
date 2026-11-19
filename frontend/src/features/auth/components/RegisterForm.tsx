'use client';

import React from 'react';
import { POPULAR_PROVINCES } from '../constants/provinces';

interface RegisterFormProps {
  accountType: 'INDIVIDUAL' | 'SHOWROOM';
  setAccountType: (type: 'INDIVIDUAL' | 'SHOWROOM') => void;
  regName: string;
  setRegName: (val: string) => void;
  regShowroomName: string;
  setRegShowroomName: (val: string) => void;
  regTaxCode: string;
  setRegTaxCode: (val: string) => void;
  regEmail: string;
  setRegEmail: (val: string) => void;
  regPhone: string;
  setRegPhone: (val: string) => void;
  regProvinceCode: string;
  setRegProvinceCode: (val: string) => void;
  regAddress: string;
  setRegAddress: (val: string) => void;
  regPassword: string;
  setRegPassword: (val: string) => void;
  regShowPassword: boolean;
  setRegShowPassword: (val: boolean) => void;
  agreeTerms: boolean;
  setAgreeTerms: (val: boolean) => void;
  loading: boolean;
  handleRegisterSubmit: (e: React.FormEvent) => void;
}

export function RegisterForm({
  accountType,
  setAccountType,
  regName,
  setRegName,
  regShowroomName,
  setRegShowroomName,
  regTaxCode,
  setRegTaxCode,
  regEmail,
  setRegEmail,
  regPhone,
  setRegPhone,
  regProvinceCode,
  setRegProvinceCode,
  regAddress,
  setRegAddress,
  regPassword,
  setRegPassword,
  regShowPassword,
  setRegShowPassword,
  agreeTerms,
  setAgreeTerms,
  loading,
  handleRegisterSubmit,
}: RegisterFormProps) {
  return (
    <form className="space-y-space-md" onSubmit={handleRegisterSubmit}>
      {/* Account Type Selector (Cá nhân vs Doanh nghiệp / Showroom) */}
      <div className="space-y-1.5">
        <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium">
          Bạn tham gia với tư cách nào?
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setAccountType('INDIVIDUAL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
              accountType === 'INDIVIDUAL'
                ? 'border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/20'
                : 'border-surface-container-high bg-surface-container-lowest text-on-surface-variant hover:border-outline'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-primary">person</span>
              <span className="font-title-sm text-title-sm font-semibold">Cá nhân</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-tight">
              Mua bán xe chính chủ, tìm xe giao dịch trực tiếp
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAccountType('SHOWROOM')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
              accountType === 'SHOWROOM'
                ? 'border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/20'
                : 'border-surface-container-high bg-surface-container-lowest text-on-surface-variant hover:border-outline'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-secondary">storefront</span>
              <span className="font-title-sm text-title-sm font-semibold">Doanh nghiệp</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-tight">
              Salon xe, đại lý, cơ sở kinh doanh ô tô chuyên nghiệp
            </p>
          </button>
        </div>
      </div>

      {/* Banner đặc quyền Showroom */}
      {accountType === 'SHOWROOM' && (
        <div className="p-3 rounded-lg bg-[#b89b72]/10 border border-[#b89b72]/30 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
            workspace_premium
          </span>
          <p className="font-body-sm text-body-sm text-primary leading-snug">
            <strong className="font-semibold text-secondary">Hồ sơ Đối tác Doanh nghiệp:</strong> Tài khoản Showroom được cấp trang thương hiệu riêng, huy hiệu Đối tác uy tín và tự động ghim Hotline/Địa chỉ vào mọi tin đăng.
          </p>
        </div>
      )}

      {/* Các trường nếu là Showroom */}
      {accountType === 'SHOWROOM' ? (
        <>
          {/* Tên Showroom */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-showroom-name"
              className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
            >
              Tên Showroom / Doanh nghiệp <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="reg-showroom-name"
              required
              value={regShowroomName}
              onChange={(e) => setRegShowroomName(e.target.value)}
              placeholder="Ví dụ: Auto Nam Sài Gòn, Thế Giới Xe Đức..."
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            {/* Người đại diện */}
            <div className="space-y-1.5">
              <label
                htmlFor="reg-rep-name"
                className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
              >
                Người đại diện / Quản lý <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="reg-rep-name"
                required
                autoComplete="name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            {/* Hotline Showroom */}
            <div className="space-y-1.5">
              <label
                htmlFor="reg-phone"
                className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
              >
                Hotline Showroom <span className="text-error">*</span>
              </label>
              <input
                type="tel"
                id="reg-phone"
                required
                autoComplete="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* Email doanh nghiệp */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-email"
              className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
            >
              Email liên hệ / Tài khoản <span className="text-error">*</span>
            </label>
            <input
              type="email"
              id="reg-email"
              required
              autoComplete="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="contact@showroom.com"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Tỉnh thành và Địa chỉ Showroom */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-province"
              className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
            >
              Tỉnh / Thành phố trụ sở Showroom <span className="text-error">*</span>
            </label>
            <div className="relative">
              <select
                id="reg-province"
                value={regProvinceCode}
                onChange={(e) => setRegProvinceCode(e.target.value)}
                className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
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
            <label
              htmlFor="reg-address"
              className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
            >
              Địa chỉ Showroom chi tiết <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="reg-address"
              required
              value={regAddress}
              onChange={(e) => setRegAddress(e.target.value)}
              placeholder="Ví dụ: Số 123 Nguyễn Văn Linh, P. Tân Phong, Quận 7"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Mã số thuế (tuỳ chọn) */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-tax-code"
              className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
            >
              Mã số thuế / Giấy phép ĐKKD <span className="text-outline text-xs font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              id="reg-tax-code"
              value={regTaxCode}
              onChange={(e) => setRegTaxCode(e.target.value)}
              placeholder="0312345678"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </>
      ) : (
        <>
          {/* Họ và tên cá nhân */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-name"
              className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
            >
              Họ và tên <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="reg-name"
              required
              autoComplete="name"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-email"
              className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
            >
              Địa chỉ Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              id="reg-email"
              required
              autoComplete="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="email@domain.com"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-phone"
              className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
            >
              Số điện thoại di động <span className="text-error">*</span>
            </label>
            <input
              type="tel"
              id="reg-phone"
              required
              autoComplete="tel"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              placeholder="0912 345 678 (10 chữ số)"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Khu vực / Nơi ở */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-province"
              className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
            >
              Khu vực sinh sống / Giao dịch xe
            </label>
            <div className="relative">
              <select
                id="reg-province"
                value={regProvinceCode}
                onChange={(e) => setRegProvinceCode(e.target.value)}
                className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
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
            <p className="text-[11px] text-on-surface-variant">
              Hệ thống sẽ ưu tiên hiển thị xe và hỗ trợ đặt lịch lái thử gần bạn nhất.
            </p>
          </div>
        </>
      )}

      {/* Mật khẩu */}
      <div className="space-y-1.5">
        <label
          htmlFor="reg-password"
          className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
        >
          Tạo mật khẩu <span className="text-error">*</span>
        </label>
        <div className="relative flex items-center">
          <input
            type={regShowPassword ? 'text' : 'password'}
            id="reg-password"
            required
            autoComplete="new-password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            className="w-full h-11 pl-3.5 pr-10 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <button
            type="button"
            aria-label="Hiện/ẩn mật khẩu"
            onClick={() => setRegShowPassword(!regShowPassword)}
            className="absolute right-3 text-outline hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {regShowPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        <p className="text-[11px] text-on-surface-variant">
          Yêu cầu: Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.
        </p>
      </div>

      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-outline-variant text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer accent-primary"
          />
          <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
            Tôi đồng ý với{' '}
            <a href="#" className="text-secondary font-medium hover:underline">
              Điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a href="#" className="text-secondary font-medium hover:underline">
              Chính sách bảo mật
            </a>{' '}
            của AuraAuto
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-lg bg-primary hover:bg-inverse-surface text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08)] disabled:opacity-70 cursor-pointer"
      >
        {loading && <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>}
        <span>{loading ? 'Đang tạo tài khoản...' : (accountType === 'SHOWROOM' ? 'Đăng ký Showroom' : 'Tạo tài khoản')}</span>
      </button>
    </form>
  );
}

