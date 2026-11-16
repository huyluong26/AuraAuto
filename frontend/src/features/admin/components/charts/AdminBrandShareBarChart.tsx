'use client';

import React from 'react';

interface BrandShareItem {
  name: string;
  count: number;
  pct: number;
  color?: string;
}

interface AdminBrandShareBarChartProps {
  data?: BrandShareItem[];
}

export function AdminBrandShareBarChart({ data = [] }: AdminBrandShareBarChartProps) {
  const items = data;

  if (!items || items.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">leaderboard</span>
            <span>Thị Phần &amp; Mật Độ Thương Hiệu Xe</span>
          </h3>
          <p className="font-body-sm text-xs text-outline mt-0.5">
            Dữ liệu phát sinh thực tế từ các bài đăng trên sàn
          </p>
        </div>
        <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center text-xs text-outline">
          Chưa có thương hiệu xe nào trong cơ sở dữ liệu.
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
            <span className="material-symbols-outlined text-secondary text-[20px]">leaderboard</span>
            <span>Thị Phần &amp; Mật Độ Thương Hiệu Xe</span>
          </h3>
          <p className="font-body-sm text-xs text-outline mt-0.5">
            Phân bổ thực tế {items.reduce((s, i) => s + i.count, 0)} xe theo hãng sản xuất
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-3.5">
        {items.map((b, idx) => (
          <div key={idx} className="space-y-1.5 group">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] font-bold text-outline w-4">
                  #{idx + 1}
                </span>
                <span className="font-bold text-primary truncate group-hover:text-secondary transition-colors">
                  {b.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-semibold text-primary text-xs">
                  {b.count} xe
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-surface-container-high text-outline text-[10px] font-mono">
                  {b.pct}%
                </span>
              </div>
            </div>

            <div className="h-2.5 w-full rounded-full bg-surface-container-high overflow-hidden">
              <div
                style={{
                  width: `${(b.count / maxCount) * 100}%`,
                  backgroundColor: b.color || '#2563eb',
                }}
                className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
