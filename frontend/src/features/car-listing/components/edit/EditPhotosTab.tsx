'use client';

import React from 'react';
import { EditableMedia, PHOTO_LABEL_OPTIONS } from '../../hooks/useEditListingForm';

interface EditPhotosTabProps {
  mediaList: EditableMedia[];
  uploadingPhotos: boolean;
  onUploadPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeletePhoto: (index: number) => void;
  onSetPrimary: (index: number) => void;
  onUpdateLabel: (index: number, newLabel: string) => void;
}

export function EditPhotosTab({
  mediaList,
  uploadingPhotos,
  onUploadPhotos,
  onDeletePhoto,
  onSetPrimary,
  onUpdateLabel,
}: EditPhotosTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high">
        <div>
          <p className="text-xs font-bold text-primary">Danh sách ảnh xe ({mediaList.length} ảnh)</p>
          <p className="text-[11px] text-on-surface-variant">
            Mỗi ảnh có thể gắn nhãn góc chụp để tăng tính chuyên nghiệp và minh bạch khi thẩm định.
          </p>
        </div>

        <label className="px-3.5 py-2 rounded-xl bg-primary hover:bg-inverse-surface text-on-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
          <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
          <span>{uploadingPhotos ? 'Đang tải lên...' : 'Tải thêm ảnh mới'}</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadPhotos}
            disabled={uploadingPhotos}
            className="hidden"
          />
        </label>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaList.map((m, idx) => (
          <div
            key={idx}
            className={`rounded-2xl overflow-hidden border p-2.5 flex flex-col gap-2 transition-all ${
              m.is_primary
                ? 'border-secondary bg-secondary-fixed/20 ring-1 ring-secondary/30'
                : 'border-surface-container-high bg-surface-container-low'
            }`}
          >
            {/* Thumbnail Viewport */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-surface-container">
              <img src={m.url} alt={`Ảnh #${idx + 1}`} className="w-full h-full object-cover" />
              {m.is_primary && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-secondary text-on-secondary text-[10px] font-bold shadow-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">star</span>
                  <span>Ảnh bìa</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => onDeletePhoto(idx)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-error text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Xóa ảnh này"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
              </button>
            </div>

            {/* Label Selector */}
            <div className="space-y-1">
              <span className="text-[10px] text-outline font-semibold block">Nhãn góc chụp:</span>
              <select
                value={m.label || ''}
                onChange={(e) => onUpdateLabel(idx, e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-[11px] text-primary focus:border-secondary outline-none font-medium"
              >
                {PHOTO_LABEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Set primary action */}
            {!m.is_primary && (
              <button
                type="button"
                onClick={() => onSetPrimary(idx)}
                className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-secondary hover:bg-secondary/10 transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">star_border</span>
                <span>Đặt làm ảnh đại diện</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

