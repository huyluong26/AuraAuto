'use client';

import React from 'react';
import { Upload, Plus, Trash2, Check, RotateCcw } from 'lucide-react';
import { GUIDED_PHOTO_SLOTS } from '@/features/car-listing/constants';

interface GuidedPhotoSlotGridProps {
  totalPhotosCount: number;
  slotPhotos: Record<string, { file: File; previewUrl: string } | null>;
  extraPhotos: { file: File; previewUrl: string }[];
  batchFileInputRef: React.RefObject<HTMLInputElement | null>;
  extraFileInputRef: React.RefObject<HTMLInputElement | null>;
  slotInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onBatchUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSlotPhotoUpload: (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSlotPhoto: (slotKey: string) => void;
  onAddExtraPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveExtraPhoto: (index: number) => void;
}

export function GuidedPhotoSlotGrid({
  totalPhotosCount,
  slotPhotos,
  extraPhotos,
  batchFileInputRef,
  extraFileInputRef,
  slotInputRefs,
  onBatchUpload,
  onSlotPhotoUpload,
  onRemoveSlotPhoto,
  onAddExtraPhotos,
  onRemoveExtraPhoto,
}: GuidedPhotoSlotGridProps) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eae8e3] pb-2.5">
        <div>
          <label className="block text-xs font-bold text-[#1a1c1a]">
            3. Khung nhãn hình ảnh xe ({totalPhotosCount} ảnh đã chọn) <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-[#777]">
            Tải ảnh vào các khung nhãn góc chụp tiêu chuẩn dưới đây để tin đăng chuyên nghiệp và thu hút người mua nhất
          </p>
        </div>

        {/* Batch Upload Button */}
        <div className="shrink-0">
          <input
            ref={batchFileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={onBatchUpload}
          />
          <button
            type="button"
            onClick={() => batchFileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl border border-[#b89b72] bg-[#b89b72]/10 hover:bg-[#b89b72]/20 text-[#725a37] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Chọn nhiều ảnh cùng lúc, hệ thống sẽ tự động điền vào các khung nhãn"
          >
            <Upload className="w-3.5 h-3.5 text-[#b89b72]" />
            <span>Tải nhanh nhiều ảnh</span>
          </button>
        </div>
      </div>

      {/* 8 Guided Slot Frames Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {GUIDED_PHOTO_SLOTS.map((slot) => {
          const photo = slotPhotos[slot.key];
          return (
            <div
              key={slot.key}
              className={`relative rounded-2xl overflow-hidden transition-all ${
                photo
                  ? 'border border-[#eae8e3] bg-black shadow-2xs group'
                  : slot.isPrimary
                  ? 'border-2 border-dashed border-[#b89b72] bg-[#faf9f6] hover:bg-[#f4f3f0] ring-1 ring-[#b89b72]/20'
                  : 'border-2 border-dashed border-[#eae8e3] hover:border-[#b89b72] bg-[#faf9f6] hover:bg-[#f4f3f0]'
              }`}
            >
              {/* Hidden input for this specific slot */}
              <input
                ref={(el) => {
                  slotInputRefs.current[slot.key] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onSlotPhotoUpload(slot.key, e)}
              />

              {photo ? (
                /* Filled Slot */
                <div className="relative aspect-[4/3] w-full">
                  <img
                    src={photo.previewUrl}
                    alt={slot.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                    {slot.isPrimary && (
                      <span className="px-1.5 py-0.5 rounded-md bg-secondary text-on-secondary text-[9px] font-bold shadow-2xs">
                        Ảnh bìa
                      </span>
                    )}
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </div>

                  {/* Bottom Label Badge */}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5">
                    <span className="block text-[10px] font-semibold text-white bg-black/65 px-1.5 py-0.5 rounded backdrop-blur-xs truncate text-center">
                      {slot.label}
                    </span>
                  </div>

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    <button
                      type="button"
                      onClick={() => slotInputRefs.current[slot.key]?.click()}
                      className="px-2 py-1 rounded-lg bg-white/90 hover:bg-white text-[#1a1c1a] text-[10px] font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                      title="Thay đổi ảnh cho góc này"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Đổi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveSlotPhoto(slot.key)}
                      className="p-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow-sm transition-colors cursor-pointer"
                      title="Xóa ảnh góc này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Guided Slot */
                <div
                  onClick={() => slotInputRefs.current[slot.key]?.click()}
                  className="aspect-[4/3] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-xl bg-white border border-[#eae8e3] text-[#725a37] flex items-center justify-center mb-1 shadow-2xs group-hover:border-[#b89b72]">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      {slot.icon}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-[#1a1c1a] leading-tight block truncate max-w-full px-1">
                    {slot.label}
                  </span>

                  {slot.isPrimary ? (
                    <span className="mt-0.5 text-[9px] font-bold text-red-600">
                      * Bắt buộc (Ảnh bìa)
                    </span>
                  ) : (
                    <span className="mt-0.5 text-[9px] text-[#888] line-clamp-1">
                      Bấm để tải ảnh
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Extra Photos Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-[#555]">Ảnh chi tiết bổ sung khác (tùy chọn)</span>
          <input
            ref={extraFileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={onAddExtraPhotos}
          />
          <button
            type="button"
            onClick={() => extraFileInputRef.current?.click()}
            className="text-[11px] text-[#b89b72] hover:text-[#977b52] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ảnh bổ sung ({extraPhotos.length}/10)</span>
          </button>
        </div>

        {extraPhotos.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {extraPhotos.map((item, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-[#eae8e3] group bg-[#f4f3f0]"
              >
                <img src={item.previewUrl} alt={`Ảnh bổ sung ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-[9px] font-medium text-white bg-black/60 px-1 py-0.2 rounded truncate max-w-[85%]">
                  Bổ sung {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveExtraPhoto(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Xóa ảnh này"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

