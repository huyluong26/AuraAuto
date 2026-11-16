import React from 'react';
import { Navbar, Footer } from '@/components/layout';
import { AuthCard } from '@/features/auth';

export const metadata = {
  title: 'Tạo tài khoản | AuraAuto - Nền tảng Giao dịch & Thẩm định Ô tô Cao cấp',
  description: 'Gia nhập nền tảng giao dịch và thẩm định xe ô tô cao cấp AuraAuto.',
};

export default function DangKyPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      <Navbar />
      <main className="w-full pt-28 pb-16 bg-surface min-h-[calc(100vh-20rem)] flex-1 flex flex-col justify-center">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-space-md lg:py-space-xl">
            <AuthCard initialMode="register" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
