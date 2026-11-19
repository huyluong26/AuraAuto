'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthMode } from '../types';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { AuthSocialButtons } from './AuthSocialButtons';
import { ForgotPasswordModal } from './ForgotPasswordModal';

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

  return (
    <div className="w-full">
      {/* Breadcrumb Nav */}
      <div
        className={`mx-auto mb-space-md flex items-center justify-start gap-space-xs text-on-surface-variant font-label-sm text-label-sm transition-all duration-200 ${
          mode === 'register' ? 'max-w-lg' : 'max-w-md'
        }`}
      >
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Trang chủ
        </Link>
        <span className="text-outline-variant">/</span>
        <span className="text-primary font-medium">Tài khoản</span>
      </div>

      {/* Centered Minimalist Auth Card */}
      <div
        className={`mx-auto bg-surface-container-lowest p-space-xl rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-surface-container-high/60 transition-all duration-200 ${
          mode === 'register' ? 'max-w-lg' : 'max-w-md'
        }`}
      >
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
          <LoginForm
            loginIdentifier={loginIdentifier}
            setLoginIdentifier={setLoginIdentifier}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            loginShowPassword={loginShowPassword}
            setLoginShowPassword={setLoginShowPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            loading={loading}
            handleLoginSubmit={handleLoginSubmit}
            onForgotPassword={() => setShowForgotModal(true)}
          />
        )}

        {/* Form 2: Đăng ký */}
        {mode === 'register' && (
          <RegisterForm
            accountType={accountType}
            setAccountType={setAccountType}
            regName={regName}
            setRegName={setRegName}
            regShowroomName={regShowroomName}
            setRegShowroomName={setRegShowroomName}
            regTaxCode={regTaxCode}
            setRegTaxCode={setRegTaxCode}
            regEmail={regEmail}
            setRegEmail={setRegEmail}
            regPhone={regPhone}
            setRegPhone={setRegPhone}
            regProvinceCode={regProvinceCode}
            setRegProvinceCode={setRegProvinceCode}
            regAddress={regAddress}
            setRegAddress={setRegAddress}
            regPassword={regPassword}
            setRegPassword={setRegPassword}
            regShowPassword={regShowPassword}
            setRegShowPassword={setRegShowPassword}
            agreeTerms={agreeTerms}
            setAgreeTerms={setAgreeTerms}
            loading={loading}
            handleRegisterSubmit={handleRegisterSubmit}
          />
        )}

        {/* Social Quick Auth Providers */}
        <AuthSocialButtons onShowToast={showToast} />

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
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 duration-300">
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
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        showToast={showToast}
      />
    </div>
  );
}
