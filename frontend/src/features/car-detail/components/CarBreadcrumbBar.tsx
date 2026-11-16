'use client';

import React from 'react';
import Link from 'next/link';
import { ListingDetail } from '@/types';

interface CarBreadcrumbBarProps {
  listing: ListingDetail;
  isSaved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
}

export function CarBreadcrumbBar({
  listing,
  isSaved,
  onToggleSave,
  onShare,
}: CarBreadcrumbBarProps) {
  const brand = listing.title.split(' ')[0] || 'Xe sang';

  return (
    <div className="w-full px-margin-mobile lg:px-margin py-3 border-b border-surface-container-high bg-surface-container-lowest/70 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        {/* Breadcrumb Links */}
        <nav className="flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md flex-wrap">
          <Link className="hover:text-primary transition-colors" href="/">
            Trang chủ
          </Link>
          <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
          <Link className="hover:text-primary transition-colors" href="/xe">
            Bộ sưu tập xe
          </Link>
          <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
          <Link className="hover:text-primary transition-colors" href={`/xe?search=${encodeURIComponent(brand)}`}>
            {brand}
          </Link>
          <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
          <span className="text-primary font-semibold truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {listing.title}
          </span>
        </nav>

        {/* Right Actions: ID, Save, Share */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Mã xe: AUR-{listing.id.slice(0, 5).toUpperCase()}
          </span>

          <button
            type="button"
            onClick={onToggleSave}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isSaved
                ? 'bg-secondary-fixed/30 border-secondary text-secondary'
                : 'bg-surface-container-lowest border-surface-container-high text-on-surface hover:border-secondary hover:text-secondary'
            }`}
            title={isSaved ? 'Đã lưu trong danh sách yêu thích' : 'Lưu tin này'}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
            >
              {isSaved ? 'bookmark' : 'bookmark_border'}
            </span>
            <span>{isSaved ? 'Đã lưu' : 'Lưu tin'}</span>
          </button>

          <button
            type="button"
            onClick={onShare}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface hover:text-primary hover:border-primary transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer"
            title="Chia sẻ liên kết xe"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
