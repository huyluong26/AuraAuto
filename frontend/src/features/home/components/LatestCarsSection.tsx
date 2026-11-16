import React from 'react';
import Link from 'next/link';
import { SECURITY_PILLARS } from '../constants';
import { LuxuryCarItem } from '../types';
import { CarCard } from '@/features/cars';

interface LatestCarsSectionProps {
  customCars?: LuxuryCarItem[];
}

export default function LatestCarsSection({ customCars = [] }: LatestCarsSectionProps) {
  const cars = customCars;

  return (
    <section className="w-full px-margin-mobile md:px-margin py-space-xl max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-space-lg">
        <div>
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-1">
            Cập Nhật Mới Nhất
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-medium">Xe mới đăng bán</h2>
        </div>
        <Link
          href="/xe"
          className="hidden sm:inline-flex items-center gap-space-xs font-label-lg text-label-lg text-primary hover:text-secondary transition-colors"
        >
          <span>Xem tất cả bài đăng</span>
          <span className="material-symbols-outlined text-[18px]">north_east</span>
        </Link>
      </div>

      {/* Lưới xe thực tế từ cơ sở dữ liệu - Dùng chung Unified CarCard */}
      {cars.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-space-xl">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      ) : null}

      {/* 4 Trụ Cột An Toàn & Minh Bạch AuraAuto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter pt-space-xl border-t border-surface-container-high">
        {SECURITY_PILLARS.map((pillar, idx) => (
          <div key={idx} className="space-y-space-xs">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low border border-surface-container-high flex items-center justify-center text-secondary mb-space-sm">
              <span className="material-symbols-outlined text-[20px]">{pillar.icon}</span>
            </div>
            <h4 className="font-headline-sm text-headline-sm text-primary font-semibold tracking-tight">
              {pillar.title}
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
