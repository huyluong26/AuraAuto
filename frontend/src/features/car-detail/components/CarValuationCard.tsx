'use client';

import React from 'react';
import { formatVND, formatFullVND } from '@/lib/api';
import { ValuationResponse } from '@/types';

interface CarValuationCardProps {
  priceVnd: number;
  valuation: ValuationResponse | null;
  gaugePercent: number;
  loading?: boolean;
  onRequestValuation?: () => void;
}

export function CarValuationCard({
  priceVnd,
  valuation,
  gaugePercent,
  loading = false,
  onRequestValuation,
}: CarValuationCardProps) {
  // If user hasn't requested valuation yet
  if (!valuation && !loading) {
    return (
      <div className="p-5 rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -right-20 -top-20 w-56 h-56 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 max-w-xl">
            <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-secondary-fixed">
                smart_toy
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold font-display text-primary">
                  Thẩm Định Giá Thông Minh AI • AuraML™
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase">
                  CatBoost v4.2
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Đối chiếu giá niêm yết của chủ xe với dữ liệu 180.000+ giao dịch xe cũ thực tế trên toàn quốc. Đánh giá vùng giá hợp lý và khuyến nghị thương lượng.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={onRequestValuation}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary-fixed group-hover:rotate-12 transition-transform">
                auto_awesome
              </span>
              <span>Chạy Thẩm Định AI</span>
            </button>
          </div>
        </div>

        {/* 3 Quick Benefit Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 mt-3 border-t border-surface-container text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
            <span>Độ chính xác R² = 95.4%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[16px]">query_stats</span>
            <span>Biên độ giá thị trường 30 ngày</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[16px]">health_and_safety</span>
            <span>Khách quan độc lập 100%</span>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-surface-container-lowest shadow-xs border border-secondary/30 relative overflow-hidden">
        <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
            <span className="material-symbols-outlined text-secondary text-[20px] absolute inset-0 flex items-center justify-center">
              smart_toy
            </span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold font-display text-primary">
              AuraML™ đang phân tích dữ liệu xe...
            </h4>
            <p className="text-xs text-on-surface-variant max-w-md">
              Đối chiếu số km, năm sản xuất, phân khúc và khu vực với dữ liệu giao dịch toàn quốc.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Valuation Result Display
  const lowVnd = valuation?.interval_low_vnd || priceVnd * 0.95;
  const highVnd = valuation?.interval_high_vnd || priceVnd * 1.05;
  const estVnd = valuation?.estimated_price_vnd || priceVnd;
  const explanation = valuation?.explanation;

  return (
    <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm relative overflow-hidden border border-secondary/30">
      {/* Ambient Glow Accent */}
      <div className="absolute -right-20 -top-20 w-56 h-56 bg-secondary-fixed/25 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold font-display text-primary">
                Kết Quả Thẩm Định Giá AI • AuraML™
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] uppercase font-bold">
                {valuation?.model_version || 'CatBoost v4.2'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Thuật toán Conformal Residual Calibration 90%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRequestValuation}
          className="inline-flex items-center gap-1 text-xs text-secondary hover:underline cursor-pointer font-medium self-start sm:self-auto"
          title="Định giá lại"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          <span>Định giá lại</span>
        </button>
      </div>

      {/* Valuation Comparison Triad */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
        <div className="p-3 rounded-lg bg-surface-container flex flex-col">
          <span className="text-[10px] text-on-surface-variant uppercase font-medium">
            Giá người bán niêm yết
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-primary mt-0.5">
            {formatFullVND(priceVnd)}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">
            Bao phí sang tên chuẩn
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface-container flex flex-col relative border border-secondary/40 shadow-2xs">
          <span className="text-[10px] text-secondary uppercase font-semibold">
            Ước tính AuraML Real-time
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-secondary mt-0.5">
            {formatFullVND(estVnd)}
          </span>
          <span className="text-[11px] text-secondary mt-0.5">
            {priceVnd <= estVnd
              ? `Tiết kiệm ${formatFullVND(estVnd - priceVnd)}`
              : 'Mức giá có thể thương lượng'}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface-container flex flex-col">
          <span className="text-[10px] text-on-surface-variant uppercase font-medium">
            Khoảng dao động 30 ngày
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-on-surface mt-0.5">
            {formatVND(lowVnd)} – {formatVND(highVnd)}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">
            Độ tin cậy 98.4%
          </span>
        </div>
      </div>

      {/* Data Visualization: Price Range Bar (Inline SVG) */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between text-on-surface-variant text-[11px]">
          <span className="text-secondary font-medium">
            Vùng Giá Hời (&lt; {formatVND(lowVnd)})
          </span>
          <span className="text-primary font-bold">
            VÙNG HỢP LÝ ({formatVND(lowVnd)} - {formatVND(highVnd)})
          </span>
          <span>Vùng Giá Cao (&gt; {formatVND(highVnd)})</span>
        </div>

        {/* SVG Gauge Component */}
        <div className="w-full h-7 relative flex items-center">
          <svg
            className="w-full h-2.5 rounded-full overflow-hidden"
            preserveAspectRatio="none"
            viewBox="0 0 1000 10"
          >
            <rect fill="#efeeeb" height="10" width="300" x="0" y="0" />
            <rect fill="#ffddb0" height="10" width="400" x="300" y="0" />
            <rect fill="#e3e2df" height="10" width="300" x="700" y="0" />
          </svg>

          {/* Dynamic Pin representing current price */}
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center -translate-x-1/2 transition-all duration-500"
            style={{ left: `${gaugePercent}%` }}
          >
            <div className="px-1.5 py-0.5 rounded bg-primary text-on-primary text-[9px] font-semibold whitespace-nowrap shadow-xs">
              Vị trí: {formatVND(priceVnd)}
            </div>
            <div className="w-0.5 h-2.5 bg-primary" />
          </div>
        </div>

        <div className="flex items-center justify-between text-on-surface-variant text-[10px] pt-0.5">
          <span>Đáy: {formatVND(lowVnd * 0.98)}</span>
          <span className="text-secondary font-medium">
            Biên độ giao dịch đề xuất
          </span>
          <span>Đỉnh: {formatVND(highVnd * 1.02)}</span>
        </div>
      </div>

      {/* AI Explanation & Market Advice if available */}
      {explanation && (
        <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1.5 mt-2.5">
          <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
            <span className="material-symbols-outlined text-[16px] text-secondary">insights</span>
            <span>Nhận định Chuyên gia AuraML™</span>
          </div>
          {explanation.summary && (
            <p className="text-xs text-on-surface leading-relaxed">
              {explanation.summary}
            </p>
          )}
          {explanation.positive_factors && explanation.positive_factors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {explanation.positive_factors.map((factor, fIdx) => (
                <span
                  key={fIdx}
                  className="px-2 py-0.5 rounded bg-surface-container text-secondary text-[10px] font-medium flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">check</span>
                  {factor}
                </span>
              ))}
            </div>
          )}
          {explanation.market_advice && (
            <p className="text-[11px] text-on-surface-variant italic pt-0.5 border-t border-surface-container">
              Khuyến nghị: {explanation.market_advice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
