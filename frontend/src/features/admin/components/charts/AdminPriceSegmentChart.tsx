'use client';

import React from 'react';

interface PriceSegmentItem {
  segment: string;
  count: number;
  label: string;
  pct: number;
}

interface AdminPriceSegmentChartProps {
  data?: PriceSegmentItem[];
}

export function AdminPriceSegmentChart({ data = [] }: AdminPriceSegmentChartProps) {
  const items = data;

  if (!items || items.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
            <span>Phân Bổ Theo Phân Khúc Giá Bán</span>
          </h3>
          <p className="font-body-sm text-xs text-outline mt-0.5">
            Dữ liệu phát sinh thực tế từ các bài đăng trên sàn
          </p>
        </div>
        <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center text-xs text-outline">
          Chưa có dữ liệu phân khúc giá xe.
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
            <span>Phân Bổ Theo Phân Khúc Giá Bán</span>
          </h3>
          <p className="font-body-sm text-xs text-outline mt-0.5">
            Cơ cấu mức giá xe niêm yết thực tế ({items.reduce((s, i) => s + i.count, 0)} xe)
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-4">
        {/* Vertical Histogram Bars */}
        <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-surface-container-high">
          {items.map((item, idx) => {
            const heightPct = item.count > 0 ? Math.max(Math.round((item.count / maxCount) * 100), 10) : 4;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-outline group-hover:text-secondary group-hover:scale-110 transition-all">
                  {item.count} xe
                </span>

                <div className="w-full max-w-[42px] bg-surface-container-high rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-xl transition-all duration-700 group-hover:brightness-110 ${
                      item.count === 0
                        ? 'bg-outline/20'
                        : idx === 1
                        ? 'bg-secondary'
                        : idx === 2
                        ? 'bg-amber-600'
                        : idx === 3
                        ? 'bg-emerald-600'
                        : idx === 4
                        ? 'bg-purple-600'
                        : 'bg-blue-600'
                    }`}
                  />
                </div>

                <span className="text-[10px] font-mono text-outline font-semibold">
                  {item.pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Labels below histogram */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="font-bold text-primary text-[11px] leading-tight truncate">
                {item.segment}
              </div>
              <div className="text-[10px] text-outline font-medium">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
