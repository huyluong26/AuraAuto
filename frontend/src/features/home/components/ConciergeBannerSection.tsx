import React from 'react';
import Link from 'next/link';

export default function ConciergeBannerSection() {
  return (
    <section className="w-full px-margin-mobile md:px-margin pb-space-xl max-w-7xl mx-auto">
      <div className="w-full bg-primary-container text-on-primary rounded-2xl p-space-lg sm:p-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="space-y-space-xs max-w-2xl relative z-10">
          <span className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-widest font-semibold">
            Dành Riêng Cho Chủ Xe
          </span>
          <h3 className="font-headline-lg text-headline-lg text-surface-bright font-medium">
            Bạn muốn bán hoặc đổi xe với giá tốt nhất?
          </h3>
          <p className="font-body-md text-body-md text-surface-container-highest">
            Đăng tin ngay trong 3 phút - Định giá AI hỗ trợ gợi ý giá bán tối ưu, kết nối trực tiếp hàng nghìn người
            mua xe sang trên toàn quốc mà không lo bị ép giá.
          </p>
        </div>

        <div className="flex-shrink-0 relative z-10">
          <Link
            href="/dang-tin"
            className="px-space-xl py-3.5 rounded-lg bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim font-label-lg text-label-lg inline-flex items-center gap-space-xs transition-colors shadow-lg font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Đăng tin bán xe ngay</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
