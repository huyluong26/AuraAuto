'use client';

import React, { useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Calendar,
  Gauge,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ValuationResponse } from '@/types';
import { formatVND, formatKm } from '@/lib/api';

interface ValuationResultDossierProps {
  result: ValuationResponse;
  brand: string;
  model: string;
  variant: string;
  year: string;
  odometerKm: string;
  bodyType: string;
  transmission: string;
  color: string;
  origin: string;
  uploadedFilesCount: number;
  onOpenResultModal: () => void;
  onOpenQuickModal: () => void;
  onOpenFullPost: () => void;
}

function formatVietnameseTextPrice(vnd: number | null | undefined): string {
  if (!vnd) return '---';
  if (vnd >= 1_000_000_000) {
    const bil = vnd / 1_000_000_000;
    return `${bil % 1 === 0 ? bil : bil.toFixed(2).replace(/\.?0+$/, '')} tỷ VNĐ`;
  }
  const mil = Math.round(vnd / 1_000_000);
  return `${mil} triệu VNĐ`;
}

export const ValuationResultDossier: React.FC<ValuationResultDossierProps> = ({
  result,
  brand,
  model,
  variant,
  year,
  odometerKm,
  bodyType,
  transmission,
  color,
  origin,
  uploadedFilesCount,
  onOpenResultModal,
  onOpenQuickModal,
  onOpenFullPost,
}) => {
  const usageStats = useMemo(() => {
    const yNum = Number(year) || 2022;
    const odoNum = Number(odometerKm) || 40000;
    const age = Math.max(1, 2026 - yNum);
    const avgKmPerYear = Math.round(odoNum / age);
    let intensityLabel = 'Sử dụng tiêu chuẩn gia đình';

    if (avgKmPerYear < 10000) {
      intensityLabel = 'Xe đi rất ít, bảo quản tốt (Xe lướt)';
    } else if (avgKmPerYear > 22000) {
      intensityLabel = 'Tần suất di chuyển cao / Chạy đường dài';
    }

    return { age, avgKmPerYear, intensityLabel };
  }, [year, odometerKm]);

  return (
    <div
      id="valuation-results-section"
      className="w-full rounded-3xl border border-[#eae8e3] bg-[#faf9f6] p-6 sm:p-8 lg:p-10 space-y-6 animate-in fade-in duration-300 shadow-sm"
    >
      {/* Header result vehicle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eae8e3] pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#b89b72] block">
            Kết quả định giá thị trường xe
          </span>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1a1c1a] mt-0.5">
            {brand} {model} {variant ? `• ${variant}` : ''} ({year})
          </h3>
          <p className="text-xs text-[#777] mt-0.5">
            {bodyType} • Hộp số {transmission} • {odometerKm ? formatKm(Number(odometerKm)) : ''} • Màu{' '}
            {color || 'tiêu chuẩn'}
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenResultModal}
            className="px-4 py-2.5 rounded-xl border border-[#b89b72] bg-[#b89b72]/10 hover:bg-[#b89b72]/20 text-xs font-semibold text-[#725a37] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#b89b72]" />
            <span>Xem lại Modal kết quả</span>
          </button>

          <button
            type="button"
            onClick={onOpenQuickModal}
            className="px-5 py-2.5 rounded-xl bg-[#1a1c1a] hover:bg-[#b89b72] text-white font-bold text-xs transition-colors shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#b89b72]" />
            <span>Đăng tin bán xe với giá này</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenFullPost}
            className="px-4 py-2.5 rounded-xl border border-[#eae8e3] bg-white hover:bg-[#f4f3f0] text-xs font-semibold text-[#555] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Mở trình đăng tin chi tiết</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Result: Price Boxes & Spectrum */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Price Box */}
          <div className="p-6 rounded-2xl bg-white border border-[#eae8e3] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#777] uppercase tracking-wider">
                Giá giao dịch tham khảo hợp lý
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-secondary-container text-on-secondary-container text-[11px] font-bold border border-secondary/20">
                Mức giá đề xuất tốt nhất
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold text-[#1a1c1a] font-mono tracking-tight">
              {formatVND(result.estimated_price_vnd)}
            </div>

            <div className="text-xs font-semibold text-[#b89b72]">
              Tương đương khoảng ~ {formatVietnameseTextPrice(result.estimated_price_vnd)}
            </div>
          </div>

          {/* Conformal Range Bar (Visual Spectrum) */}
          <div className="p-5 rounded-2xl bg-white border border-[#eae8e3] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1a1c1a]">Khoảng giá mua bán phổ biến</span>
              <span className="text-[10px] text-[#777]">Theo tình trạng xe thực tế</span>
            </div>

            {/* Range Bar */}
            <div className="relative pt-1">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-secondary-fixed via-secondary to-primary shadow-inner" />
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#444] mt-2">
                <div className="text-left">
                  <span className="text-[10px] font-normal text-[#888] block">Giá bán nhanh</span>
                  <span>{formatVietnameseTextPrice(result.interval_low_vnd)}</span>
                </div>
                <div className="text-center text-secondary">
                  <span className="text-[10px] font-normal text-secondary block">Giá hợp lý</span>
                  <span>{formatVietnameseTextPrice(result.estimated_price_vnd)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-normal text-[#888] block">Xe đẹp / lướt</span>
                  <span>{formatVietnameseTextPrice(result.interval_high_vnd)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Usage & Market Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white border border-[#eae8e3] space-y-0.5">
              <span className="text-[10px] font-semibold text-[#777] uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#b89b72]" />
                <span>Tuổi xe</span>
              </span>
              <div className="text-base font-bold text-[#1a1c1a] font-mono">
                {usageStats.age} năm
              </div>
              <div className="text-[10px] text-[#888]">Năm {year}</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#eae8e3] space-y-0.5">
              <span className="text-[10px] font-semibold text-[#777] uppercase flex items-center gap-1">
                <Gauge className="w-3 h-3 text-[#b89b72]" />
                <span>Tình trạng ODO</span>
              </span>
              <div className="text-base font-bold text-[#1a1c1a] font-mono">
                {usageStats.avgKmPerYear.toLocaleString('vi-VN')} km/năm
              </div>
              <div className="text-[10px] text-secondary truncate font-medium">
                {usageStats.avgKmPerYear < 12000 ? 'Xe đi ít, giữ gìn' : 'Đi lại gia đình'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#eae8e3] space-y-0.5">
              <span className="text-[10px] font-semibold text-[#777] uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#b89b72]" />
                <span>Thanh khoản</span>
              </span>
              <div className="text-base font-bold text-[#1a1c1a]">
                {['toyota', 'honda', 'mazda', 'hyundai', 'kia'].includes(brand.toLowerCase())
                  ? 'Dễ bán'
                  : 'Phổ biến'}
              </div>
              <div className="text-[10px] text-[#888]">Nhu cầu thị trường</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#eae8e3] space-y-0.5">
              <span className="text-[10px] font-semibold text-[#777] uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#b89b72]" />
                <span>Xuất xứ</span>
              </span>
              <div className="text-base font-bold text-secondary truncate">
                {origin || 'Tiêu chuẩn'}
              </div>
              <div className="text-[10px] text-[#888]">Hộp số {transmission || 'Tiêu chuẩn'}</div>
            </div>
          </div>

          {/* Bóc tách thẩm định theo tình trạng xe thực tế */}
          {result.breakdown_items && result.breakdown_items.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-[#eae8e3] space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#eae8e3]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#b89b72]" />
                  <span className="font-bold text-sm text-[#1a1c1a]">
                    Bóc Tách Thẩm Định Kỹ Thuật Thực Tế
                  </span>
                </div>
                {result.base_price_vnd && (
                  <span className="text-xs text-[#666]">
                    Giá xe nguyên bản chuẩn:{' '}
                    <strong className="text-[#1a1c1a] font-mono">
                      {formatVND(result.base_price_vnd)}
                    </strong>
                  </span>
                )}
              </div>

              <div className="divide-y divide-[#f0eee9] text-xs">
                {result.breakdown_items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#1a1c1a] flex items-center gap-1.5">
                        {item.impact === 'GIẢM' && (
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        )}
                        {item.impact === 'TĂNG' && (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        {item.impact === 'NGUYÊN BẢN' && (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        )}
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] text-[#777] leading-relaxed pl-3.5">{item.note}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {item.impact === 'GIẢM' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-bold font-mono text-xs border border-red-200 inline-block">
                          {item.amount_vnd !== 0 ? formatVND(item.amount_vnd) : `${item.percentage}%`}
                        </span>
                      ) : item.impact === 'TĂNG' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold font-mono text-xs border border-emerald-200 inline-block">
                          +{item.amount_vnd !== 0 ? formatVND(item.amount_vnd) : `+${item.percentage}%`}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 font-medium font-mono text-xs border border-slate-200 inline-block">
                          0 ₫ (Chuẩn zin)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result.total_condition_adjustment_vnd !== undefined && result.total_condition_adjustment_vnd !== 0 && (
                <div className="pt-2.5 border-t border-[#eae8e3] flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#666]">Tổng điều chỉnh theo tình trạng xe:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      result.total_condition_adjustment_vnd < 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {result.total_condition_adjustment_vnd > 0 ? '+' : ''}
                    {formatVND(result.total_condition_adjustment_vnd)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Result: Quick Action Card & Market Advice */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Posting Callout Card */}
          <div className="p-5 rounded-2xl bg-[#1a1c1a] text-white space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#b89b72]">
              <Sparkles className="w-4 h-4 text-[#b89b72]" />
              <span>Sẵn sàng kết nối người mua thực tế</span>
            </div>
            <h4 className="font-display font-bold text-lg leading-snug">
              Đăng tin bán ngay với mức giá {formatVND(result.estimated_price_vnd)}
            </h4>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Toàn bộ thông số kỹ thuật xe
              {uploadedFilesCount > 0 ? ` và ${uploadedFilesCount} ảnh đã tải` : ''} đã được chuẩn bị
              sẵn. Bạn chỉ cần bổ sung địa chỉ và xác nhận để đăng bán.
            </p>
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onOpenQuickModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#b89b72] hover:bg-[#a68a63] text-[#1a1c1a] font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Bổ sung thông tin &amp; Đăng ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AI Explanation / Market Advice */}
          {result.explanation && (
            <div className="p-4 rounded-xl bg-white border border-[#eae8e3] text-xs space-y-3">
              <div>
                <h4 className="font-bold text-[#1a1c1a] flex items-center gap-1.5 text-xs">
                  <TrendingUp className="w-4 h-4 text-[#b89b72]" />
                  <span>Đánh giá tổng quan về xe:</span>
                </h4>
                <p className="mt-1 text-[#444] leading-relaxed">{result.explanation.summary}</p>
              </div>

              {result.explanation.positive_factors?.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-[#f0eee9]">
                  <span className="font-semibold text-secondary text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                    <span>Điểm cộng của xe:</span>
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-[#666] text-[11px]">
                    {result.explanation.positive_factors.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.explanation.market_advice && (
                <p className="pt-2 border-t border-[#f0eee9] text-[11px] italic text-[#777]">
                  💡 Lời khuyên: {result.explanation.market_advice}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
