'use client';

import React, { useState } from 'react';

interface BodyTypeItem {
  type: string;
  count: number;
  pct: number;
  color: string;
}

interface AdminBodyTypeDonutChartProps {
  data?: BodyTypeItem[];
}

export function AdminBodyTypeDonutChart({ data = [] }: AdminBodyTypeDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = data;

  if (!items || items.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">directions_car</span>
            <span>Cơ Cấu Kiểu Dáng Phương Tiện</span>
          </h3>
          <p className="font-body-sm text-xs text-outline mt-0.5">
            Dữ liệu phát sinh thực tế từ các bài đăng trên sàn
          </p>
        </div>
        <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center text-xs text-outline">
          Chưa có dữ liệu kiểu dáng thân xe.
        </div>
      </div>
    );
  }

  const totalCount = items.reduce((acc, curr) => acc + curr.count, 0);

  // SVG Donut calculation
  const radius = 68;
  const circumference = 2 * Math.PI * radius; // ~427.25

  let accumulatedPercent = 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">directions_car</span>
          <span>Cơ Cấu Kiểu Dáng Phương Tiện</span>
        </h3>
        <p className="font-body-sm text-xs text-outline mt-0.5">
          Tỷ trọng các dòng xe thực tế ({totalCount} xe)
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90 select-none">
            {/* Background Ring */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="18"
              className="opacity-40"
            />

            {/* Segments */}
            {items.map((item, idx) => {
              const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.pct;
              const isHovered = hoveredIndex === idx;

              return (
                <circle
                  key={idx}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? 24 : 18}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {hoveredIndex !== null ? (
              <>
                <span className="font-headline-md text-xl font-extrabold text-primary font-mono leading-none">
                  {items[hoveredIndex].pct}%
                </span>
                <span className="text-[10px] text-outline font-medium mt-1 truncate max-w-[85px]">
                  {items[hoveredIndex].type}
                </span>
              </>
            ) : (
              <>
                <span className="font-headline-md text-xl font-extrabold text-primary font-mono leading-none">
                  {totalCount}
                </span>
                <span className="text-[10px] text-outline font-medium mt-1 uppercase tracking-wider">
                  Tổng xe
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                hoveredIndex === idx
                  ? 'bg-surface-container-low scale-[1.02]'
                  : 'hover:bg-surface-container-low/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-md shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-primary truncate">
                  {item.type}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                <span className="text-outline">{item.count} xe</span>
                <span className="font-bold text-primary w-8 text-right">{item.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
