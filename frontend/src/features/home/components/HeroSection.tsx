import React from 'react';
import Link from 'next/link';
import HeroSearchFilter from './HeroSearchFilter';

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-primary-container -mt-16 sm:-mt-20 pt-16 sm:pt-20">
      <div className="relative w-full min-h-[640px] lg:h-[760px] flex items-center">
        {/* Background Luxury Visual with Gradient Scrim */}
        <div
          className="absolute inset-0 bg-cover bg-center w-full h-full opacity-60 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBYV7UBJzIQSVCoUvTxWUp4ElCQu-ozcYN8-huQ7sJvYVB1FvhdYAAPuIy-5HK441ZAxVlmVWO0WwGLP2VvlcTi6i4uoO20WDiNq76A1pGHUi8h3R92EKqtBbQi0r0HViS6Xp0R4IKX8lb_NTmciI4wiiY8rHQleD8JtjlUVCMoUs78-anXk-_Xf5PrSh_mnYxGJQmwSYHhobVZIPlpkAGPmHLpSHdAdhVvRdltiExn')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-primary-container/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-container/90 via-primary-container/60 to-transparent" />

        {/* Hero Typography Content */}
        <div className="relative z-10 w-full px-margin-mobile md:px-margin max-w-7xl mx-auto py-16 flex flex-col justify-center">
          <div className="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-secondary-container/20 text-secondary-fixed max-w-max mb-space-md backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-ping" />
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">
              Sàn giao dịch ô tô C2C bảo chứng bởi AI
            </span>
          </div>

          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-primary font-semibold tracking-tight max-w-3xl leading-tight">
            Sàn giao dịch ô tô trực tiếp <br className="hidden sm:inline" />
            <span className="text-secondary-fixed">Người mua &amp; Chủ xe không qua trung gian</span>
          </h1>

          <p className="font-body-lg text-body-lg text-surface-container-highest max-w-2xl mt-space-md leading-relaxed">
            Nơi kết nối hơn 50.000 chủ xe và người mua giao dịch trực tiếp minh bạch. Loại bỏ phí hoa hồng trung gian,
            kiểm tra pháp lý và định giá xe chuẩn xác bằng công nghệ AI.
          </p>

          <div className="flex flex-wrap items-center gap-space-md mt-space-md">
            <Link
              href="/xe"
              className="px-space-lg py-3 rounded-lg bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim font-label-lg text-label-lg font-semibold inline-flex items-center gap-space-xs transition-colors shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">directions_car</span>
              <span>Tìm xe chính chủ</span>
            </Link>
            <Link
              href="/dang-tin"
              className="px-space-lg py-3 rounded-lg bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 text-surface-bright border border-surface-container-highest/30 font-label-lg text-label-lg font-semibold inline-flex items-center gap-space-xs transition-colors backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Đăng tin bán xe của bạn</span>
            </Link>
          </div>

          {/* Floating Glass Search Card */}
          <HeroSearchFilter />
        </div>
      </div>
    </section>
  );
}
