'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  MapPin,
  Loader2,
  Sparkles,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { formatVND } from '@/lib/api';
import { VehicleHistoryState } from '@/features/car-listing/types';
import { LOCATION_GROUPS } from '@/features/car-listing/constants';
import {
  normalizeAccidentStatus,
  normalizeFloodStatus,
  normalizeServiceHistory,
  normalizeIntCount,
  normalizeBodyType,
  normalizeFuelType,
  normalizeTransmission,
} from '@/features/car-listing/utils/normalizers';
import { useQuickListingForm } from '../hooks/useQuickListingForm';
import { QuickListingSuccessView } from './quick-listing/QuickListingSuccessView';
import { GuidedPhotoSlotGrid } from './quick-listing/GuidedPhotoSlotGrid';
import { ValuationPriceSummaryBanner } from './quick-listing/ValuationPriceSummaryBanner';

import { QuickListingData } from '../types';

export type { QuickListingData };

export {
  normalizeAccidentStatus,
  normalizeFloodStatus,
  normalizeServiceHistory,
  normalizeIntCount,
  normalizeBodyType,
  normalizeFuelType,
  normalizeTransmission,
};

interface QuickListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: QuickListingData;
  initialFiles: File[];
  onAddFiles?: (files: File[]) => void;
}

export function QuickListingModal({
  isOpen,
  onClose,
  initialData,
  initialFiles,
}: QuickListingModalProps) {
  const {
    isLoggedIn,
    sellerType,
    showroomName,
    provinceCode,
    setProvinceCode,
    locationAddress,
    handleAddressChange,
    isOwner,
    setIsOwner,
    maintenanceHistory,
    setMaintenanceHistory,
    noAccidentFlood,
    setNoAccidentFlood,
    readyInspection,
    setReadyInspection,
    priceVnd,
    setPriceVnd,
    title,
    setTitle,
    description,
    setDescription,
    slotPhotos,
    extraPhotos,
    batchFileInputRef,
    extraFileInputRef,
    slotInputRefs,
    submitting,
    submitStatusText,
    errorMessage,
    createdListingId,
    totalPhotosCount,
    handleSlotPhotoUpload,
    handleRemoveSlotPhoto,
    handleBatchUpload,
    handleAddExtraPhotos,
    handleRemoveExtraPhoto,
    handleSubmit,
  } = useQuickListingForm({
    isOpen,
    initialData,
    initialFiles,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#eae8e3] text-[#1a1c1a]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 sm:p-6 border-b border-[#eae8e3] bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#b89b72]/15 text-[#b89b72] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-base sm:text-lg text-[#1a1c1a]">
                Bổ Sung Thông Tin Để Đăng Bán Ngay
              </h3>
              <p className="text-[11px] text-[#777]">
                Thông số kỹ thuật xe từ phần định giá đã được tự động điền sẵn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#777] hover:text-[#1a1c1a] hover:bg-[#f4f3f0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {createdListingId ? (
          <QuickListingSuccessView
            createdListingId={createdListingId}
            title={title}
            priceVnd={priceVnd}
            initialData={initialData}
            locationAddress={locationAddress}
            totalPhotosCount={totalPhotosCount}
            onClose={onClose}
          />
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
            {/* Login Warning Banner if not logged in */}
            {!isLoggedIn && (
              <div className="p-4 rounded-xl bg-secondary-container/50 border border-secondary/30 text-on-secondary-container text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-secondary shrink-0" />
                  <span>Bạn chưa đăng nhập. Vui lòng đăng nhập để xuất bản tin xe.</span>
                </div>
                <Link
                  href="/dang-nhap?redirect=/dinh-gia-ai"
                  className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-on-secondary-fixed text-on-secondary font-semibold text-[11px] shrink-0 flex items-center gap-1 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </Link>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pre-filled Specs Summary Badge & Commitments */}
            <ValuationPriceSummaryBanner
              initialData={initialData}
              sellerType={sellerType}
              showroomName={showroomName}
              isOwner={isOwner}
              setIsOwner={setIsOwner}
              maintenanceHistory={maintenanceHistory}
              setMaintenanceHistory={setMaintenanceHistory}
              noAccidentFlood={noAccidentFlood}
              setNoAccidentFlood={setNoAccidentFlood}
              readyInspection={readyInspection}
              setReadyInspection={setReadyInspection}
              priceVnd={priceVnd}
              setPriceVnd={setPriceVnd}
            />

            {/* Section 1: Location & Specific Address */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#1a1c1a]">
                1. Khu vực &amp; Địa chỉ xem xe thực tế <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">
                    Tỉnh / Thành phố *
                  </label>
                  <select
                    value={provinceCode}
                    onChange={(e) => setProvinceCode(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[#eae8e3] text-xs focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none bg-white font-medium"
                  >
                    {LOCATION_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            {opt.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">
                    Địa chỉ chi tiết nơi xem xe *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#b89b72] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={locationAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="VD: Số 18 đường Phạm Hùng, Mỹ Đình, Nam Từ Liêm"
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-[#eae8e3] text-xs focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Guided Photo Slots & Extra Photos */}
            <GuidedPhotoSlotGrid
              totalPhotosCount={totalPhotosCount}
              slotPhotos={slotPhotos}
              extraPhotos={extraPhotos}
              batchFileInputRef={batchFileInputRef}
              extraFileInputRef={extraFileInputRef}
              slotInputRefs={slotInputRefs}
              onBatchUpload={handleBatchUpload}
              onSlotPhotoUpload={handleSlotPhotoUpload}
              onRemoveSlotPhoto={handleRemoveSlotPhoto}
              onAddExtraPhotos={handleAddExtraPhotos}
              onRemoveExtraPhoto={handleRemoveExtraPhoto}
            />

            {/* Section 5: Price */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1a1c1a]">
                4. Giá bán niêm yết <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  step="1000000"
                  value={priceVnd}
                  onChange={(e) => setPriceVnd(Number(e.target.value))}
                  className="w-full h-11 pl-4 pr-16 rounded-xl border border-[#eae8e3] text-sm font-mono font-bold focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#888]">
                  VNĐ
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-[#888] text-[11px]">Mức giá AI định giá:</span>
                <button
                  type="button"
                  onClick={() => setPriceVnd(initialData.estimatedPriceVnd)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    priceVnd === initialData.estimatedPriceVnd
                      ? 'bg-secondary text-on-secondary shadow-xs'
                      : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'
                  }`}
                >
                  Giá đề xuất: {formatVND(initialData.estimatedPriceVnd)}
                </button>
                {initialData.lowPriceVnd && (
                  <button
                    type="button"
                    onClick={() => setPriceVnd(initialData.lowPriceVnd!)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      priceVnd === initialData.lowPriceVnd
                        ? 'bg-secondary text-on-secondary shadow-xs'
                        : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'
                    }`}
                  >
                    Bán nhanh: {formatVND(initialData.lowPriceVnd)}
                  </button>
                )}
              </div>
            </div>

            {/* Section 6: Title & Description */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1a1c1a]">
                  5. Tiêu đề tin đăng bán xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#eae8e3] text-xs sm:text-sm focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1a1c1a]">
                  Mô tả chi tiết tình trạng xe
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#eae8e3] text-xs focus:border-[#b89b72] focus:ring-2 focus:ring-[#b89b72]/20 outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-3 border-t border-[#eae8e3] flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#eae8e3] hover:bg-[#f4f3f0] text-xs font-semibold text-[#555] transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={submitting || !isLoggedIn}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1a1c1a] hover:bg-[#b89b72] text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#b89b72]" />
                    <span>{submitStatusText || 'Đang xuất bản tin...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#b89b72]" />
                    <span>Xác nhận xuất bản tin bán xe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
