'use client';

import React from 'react';

interface LoginFormProps {
  loginIdentifier: string;
  setLoginIdentifier: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginShowPassword: boolean;
  setLoginShowPassword: (val: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  loading: boolean;
  handleLoginSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
}

export function LoginForm({
  loginIdentifier,
  setLoginIdentifier,
  loginPassword,
  setLoginPassword,
  loginShowPassword,
  setLoginShowPassword,
  rememberMe,
  setRememberMe,
  loading,
  handleLoginSubmit,
  onForgotPassword,
}: LoginFormProps) {
  return (
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
            onClick={onForgotPassword}
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
  );
}

