'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthMode } from '../types';
import { POPULAR_PROVINCES } from '../constants/provinces';

interface AuthCardProps {
  initialMode?: AuthMode;
}

export default function AuthCard({ initialMode = 'login' }: AuthCardProps) {
  const {
    mode,
    setMode,
    // Login
    loginIdentifier,
    setLoginIdentifier,
    loginPassword,
    setLoginPassword,
    loginShowPassword,
    setLoginShowPassword,
    rememberMe,
    setRememberMe,
    handleLoginSubmit,
    // Register
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
    handleRegisterSubmit,
    // Feedback
    loading,
    toastMessage,
    toastType,
    showToast,
  } = useAuthForm(initialMode);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await api.forgotPassword(forgotEmail.trim());
      setForgotSuccess(true);
    } catch (err: any) {
      showToast(err?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Breadcrumb Nav */}
      <div className={`mx-auto mb-space-md flex items-center justify-start gap-space-xs text-on-surface-variant font-label-sm text-label-sm transition-all duration-200 ${
        mode === 'register' ? 'max-w-lg' : 'max-w-md'
      }`}>
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Trang chủ
        </Link>
        <span className="text-outline-variant">/</span>
        <span className="text-primary font-medium">Tài khoản</span>
      </div>

      {/* Centered Minimalist Auth Card */}
      <div className={`mx-auto bg-surface-container-lowest p-space-xl rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-surface-container-high/60 transition-all duration-200 ${
        mode === 'register' ? 'max-w-lg' : 'max-w-md'
      }`}>
        {/* Header Title */}
        <div className="text-center mb-space-lg">
          <h1 className="font-headline-md text-headline-md text-primary font-semibold tracking-tight">
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
            {mode === 'login'
              ? 'Chào mừng bạn trở lại với sàn giao dịch AuraAuto'
              : 'Gia nhập sàn giao dịch & thẩm định xe cao cấp AuraAuto'}
          </p>
        </div>

        {/* Segmented Tab Toggle */}
        <div className="flex p-1 bg-surface-container-low rounded-lg mb-space-lg text-center">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`w-1/2 py-2 rounded-md font-label-md text-label-md transition-all duration-200 cursor-pointer ${
              mode === 'login'
                ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`w-1/2 py-2 rounded-md font-label-md text-label-md transition-all duration-200 cursor-pointer ${
              mode === 'register'
                ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Form 1: Đăng nhập */}
        {mode === 'login' && (
          <form className="space-y-space-md" onSubmit={handleLoginSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="login-identifier"
                className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
              >
                Email hoặc Số điện thoại
              </label>
              <input
                type="text"
                id="login-identifier"
                required
                autoComplete="username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="0912 345 678 hoặc email@domain.com"
                className="w-full h-11 px-3.5 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block font-label-sm text-label-sm text-on-surface-variant font-medium"
                >
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSuccess(false);
                    setForgotEmail('');
                    setShowForgotModal(true);
                  }}
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={loginShowPassword ? 'text' : 'password'}
                  id="login-password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full h-11 pl-3.5 pr-10 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-md text-body-md text-primary placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                <button
                  type="button"
                  aria-label="Hiện/ẩn mật khẩu"
                  onClick={() => setLoginShowPassword(!loginShowPassword)}
                  className="absolute right-3 text-outline hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {loginShowPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer accent-primary"
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary hover:bg-inverse-surface text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08)] disabled:opacity-70 cursor-pointer"
            >
              {loading && <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>}
              <span>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</span>
            </button>
          </form>
        )}

        {/* Form 2: Đăng ký */}
        {mode === 'register' && (
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
        )}

        {/* Divider with text */}
        <div className="relative my-space-lg flex items-center justify-center">
          <div className="w-full border-t border-surface-container-high" />
          <span className="absolute bg-surface-container-lowest px-3 font-label-sm text-label-sm text-outline">
            Hoặc tiếp tục với
          </span>
        </div>

        {/* Social Quick Auth Providers */}
        <div className="grid grid-cols-3 gap-space-sm">
          <button
            type="button"
            onClick={() => showToast('Tính năng liên kết Google đang được kết nối.')}
            className="h-11 rounded-lg border border-surface-container-high hover:border-outline hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 font-label-md text-label-md text-primary cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span className="hidden sm:inline">Google</span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Tính năng liên kết Apple đang được kết nối.')}
            className="h-11 rounded-lg border border-surface-container-high hover:border-outline hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 font-label-md text-label-md text-primary cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.92.04-2.02.62-2.67 1.37-.56.65-.99 1.7-1 2.76 1.02.08 2.05-.51 2.66-1.26z" />
            </svg>
            <span className="hidden sm:inline">Apple</span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Tính năng định danh VNeID đang kết nối Cổng DVC.')}
            className="h-11 rounded-lg border border-surface-container-high hover:border-outline hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5 font-label-md text-label-md text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">shield_person</span>
            <span className="hidden sm:inline">VNeID</span>
          </button>
        </div>

        {/* VIP Concierge Support Footnote */}
        <div className="mt-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
          Cần hỗ trợ tài khoản VIP?{' '}
          <a href="tel:18008899" className="text-secondary font-medium hover:underline">
            Hotline 1800 8899
          </a>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-body-sm ${
              toastType === 'success'
                ? 'bg-surface-container-lowest border-secondary text-primary'
                : 'bg-error-container border-error text-on-error-container'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                toastType === 'success' ? 'text-secondary' : 'text-error'
              }`}
            >
              {toastType === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {forgotSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-secondary-container text-secondary rounded-full flex items-center justify-center mx-auto mb-3 border border-secondary/20">
                  <span className="material-symbols-outlined text-2xl">mail</span>
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">Đã gửi hướng dẫn!</h3>
                <p className="text-xs text-outline mb-6 leading-relaxed">
                  Nếu email <strong className="text-primary">{forgotEmail}</strong> tồn tại trên hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư đến (và thư mục Spam).
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full h-11 bg-primary text-on-primary rounded-xl font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Đã hiểu & Đóng
                </button>
              </div>
            ) : (
              <div>
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
                </div>
                <h3 className="text-lg font-bold text-primary mb-1">Quên mật khẩu?</h3>
                <p className="text-xs text-outline mb-5">
                  Nhập địa chỉ email đăng ký tài khoản của bạn. Hệ thống sẽ gửi một liên kết bảo mật để thiết lập lại mật khẩu mới.
                </p>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-outline mb-1.5 uppercase tracking-wider">
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full h-11 px-3.5 bg-surface border border-surface-container-high rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 h-11 border border-surface-container-high text-outline hover:text-primary rounded-xl font-medium text-sm transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 h-11 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {forgotLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Đang gửi...</span>
                        </>
                      ) : (
                        <span>Gửi liên kết</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
