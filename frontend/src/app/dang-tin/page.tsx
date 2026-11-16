import React from 'react';
import { Navbar, Footer } from '@/components/layout';
import { CreateListingForm } from '@/features/car-listing';

export const metadata = {
  title: 'Đăng tin bán xe chính chủ | AuraAuto - Nền tảng Giao dịch & Thẩm định Ô tô Cao cấp',
  description:
    'Đăng tin bán xe chính chủ, kết nối trực tiếp người mua thực tế toàn quốc trong 3 phút. Tuyệt đối minh bạch và không phát sinh phí môi giới ẩn.',
};

export default function DangTinPage() {
  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      <Navbar />

      <main className="w-full pt-28 pb-16 bg-surface min-h-[calc(100vh-20rem)]">
        <div className="flex flex-col w-full">
          <div className="w-full px-margin-mobile lg:px-margin py-space-xl max-w-7xl mx-auto space-y-space-xl">
            <CreateListingForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
