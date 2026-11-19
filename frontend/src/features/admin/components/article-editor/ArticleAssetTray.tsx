'use client';

import React from 'react';
import {
  Upload,
  Image as ImageIcon,
  Plus,
  Star,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';

interface ArticleAssetTrayProps {
  uploadedImages: string[];
  uploading: boolean;
  formThumbnail: string;
  copiedLink: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onInsertImage: (url: string) => void;
  onSetThumbnail: (url: string) => void;
  onCopyUrl: (url: string) => void;
  onRemoveImage: (index: number) => void;
}

export function ArticleAssetTray({
  uploadedImages,
  uploading,
  formThumbnail,
  copiedLink,
  fileInputRef,
  onInsertImage,
  onSetThumbnail,
  onCopyUrl,
  onRemoveImage,
}: ArticleAssetTrayProps) {
  return (
    <div className="p-5 rounded-2xl bg-secondary-container/10 border border-secondary/25 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-secondary text-white flex items-center justify-center">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-primary flex items-center gap-2">
              <span>Khay ảnh bài viết ({uploadedImages.length} ảnh)</span>
              {uploading && (
                <span className="inline-flex items-center gap-1 text-xs text-secondary font-normal animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  Đang tải ảnh lên Cloudinary...
                </span>
              )}
            </div>
            <p className="text-xs text-outline">
              Tải nhiều ảnh từ máy tính để chèn xen kẽ vào các đoạn văn hoặc chọn làm ảnh bìa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/90 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Tải nhiều ảnh lên</span>
          </button>
        </div>
      </div>

      {/* Image Tray Preview */}
      {uploadedImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          {uploadedImages.map((url, idx) => {
            const isCover = formThumbnail === url;
            return (
              <div
                key={idx}
                className={`group relative rounded-xl overflow-hidden border transition-all ${
                  isCover
                    ? 'border-secondary ring-2 ring-secondary/30 shadow-md bg-secondary/5'
                    : 'border-surface-container-high bg-surface-container-lowest hover:border-secondary/60'
                }`}
              >
                <div className="aspect-video w-full overflow-hidden bg-surface-container">
                  <img
                    src={url}
                    alt={`Ảnh ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Badge is Cover */}
                {isCover && (
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-secondary text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Ảnh bìa</span>
                  </div>
                )}

                {/* Actions on Image */}
                <div className="p-1.5 flex items-center justify-between gap-1 text-[11px] bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => onInsertImage(url)}
                    title="Chèn ảnh này vào bài viết"
                    className="flex-1 py-1 px-1.5 rounded-lg bg-secondary-container/60 hover:bg-secondary text-primary hover:text-white font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10px]"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Chèn</span>
                  </button>

                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => onSetThumbnail(url)}
                      title="Đặt làm ảnh bìa"
                      className="p-1 rounded-lg text-outline hover:text-secondary hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onCopyUrl(url)}
                    title="Sao chép link ảnh"
                    className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    {copiedLink === url ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    title="Xóa khỏi khay"
                    className="p-1 rounded-lg text-outline hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="py-8 px-4 rounded-xl border-2 border-dashed border-secondary/40 hover:border-secondary bg-surface-container-lowest/60 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-primary">
            Kéo thả hoặc nhấn vào đây để tải nhiều ảnh cùng lúc
          </p>
          <p className="text-[11px] text-outline mt-0.5">
            Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 25MB/ảnh)
          </p>
        </div>
      )}
    </div>
  );
}

