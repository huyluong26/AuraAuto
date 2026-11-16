'use client';

import React from 'react';
import Link from 'next/link';
import { LuxuryCarItem } from '../types';
import { CarCard } from '@/features/cars';

interface FeaturedCarsSectionProps {
  customCars?: LuxuryCarItem[];
}

export default function FeaturedCarsSection({ customCars = [] }: FeaturedCarsSectionProps) {
  const cars = customCars;

  if (!cars || cars.length === 0) {
    return null;
  }

  return (
    <section className="w-full px-margin-mobile md:px-margin py-space-xl max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-sm">
        <div className="space-y-space-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed/30 text-secondary font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span className="uppercase tracking-widest font-semibold">Đã xác thực giấy tờ &amp; Chủ xe</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-medium">
            Tin đăng chính chủ nổi bật
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Xe giao dịch trực tiếp từ chủ xe cá nhân, đã đối soát giấy tờ chính chủ và xác thực kiểm định độc lập.
          </p>
        </div>
        <Link
          href="/xe"
          className="inline-flex items-center gap-space-xs font-label-lg text-label-lg text-secondary hover:text-on-secondary-fixed-variant transition-colors group"
        >
          <span>Xem toàn bộ xe sẵn có</span>
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </Link>
      </div>

      {/* Lưới xe thực tế từ cơ sở dữ liệu - Dùng chung Unified CarCard */}
      {cars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high p-8 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[28px]">directions_car</span>
          </div>
          <h3 className="font-headline-sm text-base font-semibold text-primary">
            Chưa có tin đăng xe nào trên hệ thống
          </h3>
          <p className="text-xs text-outline max-w-sm mx-auto">
            Hãy là chủ xe đầu tiên đưa phương tiện lên sàn giao dịch AuraAuto để tiếp cận người mua trực tiếp.
          </p>
          <Link
            href="/dang-tin"
            className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-black transition-colors"
          >
            Đăng tin bán xe ngay
          </Link>
        </div>
      )}
    </section>
  );
}
