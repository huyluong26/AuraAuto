'use client';

import React, { useState, useRef } from 'react';
import { PhotoSlotKey, SlotPhotoState } from '../types';
import { GUIDED_PHOTO_SLOTS, PHOTO_CATEGORIES } from '../constants';

interface Step3GuidedPhotoUploaderProps {
  slotPhotos: Record<PhotoSlotKey, SlotPhotoState | null>;
  onSlotPhotoUpload: (key: PhotoSlotKey, file: File) => void;
  onRemoveSlotPhoto: (key: PhotoSlotKey) => void;
  extraPhotos: SlotPhotoState[];
  onExtraPhotosUpload: (files: File[]) => void;
  onRemoveExtraPhoto: (index: number) => void;
  error?: string;
  onPrev: () => void;
  onNext: () => void;
}

export function Step3GuidedPhotoUploader({
  slotPhotos,
  onSlotPhotoUpload,
  onRemoveSlotPhoto,
  extraPhotos,
  onExtraPhotosUpload,
  onRemoveExtraPhoto,
  error,
  onPrev,
  onNext,
}: Step3GuidedPhotoUploaderProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const extraFileInputRef = useRef<HTMLInputElement>(null);

  const filteredSlots = GUIDED_PHOTO_SLOTS.filter((slot) => {
    if (activeTab === 'all') return true;
    return slot.category === activeTab;
  });

  const filledSlotCount = Object.values(slotPhotos).filter(Boolean).length;
  const progressPercent = Math.min(100, Math.round((filledSlotCount / 5) * 100));

  const handleExtraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onExtraPhotosUpload(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <section className="bg-surface-container-lowest p-6 sm:p-8 lg:p-10 rounded-2xl shadow-sm border border-surface-container-high/60 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/70 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-label-sm text-xs uppercase tracking-wider font-semibold">
            <span>Bước 03 / 05</span>
          </div>
          <h2 className="font-headline-md text-xl sm:text-2xl text-primary font-bold tracking-tight">
            Hình ảnh thực tế của xe
          </h2>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
            Tải ảnh thực tế xe vào các ô góc chụp dưới đây. Xe có hình ảnh rõ ràng luôn được người mua ưu tiên liên hệ.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-primary px-3 py-1.5 rounded-xl bg-surface-container font-semibold border border-surface-container-high">
            Đã tải: <strong>{filledSlotCount}</strong> / 8 góc
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 rounded-xl bg-surface-container-low/60 border border-surface-container-high/60 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
            <span>Tiến độ hoàn thiện hình ảnh: {progressPercent}%</span>
          </span>
          <span className="text-outline">
            {filledSlotCount >= 3 ? 'Đủ điều kiện xuất bản tin' : 'Tối thiểu 3 góc chính để duyệt tin'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 border border-error/30">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-surface-container-high/60">
        {PHOTO_CATEGORIES.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 8 Guided Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {filteredSlots.map((slot) => {
          const photo = slotPhotos[slot.key];
          const inputId = `slot-input-${slot.key}`;

          return (
            <div
              key={slot.key}
              className={`relative flex flex-col rounded-2xl border overflow-hidden group transition-all ${
                slot.isPrimary && !photo
                  ? 'border-secondary/70 bg-secondary-container/10 ring-1 ring-secondary/30'
                  : 'border-surface-container-high bg-surface hover:border-secondary'
              }`}
            >
              {photo ? (
                // Slot is filled
                <div className="relative aspect-[4/3] bg-surface-container overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt={slot.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent pointer-events-none" />

                  <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                    {slot.label}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemoveSlotPhoto(slot.key)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/75 hover:bg-error text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ) : (
                // Slot is empty with guidance
                <label
                  htmlFor={inputId}
                  className="p-4 flex flex-col justify-between aspect-[4/3] cursor-pointer hover:bg-surface-container-low transition-colors text-center"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-surface-container-low border border-surface-container-high text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">{slot.icon}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 pt-1">
                      <h4 className="text-xs font-bold text-primary">
                        {slot.label}
                      </h4>
                      {slot.isPrimary && <span className="text-error font-bold">*</span>}
                    </div>
                    <p className="text-[11px] text-outline leading-tight max-w-[210px] mx-auto pt-0.5 line-clamp-2">
                      {slot.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high text-xs font-semibold text-primary hover:border-secondary transition-colors">
                      <span className="material-symbols-outlined text-[15px] text-secondary">
                        add_a_photo
                      </span>
                      <span>Tải ảnh</span>
                    </span>
                  </div>

                  <input
                    id={inputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onSlotPhotoUpload(slot.key, e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* Extra Photos Section */}
      <div className="pt-4 space-y-4 border-t border-surface-container-high/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-primary">
              Tải thêm ảnh chi tiết khác ({extraPhotos.length} ảnh)
            </h4>
            <p className="text-xs text-outline">
              Bạn có thể tải thêm ảnh la-zăng bánh xe, cốp sau, chìa khóa thông minh, sổ bảo hành, phụ kiện...
            </p>
          </div>

          <button
            type="button"
            onClick={() => extraFileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high text-xs font-semibold text-primary flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">add</span>
            <span>Thêm ảnh tự do</span>
          </button>
          <input
            ref={extraFileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleExtraFileChange}
            className="hidden"
          />
        </div>

        {extraPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
            {extraPhotos.map((photo, index) => (
              <div
                key={index}
                className="relative aspect-[4/3] rounded-xl overflow-hidden border border-surface-container-high group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt={`Ảnh bổ sung ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveExtraPhoto(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 hover:bg-error text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
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
          <span>Tiếp tục: Định giá bán xe</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
