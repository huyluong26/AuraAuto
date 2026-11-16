'use client';

import React, { useState } from 'react';
import { TradeOptionsState } from '../types';
import { formatVND } from '@/lib/api';

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

  return (
    <section className="bg-surface-container-lowest p-6 sm:p-8 lg:p-10 rounded-2xl shadow-sm border border-surface-container-high/60 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-container-high/70 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-label-sm text-xs uppercase tracking-wider font-semibold">
            <span>Bước 04 / 05</span>
          </div>
          <h2 className="font-headline-md text-xl sm:text-2xl text-primary font-bold tracking-tight">
            Định giá mong muốn &amp; Phân tích thị trường AI
          </h2>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
            Bạn có thể tự đặt mức giá mong muốn ở cột bên trái, hoặc bấm hỏi Trợ lý AI ở cột bên phải để nhận định giá chuẩn xác.
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-center text-secondary shrink-0">
          <span className="material-symbols-outlined text-[28px]">query_stats</span>
        </div>
      </div>

      {/* Thông báo đã áp dụng giá nhanh */}
      {appliedNotice && (
        <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* BỐ CỤC 2 CỘT SONG SONG (SIDE-BY-SIDE): CỘT TRÁI ĐẶT GIÁ - CỘT PHẢI HỎI AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI (6 COLS): Ô NHẬP GIÁ MONG MUỐN & TÙY CHỌN */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm font-display pb-1">
            <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
            <span>Mức giá chuyển nhượng của bạn</span>
          </div>

          {/* Ô nhập giá số tiền TO, RÕ RÀNG */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-primary" htmlFor="car-price">
              Mức giá mong muốn (VNĐ) <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="car-price"
                type="text"
                inputMode="numeric"
                required
                value={priceVnd}
                onChange={handlePriceInput}
                placeholder="VD: 850000000"
                className={`w-full h-16 pl-5 pr-14 rounded-2xl bg-surface text-primary text-2xl sm:text-3xl font-extrabold font-display tracking-tight focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all ${
                  error ? 'border-2 border-error ring-1 ring-error' : 'border-2 border-surface-container-high'
                }`}
              />
              <span className="absolute right-5 text-2xl font-bold text-secondary font-display">
                ₫
              </span>
            </div>

            {error && <p className="text-xs text-error font-medium">{error}</p>}

            {/* Hiển thị số tiền bằng chữ TO, NỔI BẬT */}
            {numericPrice > 0 ? (
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-0.5">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">
                  Số tiền bằng chữ:
                </span>
                <span className="text-sm sm:text-base text-secondary font-bold font-display block leading-snug">
                  {formatVND(numericPrice)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-outline italic">
                Nhập số tiền chuyển nhượng hoặc bấm nút &ldquo;Áp dụng giá AI&rdquo; bên cạnh.
              </p>
            )}
          </div>

          {/* Tùy chọn giao dịch */}
          <div className="p-4 rounded-xl bg-surface-container-low/60 border border-surface-container-high/60 space-y-3">
            <span className="text-xs font-semibold text-primary block">Tùy chọn đàm phán &amp; giao lưu:</span>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tradeOptions.negotiable}
                  onChange={() => onToggleTradeOption('negotiable')}
                  className="w-4 h-4 rounded accent-secondary cursor-pointer"
                />
                <span className="text-xs font-medium text-primary">
                  Có thương lượng bớt lộc nhẹ cho người mua thiện chí
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tradeOptions.tradeSuv}
                  onChange={() => onToggleTradeOption('tradeSuv')}
                  className="w-4 h-4 rounded accent-secondary cursor-pointer"
                />
                <span className="text-xs font-medium text-primary">
                  Sẵn sàng giao lưu bù trừ với dòng xe SUV / Crossover
                </span>
              </label>
            </div>
          </div>

          {/* Mẹo định giá */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-surface-container-low/40 border border-surface-container-high/40 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
              lightbulb
            </span>
            <p className="leading-relaxed">
              <strong>Kinh nghiệm bán nhanh:</strong> Định giá sát khoảng giá thị trường giúp tin xe của bạn nhận được lượng tương tác thực tế cao gấp 3 lần và chốt giao dịch trong tuần đầu tiên.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI (6 COLS): TRỢ LÝ HỎI AI ĐỊNH GIÁ & KẾT QUẢ KHOẢNG GIÁ TO RÕ RÀNG */}
        <div className="lg:col-span-6 space-y-5 bg-gradient-to-br from-surface-container-low/70 via-surface-container-lowest to-surface-container-low/40 p-5 sm:p-6 rounded-2xl border border-secondary/30 shadow-sm">
          {/* Card Title & Button Hỏi AI */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary-container/60 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary font-display">
                  Định Giá AI AuraML
                </h3>
                <span className="text-[10px] text-outline block">
                  Thuật toán CatBoost ML &bull; 11.700+ tin thực tế
                </span>
              </div>
            </div>

            {/* Nút Hỏi AI định giá to, nổi bật */}
            <button
              type="button"
              onClick={onGetAIEstimate}
              disabled={aiLoading}
              className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-black transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 self-start sm:self-auto"
            >
              {aiLoading ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[16px] text-secondary-fixed">auto_awesome</span>
              )}
              <span>{aiLoading ? 'Đang phân tích...' : 'Hỏi AI định giá xe này'}</span>
            </button>
          </div>

          {/* Lỗi AI nếu có */}
          {aiError && (
            <div className="p-3.5 rounded-xl bg-error-container/80 text-on-error-container text-xs font-medium flex items-center gap-2 border border-error/30">
              <span className="material-symbols-outlined text-[18px] shrink-0">info</span>
              <span>{aiError}</span>
            </div>
          )}

          {/* KẾT QUẢ ĐỊNH GIÁ AI TO VÀ KHOẢNG GIÁ HỢP LÝ RÕ RÀNG */}
          {aiPriceSuggestion && aiPriceSuggestion > 0 ? (
            <div className="space-y-4 pt-1 animate-in fade-in duration-300">
              {/* Box 1: Mức giá AI đề xuất TO RẤT NỔI BẬT + NÚT ÁP DỤNG */}
              <div className="p-5 rounded-xl bg-surface-container-lowest border-2 border-secondary/40 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    Giá AI đề xuất thị trường
                  </span>
                  {aiConfidence && (
                    <span className="px-2 py-0.5 rounded-md bg-secondary/15 text-secondary text-[10px] font-bold uppercase">
                      {aiConfidence === 'MEDIUM' ? 'Độ tin cậy cao' : 'Tham khảo'}
                    </span>
                  )}
                </div>

                {/* SỐ TIỀN AI RẤT TO */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#b89b72] font-display tracking-tight">
                    {aiPriceSuggestion.toLocaleString('vi-VN')}{' '}
                    <span className="text-xl sm:text-2xl font-bold">₫</span>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    ({formatVND(aiPriceSuggestion)})
                  </span>
                </div>

                {/* NÚT ÁP DỤNG NGAY TO RÕ RÀNG */}
                <button
                  type="button"
                  onClick={() => handleApply(aiPriceSuggestion, 'Giá AI đề xuất')}
                  className="w-full py-2.5 px-4 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Áp dụng mức giá này vào tin đăng</span>
                </button>
              </div>

              {/* Box 2: KHOẢNG GIÁ THỊ TRƯỜNG HỢP LÝ (MIN – MAX) TO VÀ TRỰC QUAN */}
              {(aiIntervalLow || aiIntervalHigh) && (
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-secondary">tune</span>
                      Khoảng giá thị trường hợp lý
                    </span>
                    <span className="text-[10px] text-outline">Biên độ chuẩn ML</span>
                  </div>

                  {/* Thanh khoảng giá Min - Max dạng card to */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Cận dưới (Min - Bán nhanh) */}
                    {aiIntervalLow && (
                      <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high text-left space-y-1">
                        <span className="text-[10px] font-semibold text-outline uppercase block">
                          Mức sàn (Bán nhanh)
                        </span>
                        <div className="text-base sm:text-lg font-bold text-primary font-display truncate">
                          {aiIntervalLow.toLocaleString('vi-VN')} ₫
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApply(aiIntervalLow, 'Mức giá sàn')}
                          className="text-[11px] text-secondary hover:underline font-semibold block pt-0.5 cursor-pointer"
                        >
                          Chọn giá này →
                        </button>
                      </div>
                    )}

                    {/* Cận trên (Max - Được giá) */}
                    {aiIntervalHigh && (
                      <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high text-left space-y-1">
                        <span className="text-[10px] font-semibold text-outline uppercase block">
                          Mức trần (Được giá)
                        </span>
                        <div className="text-base sm:text-lg font-bold text-primary font-display truncate">
                          {aiIntervalHigh.toLocaleString('vi-VN')} ₫
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApply(aiIntervalHigh, 'Mức giá trần')}
                          className="text-[11px] text-secondary hover:underline font-semibold block pt-0.5 cursor-pointer"
                        >
                          Chọn giá này →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ghi chú diễn giải AI */}
              {aiEstimateNote && (
                <p className="text-[11px] text-on-surface-variant leading-relaxed px-1">
                  {aiEstimateNote}
                </p>
              )}
            </div>
          ) : (
            /* Khi chưa có kết quả AI: Hiển thị hướng dẫn trực quan */
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-dashed border-surface-container-high text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-semibold text-primary font-display">
                  Chưa có ước tính AI cho xe này
                </h4>
                <p className="text-xs text-outline max-w-xs mx-auto leading-relaxed">
                  Bấm nút <strong>&ldquo;Hỏi AI định giá xe này&rdquo;</strong> ở trên để hệ thống quét dữ liệu và đưa ra mức giá đề xuất cùng khoảng giá thị trường chuẩn xác nhất.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-surface-container-high/70 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onPrev}
          className="w-full sm:w-auto px-7 py-3 rounded-xl bg-surface text-primary text-xs font-semibold hover:bg-surface-container border border-surface-container-high transition-colors cursor-pointer"
        >
          ← Quay lại
        </button>
        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Tiếp tục: Xem trước tin đăng</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
