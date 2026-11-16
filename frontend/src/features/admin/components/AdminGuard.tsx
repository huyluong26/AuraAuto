'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<'loading' | 'authorized' | 'forbidden' | 'unauthenticated'>('loading');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminAuth() {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('access_token');
      const storedUserStr = localStorage.getItem('user');

      // 1. Kiểm tra sự tồn tại của token
      if (!token) {
        if (isMounted) {
          setAuthState('unauthenticated');
          router.replace(`/dang-nhap?redirect=${encodeURIComponent(pathname || '/admin')}&reason=auth_required`);
        }
        return;
      }

      // 2. Kiểm tra sơ bộ từ localStorage để phản hồi tức thì
      if (storedUserStr) {
        try {
          const parsed = JSON.parse(storedUserStr);
          if (parsed && parsed.role !== 'ADMIN') {
            if (isMounted) {
              setCurrentUser(parsed);
              setAuthState('forbidden');
              setErrorMessage(`Tài khoản hiện tại (${parsed.email}) có vai trò '${parsed.role}', không có quyền truy cập vào Khu vực Quản trị.`);
            }
            return;
          }
        } catch {
          // Parse lỗi -> tiếp tục xác thực backend
        }
      }

      // 3. Xác thực bảo mật trực tiếp với Backend qua JWT
      try {
        const verifiedUser = await api.getMe();
        if (!isMounted) return;

        if (verifiedUser.role === 'ADMIN') {
          setCurrentUser(verifiedUser);
          setAuthState('authorized');
          localStorage.setItem('user', JSON.stringify(verifiedUser));
        } else {
          setCurrentUser(verifiedUser);
          setAuthState('forbidden');
          setErrorMessage(`Tài khoản (${verifiedUser.email}) có vai trò '${verifiedUser.role}'. Chỉ tài khoản có đặc quyền ADMIN mới được phép truy cập.`);
        }
      } catch (err: any) {
        if (!isMounted) return;
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setAuthState('unauthenticated');
        router.replace(`/dang-nhap?redirect=${encodeURIComponent(pathname || '/admin')}&reason=session_expired`);
      }
    }

    verifyAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('aura_auth_changed'));
    router.push('/dang-nhap');
  };

  // Trạng thái đang kiểm tra token
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-space-lg text-on-surface font-body-md">
        <div className="flex flex-col items-center gap-space-md bg-surface-container-lowest p-space-xl rounded-2xl border border-surface-container-high shadow-sm text-center max-w-sm">
          <div className="w-10 h-10 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin" />
          <div className="space-y-1">
            <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
              Xác thực quyền Quản trị viên
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Kiểm tra chữ ký số JWT &amp; phân quyền truy cập hệ thống...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái chưa đăng nhập (đang chuyển hướng)
  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-space-lg text-on-surface font-body-md">
        <div className="flex flex-col items-center gap-space-md bg-surface-container-lowest p-space-xl rounded-2xl border border-surface-container-high shadow-sm text-center max-w-sm">
          <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Yêu cầu đăng nhập tài khoản Quản trị. Đang chuyển hướng...
          </p>
        </div>
      </div>
    );
  }

  // Trạng thái bị từ chối truy cập (403 Forbidden - Không phải Admin)
  if (authState === 'forbidden') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-space-md font-body-md selection:bg-secondary-fixed selection:text-on-secondary-fixed">
        <div className="max-w-md w-full bg-surface-container-lowest border border-error/30 rounded-2xl p-space-xl shadow-xl text-center space-y-space-md">
          <div className="w-14 h-14 rounded-2xl bg-error-container text-error mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">shield_lock</span>
          </div>

          <div className="space-y-space-xs">
            <span className="inline-block px-2.5 py-0.5 rounded-full font-label-sm text-label-sm tracking-widest uppercase bg-error-container text-error font-semibold">
              403 Forbidden
            </span>
            <h1 className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
              Quyền truy cập bị từ chối
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {errorMessage || 'Tài khoản của bạn không có đặc quyền quản trị viên hệ thống AuraAuto.'}
            </p>
          </div>

          {currentUser && (
            <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-container-high text-left font-body-sm text-body-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tài khoản:</span>
                <span className="font-semibold text-primary">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tên hiển thị:</span>
                <span className="font-semibold text-primary">{currentUser.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Vai trò hiện tại:</span>
                <span className="font-bold text-secondary uppercase">{currentUser.role || 'USER'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Yêu cầu quyền:</span>
                <span className="font-bold text-error uppercase">ADMIN</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-space-sm pt-2">
            <Link
              href="/"
              className="flex-1 px-space-md py-space-sm rounded-lg bg-surface text-primary border border-surface-container-high hover:bg-surface-container font-label-lg text-label-lg font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Về trang chủ</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 px-space-md py-space-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Đổi tài khoản</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
