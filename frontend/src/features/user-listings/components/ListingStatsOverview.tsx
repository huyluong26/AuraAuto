'use client';

import React from 'react';
import { ListingSummary } from '../types';

interface ListingStatsOverviewProps {
  summary: ListingSummary;
}

export const ListingStatsOverview: React.FC<ListingStatsOverviewProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Metric 1 */}
      <div className="p-4 rounded-xl bg-white border border-[#e8e6e1] shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#888]">
          <span className="text-[11px] font-semibold tracking-wider uppercase">Tổng xe đăng</span>
          <span className="material-symbols-outlined text-[17px] text-[#9ca3af]">directions_car</span>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-headline text-[#111827] tracking-tight leading-none">
            {summary.total_listings}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{summary.published_listings} xe đang mở bán</span>
          </div>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="p-4 rounded-xl bg-white border border-[#e8e6e1] shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8c6d3b]">
          <span className="text-[11px] font-semibold tracking-wider uppercase">Tin nổi bật VIP</span>
          <span className="material-symbols-outlined text-[17px] text-[#8c6d3b]">workspace_premium</span>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-headline text-[#8c6d3b] tracking-tight leading-none">
            {summary.featured_listings}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#8c6d3b] mt-1.5 font-medium">
            <span className="material-symbols-outlined text-[13px]">trending_up</span>
            <span>Hiệu quả tiếp cận x3.5</span>
          </div>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="p-4 rounded-xl bg-white border border-[#e8e6e1] shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#888]">
          <span className="text-[11px] font-semibold tracking-wider uppercase">Chờ xử lý</span>
          <span className="material-symbols-outlined text-[17px] text-[#9ca3af]">hourglass_top</span>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-headline text-[#111827] tracking-tight leading-none">
            {summary.pending_listings + summary.draft_listings}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 mt-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>
              {summary.pending_listings} chờ duyệt • {summary.draft_listings} nháp
            </span>
          </div>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="p-4 rounded-xl bg-white border border-[#e8e6e1] shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#888]">
          <span className="text-[11px] font-semibold tracking-wider uppercase">Lượt quan tâm</span>
          <span className="material-symbols-outlined text-[17px] text-[#9ca3af]">visibility</span>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-headline text-[#111827] tracking-tight leading-none">
            {summary.total_views.toLocaleString('vi-VN')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#4b5563] mt-1.5 font-medium">
            <span className="material-symbols-outlined text-[13px] text-rose-500">favorite</span>
            <span>{summary.total_favorites} khách đã lưu xe</span>
          </div>
        </div>
      </div>
    </div>
  );
};
