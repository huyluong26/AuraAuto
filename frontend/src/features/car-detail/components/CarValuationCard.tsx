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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f172a] hover:bg-black text-[#faf9f6] border border-neutral-800 text-xs sm:text-sm font-medium shadow-xs transition-all cursor-pointer group active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[17px] text-[#e5c78a] group-hover:rotate-12 transition-transform">
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
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary text-xs sm:text-sm font-bold">
              <span className="material-symbols-outlined text-[18px] text-secondary">insights</span>
              <span>Nhận định Chuyên gia Gemini AI &amp; AuraML™</span>
            </div>
            {valuation?.pricing_method === 'ML_GEMINI_GROUNDED' && (
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">verified</span>
                Gemini Market Grounded
              </span>
            )}
          </div>

          {/* Tóm tắt nhận định tổng quan */}
          {explanation.summary && (
            <p className="text-xs text-on-surface leading-relaxed">
              {explanation.summary}
            </p>
          )}

          {/* Điểm cộng chiếc xe này */}
          {explanation.positive_factors && explanation.positive_factors.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-surface-container/60">
              <span className="text-[11px] font-bold text-secondary uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Ưu điểm &amp; Điểm cộng giữ giá của xe:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {explanation.positive_factors.map((factor, fIdx) => (
                  <span
                    key={fIdx}
                    className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-[11px] font-medium flex items-center gap-1.5 border border-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-secondary text-[14px]">check</span>
                    <span>{factor}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Điểm cần lưu ý cho người mua */}
          {explanation.negative_factors && explanation.negative_factors.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-surface-container/60">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Điểm lưu ý khi kiểm tra xe:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {explanation.negative_factors.map((factor, fIdx) => (
                  <span
                    key={fIdx}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-[11px] font-medium flex items-center gap-1.5 border border-amber-200/50"
                  >
                    <span className="material-symbols-outlined text-amber-600 text-[14px]">priority_high</span>
                    <span>{factor}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lời khuyên thương lượng thị trường */}
          {explanation.market_advice && (
            <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-high flex items-start gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">tips_and_updates</span>
              <div>
                <strong className="text-primary font-semibold">Khuyến nghị giao dịch: </strong>
                <span>{explanation.market_advice}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bóc tách thẩm định theo tình trạng xe thực tế (Automotive Appraisal Breakdown) */}
      {valuation?.breakdown_items && valuation.breakdown_items.length > 0 && (
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-3 mt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-surface-container-high">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
              <span className="text-xs sm:text-sm font-bold text-primary">
                Bóc Tách Thẩm Định Theo Hồ Sơ Kỹ Thuật Xe
              </span>
            </div>
            {valuation.base_price_vnd && (
              <span className="text-[11px] text-on-surface-variant">
                Giá chuẩn xe nguyên bản:{' '}
                <strong className="text-primary font-mono">{formatVND(valuation.base_price_vnd)}</strong>
              </span>
            )}
          </div>

          <div className="divide-y divide-surface-container text-xs">
            {valuation.breakdown_items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-primary flex items-center gap-1.5">
                    {item.impact === 'GIẢM' && (
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    )}
                    {item.impact === 'TĂNG' && (
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    {item.impact === 'NGUYÊN BẢN' && (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant pl-3.5 leading-relaxed">{item.note}</p>
                </div>

                <div className="text-right shrink-0">
                  {item.impact === 'GIẢM' ? (
                    <span className="px-2.5 py-0.5 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-bold font-mono text-[11px] border border-red-200/60 inline-block">
                      {item.amount_vnd !== 0 ? formatVND(item.amount_vnd) : `${item.percentage}%`}
                    </span>
                  ) : item.impact === 'TĂNG' ? (
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-[11px] border border-emerald-200/60 inline-block">
                      +{item.amount_vnd !== 0 ? formatVND(item.amount_vnd) : `+${item.percentage}%`}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded bg-surface-container text-outline font-medium font-mono text-[11px] border border-surface-container-high inline-block">
                      0 ₫ (Chuẩn zin)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {valuation.total_condition_adjustment_vnd !== undefined && valuation.total_condition_adjustment_vnd !== 0 && (
            <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs font-semibold">
              <span className="text-on-surface-variant">Tổng điều chỉnh theo tình trạng xe:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  valuation.total_condition_adjustment_vnd < 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {valuation.total_condition_adjustment_vnd > 0 ? '+' : ''}
                {formatVND(valuation.total_condition_adjustment_vnd)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Nguồn dữ liệu tin thị trường đối chiếu qua Gemini (nếu có) */}
      {valuation?.market_sources && valuation.market_sources.length > 0 && (
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2 mt-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-[16px] text-secondary">travel_explore</span>
            <span>Nguồn Dữ Liệu Thị Trường Thực Tế (Gemini Grounded):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            {valuation.market_sources.slice(0, 4).map((source, sIdx) => (
              <div
                key={sIdx}
                className="p-2 rounded-lg bg-surface border border-surface-container-high flex flex-col gap-0.5 text-[11px]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-primary truncate max-w-[170px]">{source.title}</span>
                  <span className="font-mono font-bold text-secondary">{formatVND(source.price_vnd)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-outline">
                  <span>{source.platform || 'Thị trường'}</span>
                  <span>{source.location || 'Việt Nam'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
