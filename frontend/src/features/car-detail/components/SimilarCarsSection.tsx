'use client';

import React from 'react';
import Link from 'next/link';
import { ListingItem } from '@/types';
import { CarCard } from '@/features/cars';

interface SimilarCarsSectionProps {
  cars: ListingItem[];
  loading?: boolean;
}

export function SimilarCarsSection({ cars, loading = false }: SimilarCarsSectionProps) {
  if (!loading && (!cars || cars.length === 0)) return null;

  return (
    <section className="w-full px-margin-mobile lg:px-margin py-8 sm:py-10 bg-surface-container-low border-t border-surface-container">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-secondary font-bold block mb-1">
            Gợi ý dành cho bạn
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-display text-primary tracking-tight">
            Phương tiện đề xuất phù hợp
          </h2>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary hover:text-secondary transition-colors font-semibold"
          href="/xe"
        >
          <span>Xem tất cả bộ sưu tập</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {/* Recommended Cars Grid - Unified CarCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading
          ? [1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col animate-pulse border border-surface-container-high"
              >
                <div className="w-full aspect-[16/10] bg-surface-container-high" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-4 bg-surface-container-high rounded w-3/4" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                  <div className="pt-2 border-t border-surface-container flex items-baseline justify-between">
                    <div className="h-5 bg-surface-container-high rounded w-1/3" />
                    <div className="h-7 bg-surface-container-high rounded w-16" />
                  </div>
                </div>
              </div>
            ))
          : cars.map((car) => (
              <CarCard key={car.id} listing={car} />
            ))}
      </div>
    </section>
  );
}
