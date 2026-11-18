'use client';

import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Calendar,
  Gauge,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Check,
  Car,
} from 'lucide-react';
import { formatVND, formatKm } from '@/lib/api';
import { ValuationResponse } from '@/types';

function formatVietnameseTextPrice(vnd: number | null | undefined): string {
  if (!vnd) return '---';
  if (vnd >= 1_000_000_000) {
    const bil = vnd / 1_000_000_000;
    return `${bil % 1 === 0 ? bil : bil.toFixed(2).replace(/\.?0+$/, '')} tỷ VNĐ`;
  }
  const mil = Math.round(vnd / 1_000_000);
  return `${mil} triệu VNĐ`;
}

export interface ValuationVehicleSummary {
  brand: string;
  model: string;
  variant?: string;
  year: number | string;
  odometerKm?: number | string;
  bodyType?: string;
  transmission?: string;
  fuelType?: string;
  color?: string;
  origin?: string;
  condition?: string;
}

interface ValuationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ValuationResponse | null;
  vehicle: ValuationVehicleSummary;
  onOpenQuickListing: () => void;
  onOpenFullListing: () => void;
  onRecalculate?: () => void;
}

export function ValuationResultModal({
  isOpen,
  onClose,
  result,
  vehicle,
  onOpenQuickListing,
  onOpenFullListing,
  onRecalculate,
}: ValuationResultModalProps) {
  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  // Calculate vehicle usage stats
  const currentYear = new Date().getFullYear();
  const carYear = Number(vehicle.year) || currentYear;
  const carAge = Math.max(1, currentYear - carYear);
  const totalKm = Number(vehicle.odometerKm) || 0;
  const avgKmPerYear = Math.round(totalKm / carAge);

  const isPopularBrand = ['toyota', 'honda', 'mazda', 'hyundai', 'kia'].includes(
    vehicle.brand.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#eae8e3] text-[#1a1c1a] flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="valuation-modal-title"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-5 sm:p-6 border-b border-[#eae8e3] bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#b89b72]/15 text-[#b89b72] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#725a37] bg-secondary-container/40 px-2 py-0.5 rounded-full border border-secondary/20">
                  AuraAuto AI Pricing
                </span>
                <span className="text-xs text-[#777] hidden sm:inline">• Thời gian thực</span>
              </div>
              <h2 id="valuation-modal-title" className="text-lg sm:text-xl font-bold font-display text-[#1a1c1a]">
                Kết Quả Định Giá Xe Thị Trường
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f4f3f0] hover:bg-[#eae8e3] text-[#666] hover:text-[#1a1c1a] flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* 1. Vehicle Info Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#faf9f6] border border-[#eae8e3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#b89b72]">
                <Car className="w-4 h-4" />
                <span>Phương tiện định giá</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1a1c1a] mt-0.5">
                {vehicle.brand} {vehicle.model} {vehicle.variant ? `• ${vehicle.variant}` : ''} ({vehicle.year})
              </h3>
              <p className="text-xs text-[#666] mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                {vehicle.bodyType && <span>Kiểu dáng: {vehicle.bodyType}</span>}
                {vehicle.transmission && <span>• Hộp số: {vehicle.transmission}</span>}
                {vehicle.odometerKm && <span>• ODO: {formatKm(Number(vehicle.odometerKm))}</span>}
                {vehicle.color && <span>• Màu: {vehicle.color}</span>}
              </p>
            </div>

            <div className="self-start sm:self-center shrink-0">
              <span className="px-3 py-1 rounded-xl bg-white border border-[#eae8e3] text-xs font-semibold text-[#1a1c1a] shadow-2xs">
                Mô hình định giá AI Conformal
              </span>
            </div>
          </div>

          {/* 2. Main Price Highlight Card */}
          <div className="p-6 rounded-2xl bg-white border-2 border-[#b89b72]/40 shadow-xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#b89b72]/5 rounded-bl-full pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#777] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#b89b72]" />
                <span>Giá giao dịch tham khảo hợp lý</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary-container/60 text-secondary text-xs font-bold border border-secondary/25">
                Mức giá đề xuất tốt nhất
              </span>
            </div>

            <div className="text-3xl sm:text-5xl font-extrabold text-[#1a1c1a] font-mono tracking-tight">
              {formatVND(result.estimated_price_vnd)}
            </div>

            <div className="text-xs sm:text-sm font-semibold text-[#725a37] flex items-center gap-2">
              <span>Tương đương khoảng ~</span>
              <span className="px-2 py-0.5 rounded-md bg-[#faf9f6] border border-[#eae8e3] font-bold text-[#1a1c1a]">
                {formatVietnameseTextPrice(result.estimated_price_vnd)}
              </span>
            </div>
          </div>

          {/* 3. Conformal Range Bar (Visual Spectrum) */}
          <div className="p-5 rounded-2xl bg-[#faf9f6] border border-[#eae8e3] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1a1c1a]">Khoảng giá mua bán phổ biến thị trường</span>
              <span className="text-[11px] text-[#777]">Theo tình trạng thực tế của xe</span>
            </div>

            {/* Range Bar Graphic */}
            <div className="relative pt-1">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#d1b993] via-[#725a37] to-[#1a1c1a] shadow-inner" />
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#444] mt-2.5">
                <div className="text-left">
                  <span className="text-[10px] font-normal text-[#888] block">Giá bán nhanh</span>
                  <span className="text-[#1a1c1a]">{formatVietnameseTextPrice(result.interval_low_vnd)}</span>
                </div>
                <div className="text-center text-secondary">
                  <span className="text-[10px] font-bold text-secondary block">Giá hợp lý</span>
                  <span className="text-secondary font-extrabold">{formatVietnameseTextPrice(result.estimated_price_vnd)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-normal text-[#888] block">Xe đẹp / lướt</span>
                  <span className="text-[#1a1c1a]">{formatVietnameseTextPrice(result.interval_high_vnd)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3.5 Bóc tách thẩm định theo tình trạng xe thực tế */}
          {result.breakdown_items && result.breakdown_items.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-[#eae8e3] shadow-xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#eae8e3]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#b89b72]" />
                  <span className="font-bold text-sm text-[#1a1c1a]">
                    Bóc Tách Thẩm Định Theo Tình Trạng Kỹ Thuật
                  </span>
                </div>
                {result.base_price_vnd && (
                  <span className="text-xs text-[#666]">
                    Giá xe nguyên bản chuẩn thị trường:{' '}
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
                  <span className={`font-mono font-bold text-sm ${
                    result.total_condition_adjustment_vnd < 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {result.total_condition_adjustment_vnd > 0 ? '+' : ''}
                    {formatVND(result.total_condition_adjustment_vnd)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. Four Usage & Market Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-[#eae8e3] space-y-1">
              <span className="text-[10px] font-bold text-[#777] uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#b89b72]" />
                <span>Tuổi xe</span>
              </span>
              <div className="text-base font-bold text-[#1a1c1a] font-mono">
                {carAge} năm
              </div>
              <div className="text-[11px] text-[#888]">Năm sản xuất {vehicle.year}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#eae8e3] space-y-1">
              <span className="text-[10px] font-bold text-[#777] uppercase flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-[#b89b72]" />
                <span>Tần suất ODO</span>
              </span>
              <div className="text-base font-bold text-[#1a1c1a] font-mono">
                {avgKmPerYear.toLocaleString('vi-VN')} km/năm
              </div>
              <div className="text-[11px] text-secondary font-medium truncate">
                {avgKmPerYear < 12000 ? 'Xe đi ít, giữ gìn' : 'Đi lại tiêu chuẩn'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#eae8e3] space-y-1">
              <span className="text-[10px] font-bold text-[#777] uppercase flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#b89b72]" />
                <span>Thanh khoản</span>
              </span>
              <div className="text-base font-bold text-[#1a1c1a]">
                {isPopularBrand ? 'Dễ bán nhanh' : 'Thanh khoản tốt'}
              </div>
              <div className="text-[11px] text-[#888]">Nhu cầu thị trường</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#eae8e3] space-y-1">
              <span className="text-[10px] font-bold text-[#777] uppercase flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#b89b72]" />
                <span>Xuất xứ & Hộp số</span>
              </span>
              <div className="text-base font-bold text-[#1a1c1a] truncate">
                {vehicle.origin || 'Tiêu chuẩn'}
              </div>
              <div className="text-[11px] text-[#888] truncate">
                {vehicle.transmission || 'Tự động'}
              </div>
            </div>
          </div>

          {/* 5. AI Explanation & Market Advice */}
          {result.explanation && (
            <div className="p-5 rounded-2xl bg-[#faf9f6] border border-[#eae8e3] text-xs space-y-3.5">
              <div>
                <h4 className="font-bold text-[#1a1c1a] flex items-center gap-2 text-xs uppercase tracking-wide">
                  <TrendingUp className="w-4 h-4 text-[#b89b72]" />
                  <span>Đánh giá tổng quan từ AI:</span>
                </h4>
                <p className="mt-1.5 text-[#444] leading-relaxed text-xs">
                  {result.explanation.summary}
                </p>
              </div>

              {result.explanation.positive_factors && result.explanation.positive_factors.length > 0 && (
                <div className="space-y-1.5 pt-2.5 border-t border-[#eae8e3]">
                  <span className="font-bold text-secondary text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                    <span>Điểm cộng giữ giá của xe:</span>
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-[#555] text-xs">
                    {result.explanation.positive_factors.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.explanation.market_advice && (
                <div className="pt-2.5 border-t border-[#eae8e3] text-xs text-[#666] flex items-start gap-1.5">
                  <span className="text-base leading-none">💡</span>
                  <span className="italic leading-relaxed">{result.explanation.market_advice}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Actions Footer Inside Modal Dialog */}
        <div className="sticky bottom-0 z-20 p-4 sm:p-6 border-t border-[#eae8e3] bg-white/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={onRecalculate || onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#eae8e3] bg-white hover:bg-[#faf9f6] text-xs font-semibold text-[#555] transition-colors flex items-center justify-center gap-1.5 cursor-pointer order-3 sm:order-1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#888]" />
            <span>Định giá xe khác</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onOpenFullListing}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#eae8e3] bg-white hover:bg-[#f4f3f0] text-xs font-semibold text-[#1a1c1a] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Trình đăng tin đầy đủ</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#777]" />
            </button>

            <button
              type="button"
              onClick={onOpenQuickListing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1a1c1a] hover:bg-[#b89b72] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-[#b89b72] group-hover:text-white transition-colors" />
              <span>Đăng tin bán xe với giá này</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
