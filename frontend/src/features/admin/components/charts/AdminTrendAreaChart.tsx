'use client';

import React, { useState } from 'react';

interface TrendDataPoint {
  month: string;
  listings: number;
  sold: number;
  gmv_bil: number;
}

interface AdminTrendAreaChartProps {
  data?: TrendDataPoint[];
}

export function AdminTrendAreaChart({ data = [] }: AdminTrendAreaChartProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'listings' | 'sold'>('both');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = data;

  if (!points || points.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">show_chart</span>
            <span>Xu hướng Tin đăng &amp; Khối lượng Giao dịch</span>
          </h3>
          <p className="font-body-sm text-xs text-outline mt-0.5">
            Thống kê lượng tin xe tạo mới và lượng xe đã giao dịch thành công theo dữ liệu thực
          </p>
        </div>
        <div className="p-12 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center text-xs text-outline space-y-1">
          <span className="material-symbols-outlined text-[24px]">timeline</span>
          <p>Chưa có dữ liệu biến động qua các tháng</p>
        </div>
      </div>
    );
  }

  const width = 640;
  const height = 240;
  const paddingX = 55;
  const paddingY = 30;

  const maxVal = Math.max(...points.map((p) => Math.max(p.listings, p.sold)), 5) * 1.25;

  const getX = (index: number) =>
    points.length === 1 ? width / 2 : paddingX + (index * (width - 2 * paddingX)) / (points.length - 1);
  const getY = (val: number) => height - paddingY - (val / maxVal) * (height - 2 * paddingY);

  const buildSmoothPath = (values: number[]) => {
    if (values.length === 0) return '';
    if (values.length === 1) return `M ${getX(0)} ${getY(values[0])}`;
    return values.reduce((acc, val, i, arr) => {
      const x = getX(i);
      const y = getY(val);
      if (i === 0) return `M ${x} ${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1]);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
    }, '');
  };

  const listingsPath = buildSmoothPath(points.map((p) => p.listings));
  const soldPath = buildSmoothPath(points.map((p) => p.sold));

  const listingsArea =
    points.length > 1
      ? `${listingsPath} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
      : '';
  const soldArea =
    points.length > 1
      ? `${soldPath} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
      : '';

  return (
    <div className="space-y-4">
      {/* Chart Header & Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">show_chart</span>
            <span>Xu hướng Tin đăng &amp; Khối lượng Giao dịch</span>
          </h3>
          <p className="font-body-sm text-xs text-outline mt-0.5">
            Dữ liệu phát sinh thực tế từ cơ sở dữ liệu ({points.length} mốc thời gian)
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-surface-container-high text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMetric('both')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeMetric === 'both'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-outline hover:text-primary'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('listings')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMetric === 'listings'
                ? 'bg-secondary text-white shadow-xs'
                : 'text-outline hover:text-primary'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>Tin đăng</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('sold')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMetric === 'sold'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-outline hover:text-primary'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Đã bán</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-lowest border border-surface-container-high p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="realListingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="realSoldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * (height - 2 * paddingY);
            const val = Math.round(pct * maxVal);
            return (
              <g key={idx} className="text-[10px] fill-outline/70">
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="4 4"
                />
                <text x={paddingX - 10} y={y + 3} textAnchor="end">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Fill Areas */}
          {listingsArea && (activeMetric === 'both' || activeMetric === 'listings') && (
            <path d={listingsArea} fill="url(#realListingsGrad)" />
          )}
          {soldArea && (activeMetric === 'both' || activeMetric === 'sold') && (
            <path d={soldArea} fill="url(#realSoldGrad)" />
          )}

          {/* Stroke Lines */}
          {listingsPath && (activeMetric === 'both' || activeMetric === 'listings') && (
            <path
              d={listingsPath}
              fill="none"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {soldPath && (activeMetric === 'both' || activeMetric === 'sold') && (
            <path
              d={soldPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis Labels & Nodes */}
          {points.map((p, i) => {
            const x = getX(i);
            const yListings = getY(p.listings);
            const ySold = getY(p.sold);
            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-60"
                  />
                )}

                {(activeMetric === 'both' || activeMetric === 'listings') && (
                  <circle
                    cx={x}
                    cy={yListings}
                    r={isHovered ? 6 : 4}
                    fill="#ffffff"
                    stroke="#d97706"
                    strokeWidth={isHovered ? 3 : 2}
                  />
                )}

                {(activeMetric === 'both' || activeMetric === 'sold') && (
                  <circle
                    cx={x}
                    cy={ySold}
                    r={isHovered ? 6 : 4}
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth={isHovered ? 3 : 2}
                  />
                )}

                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered ? 'fill-primary font-bold' : 'fill-outline'
                  }`}
                >
                  {p.month}
                </text>

                <rect
                  x={x - 40}
                  y={0}
                  width={80}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute top-4 pointer-events-none p-3 rounded-xl bg-primary text-on-primary shadow-xl border border-white/20 text-xs space-y-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-20"
            style={{
              left: `${(getX(hoveredIndex) / width) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold text-amber-300 text-xs">
              {points[hoveredIndex].month}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-on-primary/80">Tin xe mới:</span>
              <span className="font-bold text-amber-200">{points[hoveredIndex].listings} tin</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-on-primary/80">Đã bán thành công:</span>
              <span className="font-bold text-emerald-300">{points[hoveredIndex].sold} xe</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/20 text-[11px]">
              <span className="text-on-primary/70">Tổng giá trị:</span>
              <span className="font-mono font-bold text-white">~{points[hoveredIndex].gmv_bil} Tỷ VND</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-2 text-xs text-outline">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded-full bg-secondary" />
            <span>Tin đăng thực tế theo tháng</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded-full bg-emerald-500" />
            <span>Xe đã sang tên giao dịch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
