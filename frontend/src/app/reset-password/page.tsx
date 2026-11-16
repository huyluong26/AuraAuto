'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Mã xác thực không hợp lệ hoặc thiếu thông tin token.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({
        token,
        new_password: password,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/dang-nhap');
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt lại mật khẩu. Mã khôi phục có thể đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-xl text-center">
        <div className="w-12 h-12 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-2xl">error</span>
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">Liên kết không hợp lệ</h2>
        <p className="text-sm text-outline mb-6">
          Đường dẫn đặt lại mật khẩu không chứa token hợp lệ. Vui lòng yêu cầu cấp lại liên kết mới.
        </p>
        <Link
          href="/dang-nhap"
          className="inline-flex items-center justify-center h-11 px-6 bg-primary text-on-primary rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Quay lại Đăng nhập
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-xl text-center animate-fade-in">
        <div className="w-12 h-12 bg-secondary-container text-secondary rounded-full flex items-center justify-center mx-auto mb-4 border border-secondary/20">
          <span className="material-symbols-outlined text-2xl">check_circle</span>
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">Đặt lại mật khẩu thành công!</h2>
        <p className="text-sm text-outline mb-6">
          Mật khẩu tài khoản của bạn đã được cập nhật thành công. Hệ thống đang tự động chuyển hướng về trang đăng nhập...
        </p>
        <Link
          href="/dang-nhap"
          className="inline-flex items-center justify-center h-11 px-6 bg-primary text-on-primary rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Thiết lập mật khẩu mới</h1>
        <p className="text-sm text-outline">
          Nhập mật khẩu mới an toàn cho tài khoản AuraAuto của bạn
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-start gap-3">
          <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">warning</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-outline mb-1.5 uppercase tracking-wider">
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="w-full h-11 px-3.5 pr-10 bg-surface border border-surface-container-high rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-outline mb-1.5 uppercase tracking-wider">
            Xác nhận mật khẩu mới
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            className="w-full h-11 px-3.5 bg-surface border border-surface-container-high rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-4 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <span>Xác nhận mật khẩu mới</span>
          )}
        </button>

        <div className="text-center pt-2">
          <Link
            href="/dang-nhap"
            className="text-xs text-outline hover:text-primary transition-colors font-medium"
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
      <Navbar />
      <main className="w-full pt-28 pb-16 flex-1 flex flex-col justify-center px-4">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto p-8 text-center text-outline">
              <span className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block mb-2" />
              <p className="text-sm">Đang tải...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
