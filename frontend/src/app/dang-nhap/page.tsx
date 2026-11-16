import React from 'react';
import { Navbar, Footer } from '@/components/layout';
import { AuthCard } from '@/features/auth';

export const metadata = {
  title: 'Đăng nhập | AuraAuto - Nền tảng Giao dịch & Thẩm định Ô tô Cao cấp',
  description: 'Đăng nhập tài khoản AuraAuto để quản lý tin đăng, theo dõi lịch hẹn và trải nghiệm định giá AI.',
};

export default function DangNhapPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      <Navbar />
      <main className="w-full pt-28 pb-16 bg-surface min-h-[calc(100vh-20rem)] flex-1 flex flex-col justify-center">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-space-md lg:py-space-xl">
            <AuthCard initialMode="login" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
