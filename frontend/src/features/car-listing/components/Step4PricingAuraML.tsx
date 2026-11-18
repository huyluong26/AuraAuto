'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TradeOptionsState } from '../types';
import { formatVND } from '@/lib/api';
import { ValuationResponse } from '@/types';

interface Step4PricingAuraMLProps {
  priceVnd: string;
  onPriceChange: (val: string) => void;
  tradeOptions: TradeOptionsState;
  onToggleTradeOption: (key: keyof TradeOptionsState) => void;
  aiLoading: boolean;
  aiPriceSuggestion: number | null;
  aiIntervalLow?: number | null;
  aiIntervalHigh?: number | null;
  aiConfidence?: string | null;
  aiEstimateNote: string | null;
  aiError: string | null;
  aiValuationResult?: ValuationResponse | null;
  onGetAIEstimate: () => void;
  onApplyAiPrice?: (price: number) => void;
  error?: string;
  onPrev: () => void;
  onNext: () => void;
}

export function Step4PricingAuraML({
  priceVnd,
  onPriceChange,
  tradeOptions,
  onToggleTradeOption,
  aiLoading,
  aiPriceSuggestion,
  aiIntervalLow,
  aiIntervalHigh,
  aiConfidence,
  aiEstimateNote,
  aiError,
  aiValuationResult,
  onGetAIEstimate,
  onApplyAiPrice,
  error,
  onPrev,
  onNext,
}: Step4PricingAuraMLProps) {
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const numericPrice = parseInt(priceVnd.replace(/\D/g, ''), 10) || 0;

  // Handle strictly numeric input
  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      onPriceChange('');
      return;
    }
    const num = parseInt(raw, 10);
    onPriceChange(num.toLocaleString('vi-VN'));
  };

  // Helper apply price with toast notification
  const handleApply = (amount: number, label: string) => {
    if (onApplyAiPrice) {
      onApplyAiPrice(amount);
    } else {
      onPriceChange(amount.toLocaleString('vi-VN'));
    }
    setAppliedNotice(`Đã áp dụng ${label}: ${amount.toLocaleString('vi-VN')} ₫ vào ô giá bán!`);
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  const hasDetailedAnalysis = Boolean(
    aiValuationResult &&
      (aiValuationResult.explanation ||
        (aiValuationResult.breakdown_items && aiValuationResult.breakdown_items.length > 0))
  );

  return (
    <section className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-sm border border-[#e8e6e1] space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e8e6e1] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#f4ede2] text-[#8c6d3b] text-xs uppercase tracking-wider font-semibold border border-[#d8c5a2]/60">
            <span>Bước 04 / 05</span>
          </div>
          <h2 className="text-xl sm:text-2xl text-[#111827] font-bold tracking-tight font-headline">
            Định giá mong muốn &amp; Phân tích thị trường AI
          </h2>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            Đặt mức giá niêm yết của bạn và tham khảo khuyến nghị từ Trợ lý Định giá Thông minh AuraML kết hợp Gemini AI.
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#faf9f6] border border-[#e8e6e1] flex items-center justify-center text-[#8c6d3b] shrink-0">
          <span className="material-symbols-outlined text-[28px]">query_stats</span>
        </div>
      </div>

      {/* Thông báo đã áp dụng giá nhanh */}
      {appliedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* KHU VỰC 1: HAI CỘT ĐỐI ỨNG CÂN BẰNG (SELLER PRICE vs AI BENCHMARK) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* CỘT TRÁI (6 COLS): Ô NHẬP GIÁ MONG MUỐN & TÙY CHỌN */}
        <div className="lg:col-span-6 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#fcfbf9] border border-[#e8e6e1] shadow-2xs space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#111827] font-semibold text-sm font-headline pb-1 border-b border-[#f0eee9]">
              <span className="material-symbols-outlined text-[#8c6d3b] text-[20px]">payments</span>
              <span>Mức giá chuyển nhượng của bạn</span>
            </div>

            {/* Ô nhập giá số tiền TO, RÕ RÀNG */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#374151]" htmlFor="car-price">
                Mức giá niêm yết (VNĐ) <span className="text-rose-600">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="car-price"
                  type="text"
                  inputMode="numeric"
                  required
                  value={priceVnd}
                  onChange={handlePriceInput}
                  placeholder="VD: 850.000.000"
                  className={`w-full h-15 pl-4 pr-12 rounded-xl bg-white text-[#111827] text-2xl sm:text-3xl font-extrabold font-headline tracking-tight focus:outline-none focus:ring-2 focus:ring-[#8c6d3b]/30 focus:border-[#8c6d3b] transition-all ${
                    error ? 'border-2 border-rose-500 ring-1 ring-rose-500' : 'border border-[#d8d6d0]'
                  }`}
                />
                <span className="absolute right-4 text-2xl font-bold text-[#8c6d3b] font-headline pointer-events-none">
                  ₫
                </span>
              </div>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

              {/* Hiển thị số tiền bằng chữ */}
              {numericPrice > 0 ? (
                <div className="p-3 rounded-lg bg-white border border-[#e8e6e1] space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#888] uppercase tracking-wider block">
                    Số tiền bằng chữ:
                  </span>
                  <span className="text-sm sm:text-base text-[#8c6d3b] font-bold font-headline block leading-snug">
                    {formatVND(numericPrice)}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-[#888] italic">
                  Nhập số tiền chuyển nhượng hoặc bấm nút &ldquo;Áp dụng mức giá này&rdquo; từ gợi ý AI.
                </p>
              )}
            </div>

            {/* Tùy chọn giao dịch */}
            <div className="p-3.5 rounded-xl bg-white border border-[#e8e6e1] space-y-2.5">
              <span className="text-xs font-semibold text-[#374151] block">Tùy chọn đàm phán &amp; giao lưu:</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tradeOptions.negotiable}
                    onChange={() => onToggleTradeOption('negotiable')}
                    className="w-4 h-4 rounded text-[#111827] accent-[#111827] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#4b5563]">
                    Có thương lượng bớt lộc nhẹ cho người mua thiện chí
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tradeOptions.tradeSuv}
                    onChange={() => onToggleTradeOption('tradeSuv')}
                    className="w-4 h-4 rounded text-[#111827] accent-[#111827] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#4b5563]">
                    Sẵn sàng giao lưu bù trừ với dòng xe SUV / Crossover
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Mẹo định giá */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#faf9f6] border border-[#e8e6e1] text-[11.5px] text-[#6b7280]">
            <span className="material-symbols-outlined text-[#8c6d3b] text-[18px] shrink-0 mt-0.5">
              lightbulb
            </span>
            <p className="leading-relaxed">
              <strong className="text-[#374151]">Kinh nghiệm bán nhanh:</strong> Định giá sát khoảng giá thị trường giúp tin xe của bạn nhận được lượng tương tác thực tế cao gấp 3 lần và chốt giao dịch trong tuần đầu tiên.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI (6 COLS): TRỢ LÝ HỎI AI ĐỊNH GIÁ & KHOẢNG GIÁ ĐỀ XUẤT */}
        <div className="lg:col-span-6 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white via-[#faf9f6] to-[#f5f2eb] border border-[#d8c5a2] shadow-2xs space-y-4">
          <div className="space-y-3.5">
            {/* Card Header & Nút Hỏi AI */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e8e6e1]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f4ede2] text-[#8c6d3b] flex items-center justify-center shrink-0 border border-[#d8c5a2]/60">
                  <span className="material-symbols-outlined text-[19px]">smart_toy</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827] font-headline">
                    Trợ Lý Định Giá AuraML &amp; Gemini
                  </h3>
                  <span className="text-[10px] text-[#6b7280] block">
                    CatBoost ML &bull; 11.700+ tin thị trường thực tế
                  </span>
                </div>
              </div>

              {/* Nút Hỏi AI định giá */}
              <button
                type="button"
                onClick={onGetAIEstimate}
                disabled={aiLoading}
                className="px-3.5 py-2 rounded-lg bg-[#0f172a] hover:bg-black text-white border border-[#1e293b] text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 self-start sm:self-auto active:scale-[0.98]"
              >
                {aiLoading ? (
                  <span className="material-symbols-outlined text-[15px] animate-spin text-[#e5c78a]">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[15px] text-[#e5c78a]">auto_awesome</span>
                )}
                <span>{aiLoading ? 'Đang phân tích...' : aiPriceSuggestion ? 'Định giá lại' : 'Hỏi AI định giá xe này'}</span>
              </button>
            </div>

            {/* Lỗi AI nếu có */}
            {aiError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2 border border-rose-200">
                <span className="material-symbols-outlined text-[17px] shrink-0 text-rose-600">info</span>
                <span>{aiError}</span>
              </div>
            )}

            {/* KẾT QUẢ ĐỊNH GIÁ AI */}
            {aiPriceSuggestion && aiPriceSuggestion > 0 ? (
              <div className="space-y-3.5 animate-in fade-in duration-300">
                {/* Box 1: Mức giá AI đề xuất TO RẤT NỔI BẬT + NÚT ÁP DỤNG */}
                <div className="p-4 rounded-xl bg-white border border-[#d8c5a2] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8c6d3b] uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-[#8c6d3b]">verified</span>
                      Giá AI đề xuất thị trường
                    </span>
                    {aiConfidence && (
                      <span className="px-2 py-0.5 rounded-md bg-[#faf8f4] border border-[#d8c5a2] text-[#8c6d3b] text-[10px] font-bold uppercase">
                        {aiConfidence === 'MEDIUM' ? 'Độ tin cậy cao' : 'Tham khảo mở rộng'}
                      </span>
                    )}
                  </div>

                  {/* SỐ TIỀN AI RẤT TO */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-headline tracking-tight">
                      {aiPriceSuggestion.toLocaleString('vi-VN')}{' '}
                      <span className="text-lg sm:text-xl font-bold text-[#8c6d3b]">₫</span>
                    </div>
                    <span className="text-xs font-semibold text-[#6b7280]">
                      ({formatVND(aiPriceSuggestion)})
                    </span>
                  </div>

                  {/* NÚT ÁP DỤNG NGAY */}
                  <button
                    type="button"
                    onClick={() => handleApply(aiPriceSuggestion, 'Giá AI đề xuất')}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#0f172a] hover:bg-black text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#e5c78a]">arrow_back</span>
                    <span>Áp dụng mức giá này vào tin đăng</span>
                  </button>
                </div>

                {/* Box 2: KHOẢNG GIÁ THỊ TRƯỜNG HỢP LÝ (MIN – MAX) */}
                {(aiIntervalLow || aiIntervalHigh) && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#e8e6e1] space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#8c6d3b]">tune</span>
                        Khoảng giá thị trường hợp lý
                      </span>
                      <span className="text-[10px] text-[#6b7280]">Biên độ chuẩn Conformal ML</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {aiIntervalLow && (
                        <div className="p-2.5 rounded-lg bg-[#faf9f6] border border-[#e8e6e1] text-left space-y-1">
                          <span className="text-[9.5px] font-semibold text-[#6b7280] uppercase block">
                            Mức sàn (Bán nhanh)
                          </span>
                          <div className="text-sm sm:text-base font-bold text-[#111827] font-headline truncate">
                            {aiIntervalLow.toLocaleString('vi-VN')} ₫
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApply(aiIntervalLow, 'Mức giá sàn')}
                            className="text-[11px] text-[#8c6d3b] hover:text-[#6e532b] hover:underline font-semibold block pt-0.5 cursor-pointer"
                          >
                            Chọn giá này →
                          </button>
                        </div>
                      )}

                      {aiIntervalHigh && (
                        <div className="p-2.5 rounded-lg bg-[#faf9f6] border border-[#e8e6e1] text-left space-y-1">
                          <span className="text-[9.5px] font-semibold text-[#6b7280] uppercase block">
                            Mức trần (Được giá)
                          </span>
                          <div className="text-sm sm:text-base font-bold text-[#111827] font-headline truncate">
                            {aiIntervalHigh.toLocaleString('vi-VN')} ₫
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApply(aiIntervalHigh, 'Mức giá trần')}
                            className="text-[11px] text-[#8c6d3b] hover:text-[#6e532b] hover:underline font-semibold block pt-0.5 cursor-pointer"
                          >
                            Chọn giá này →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Khi chưa có kết quả AI */
              <div className="p-6 rounded-xl bg-white border border-dashed border-[#d8c5a2] text-center space-y-2.5">
                <div className="w-11 h-11 mx-auto rounded-full bg-[#f4ede2] flex items-center justify-center text-[#8c6d3b]">
                  <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111827] font-headline">
                    Chưa có ước tính AI cho xe này
                  </h4>
                  <p className="text-xs text-[#6b7280] max-w-xs mx-auto leading-relaxed">
                    Bấm nút <strong>&ldquo;Hỏi AI định giá xe này&rdquo;</strong> ở trên để hệ thống quét dữ liệu và đưa ra mức giá đề xuất cùng khoảng giá thị trường chuẩn xác nhất.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ghi chú diễn giải AI */}
          {aiEstimateNote && (
            <p className="text-[11px] text-[#6b7280] leading-relaxed pt-1 border-t border-[#e8e6e1]/80">
              {aiEstimateNote}
            </p>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* KHU VỰC 2: HỒ SƠ PHÂN TÍCH CHUYÊN SÂU GEMINI AI & BÓC TÁCH KỸ THUẬT */}
      {/* HIỂN THỊ TRỌN VẸN FULL WIDTH VỚI BỐ CỤC 2 CỘT RỘNG RÃI */}
      {/* ======================================================== */}
      {hasDetailedAnalysis && (
        <div className="w-full rounded-2xl bg-white border border-[#e2dfd7] shadow-sm p-5 sm:p-7 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e8e6e1]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0f172a] text-[#e5c78a] flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">insights</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d3b] bg-[#f4ede2] px-2 py-0.5 rounded border border-[#d8c5a2]/60">
                    Báo cáo Thẩm định AI Chuyên Sâu
                  </span>
                  <span className="text-xs text-[#6b7280] hidden sm:inline">&bull; Đồng bộ dữ liệu xe thực tế</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-headline text-[#111827] mt-0.5">
                  Phân Tích Thị Trường Gemini AI &amp; Thẩm Định Kỹ Thuật AuraML™
                </h3>
              </div>
            </div>

            <div className="self-start sm:self-center shrink-0">
              {aiValuationResult?.pricing_method === 'ML_GEMINI_GROUNDED' ? (
                <span className="px-3 py-1 rounded-full bg-[#f4ede2] text-[#8c6d3b] text-xs font-bold border border-[#d8c5a2] flex items-center gap-1.5 shadow-2xs">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>Gemini Grounded Analysis</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-[#faf9f6] text-[#475569] text-xs font-semibold border border-[#d8d6d0]">
                  AuraML CatBoost Engine
                </span>
              )}
            </div>
          </div>

          {/* 2-Column Content Grid: Gemini AI on Left (7 cols) - Technical Breakdown on Right (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT A (7 COLS): NHẬN ĐỊNH CHUYÊN SÂU TỪ GEMINI AI */}
            <div className="lg:col-span-7 space-y-4">
              {aiValuationResult?.explanation ? (
                <div className="p-5 rounded-xl bg-[#faf9f6] border border-[#e8e6e1] space-y-4">
                  {/* Summary */}
                  <div>
                    <h4 className="font-bold text-[#111827] flex items-center gap-2 text-xs uppercase tracking-wide pb-1">
                      <span className="material-symbols-outlined text-[#8c6d3b] text-[18px]">trending_up</span>
                      <span>Nhận định tổng quan thị trường</span>
                    </h4>
                    {aiValuationResult.explanation.summary && (
                      <p className="mt-1.5 text-xs sm:text-[13px] text-[#334155] leading-relaxed">
                        {aiValuationResult.explanation.summary}
                      </p>
                    )}
                  </div>

                  {/* Positive Factors */}
                  {aiValuationResult.explanation.positive_factors &&
                    aiValuationResult.explanation.positive_factors.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-[#e8e6e1]">
                        <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                          <span>Điểm cộng giữ giá của xe bạn:</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {aiValuationResult.explanation.positive_factors.map((factor, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-medium flex items-center gap-1.5 border border-emerald-200/80 shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-emerald-600 text-[14px]">check</span>
                              <span>{factor}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Negative Factors */}
                  {aiValuationResult.explanation.negative_factors &&
                    aiValuationResult.explanation.negative_factors.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-[#e8e6e1]">
                        <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-amber-600">info</span>
                          <span>Yếu tố ảnh hưởng giảm giá cần lưu ý:</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {aiValuationResult.explanation.negative_factors.map((factor, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-3 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-medium flex items-center gap-1.5 border border-amber-200/80 shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-amber-600 text-[14px]">priority_high</span>
                              <span>{factor}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Market Advice Callout */}
                  {aiValuationResult.explanation.market_advice && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#fbf8f2] to-[#f7f3ea] border border-[#d8c5a2] flex items-start gap-2.5 text-xs text-[#4b5563]">
                      <span className="material-symbols-outlined text-[#8c6d3b] text-[18px] shrink-0 mt-0.5">
                        tips_and_updates
                      </span>
                      <div className="space-y-0.5">
                        <strong className="text-[#111827] font-semibold block">Khuyến nghị chốt giá từ Gemini:</strong>
                        <span className="text-[#334155] leading-relaxed">{aiValuationResult.explanation.market_advice}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[#faf9f6] border border-[#e8e6e1] text-xs text-[#6b7280]">
                  Không có phân tích bổ sung cho mẫu xe này.
                </div>
              )}
            </div>

            {/* CỘT B (5 COLS): BÓC TÁCH THẨM ĐỊNH THEO HỒ SƠ KỸ THUẬT (BƯỚC 2) */}
            <div className="lg:col-span-5 space-y-4">
              {aiValuationResult?.breakdown_items && aiValuationResult.breakdown_items.length > 0 ? (
                <div className="p-5 rounded-xl bg-[#faf9f6] border border-[#e8e6e1] flex flex-col justify-between space-y-3.5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#e8e6e1]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#8c6d3b]">verified_user</span>
                        <span className="text-xs sm:text-sm font-bold text-[#111827]">
                          Bóc Tách Thẩm Định Kỹ Thuật (Bước 2)
                        </span>
                      </div>
                      {aiValuationResult.base_price_vnd && (
                        <span className="text-[11px] text-[#6b7280]">
                          Giá xe chuẩn zin:{' '}
                          <strong className="text-[#111827] font-mono">{formatVND(aiValuationResult.base_price_vnd)}</strong>
                        </span>
                      )}
                    </div>

                    <div className="divide-y divide-[#ece9e2] text-xs">
                      {aiValuationResult.breakdown_items.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-[#111827] flex items-center gap-1.5">
                              {item.impact === 'GIẢM' && (
                                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              )}
                              {item.impact === 'TĂNG' && (
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              )}
                              {item.impact === 'NGUYÊN BẢN' && (
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                              )}
                              <span>{item.label}</span>
                            </div>
                            <p className="text-[11px] text-[#6b7280] pl-3.5 leading-relaxed">{item.note}</p>
                          </div>

                          <div className="text-right shrink-0">
                            {item.impact === 'GIẢM' ? (
                              <span className="px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold font-mono text-[11px] border border-rose-200 inline-block">
                                {item.amount_vnd !== 0 ? formatVND(item.amount_vnd) : `${item.percentage}%`}
                              </span>
                            ) : item.impact === 'TĂNG' ? (
                              <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold font-mono text-[11px] border border-emerald-200 inline-block">
                                +{item.amount_vnd !== 0 ? formatVND(item.amount_vnd) : `+${item.percentage}%`}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded bg-white text-[#6b7280] font-medium font-mono text-[11px] border border-[#d8d6d0] inline-block">
                                0 ₫ (Chuẩn zin)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {aiValuationResult.total_condition_adjustment_vnd !== undefined &&
                    aiValuationResult.total_condition_adjustment_vnd !== 0 && (
                      <div className="pt-3 border-t border-[#e8e6e1] flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#6b7280]">Tổng điều chỉnh kỹ thuật xe:</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            aiValuationResult.total_condition_adjustment_vnd < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {aiValuationResult.total_condition_adjustment_vnd > 0 ? '+' : ''}
                          {formatVND(aiValuationResult.total_condition_adjustment_vnd)}
                        </span>
                      </div>
                    )}
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[#faf9f6] border border-[#e8e6e1] text-xs text-[#6b7280]">
                  Chưa có bóc tách điều chỉnh kỹ thuật cho hồ sơ xe này.
                </div>
              )}
            </div>
          </div>

          {/* Xe tương tự đang giao dịch trên sàn nếu có */}
          {aiValuationResult?.similar_listings && aiValuationResult.similar_listings.length > 0 && (
            <div className="pt-4 border-t border-[#e8e6e1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#8c6d3b]">directions_car</span>
                  <span>Tin xe tương tự đang giao dịch trên AuraAuto</span>
                </span>
                <span className="text-[11px] text-[#6b7280]">Dữ liệu tham khảo trực tiếp</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiValuationResult.similar_listings.slice(0, 3).map((car) => (
                  <Link
                    key={car.id}
                    href={`/xe/${car.id}`}
                    target="_blank"
                    className="p-3 rounded-xl bg-[#faf9f6] hover:bg-white border border-[#e8e6e1] hover:border-[#8c6d3b]/50 transition-all flex items-center gap-3 group shadow-2xs"
                  >
                    {car.primary_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={car.primary_image_url}
                        alt={car.title}
                        className="w-14 h-11 rounded-lg object-cover bg-neutral-100 shrink-0 border border-[#e8e6e1]"
                      />
                    ) : (
                      <div className="w-14 h-11 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-neutral-400 text-[18px]">directions_car</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-semibold text-[#111827] truncate group-hover:text-[#8c6d3b] transition-colors">
                        {car.title}
                      </h5>
                      <div className="text-[11px] font-bold text-[#8c6d3b] font-headline mt-0.5">
                        {formatVND(car.price_vnd)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* FOOTER ACTIONS */}
      {/* ======================================================== */}
      <div className="pt-6 border-t border-[#e8e6e1] flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onPrev}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-[#334155] hover:text-[#0f172a] text-xs font-semibold hover:bg-[#faf9f6] border border-[#d8d6d0] transition-colors cursor-pointer active:scale-[0.99]"
        >
          ← Quay lại
        </button>
        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#0f172a] hover:bg-black text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>Tiếp tục: Xem trước tin đăng</span>
          <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
