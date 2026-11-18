'use client';

import React from 'react';
import {
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Plus,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';

interface ValuationPhotoScannerProps {
  uploadedFiles: File[];
  uploadedPreviews: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragOver: boolean;
  setIsDragOver: (val: boolean) => void;
  aiScanLoading: boolean;
  aiScanSuccess: string | null;
  setAiScanSuccess: (val: string | null) => void;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
  onClearAllPhotos: () => void;
  onRescanFirstPhoto: () => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ValuationPhotoScanner: React.FC<ValuationPhotoScannerProps> = ({
  uploadedFiles,
  uploadedPreviews,
  fileInputRef,
  isDragOver,
  setIsDragOver,
  aiScanLoading,
  aiScanSuccess,
  setAiScanSuccess,
  onAddPhotos,
  onRemovePhoto,
  onClearAllPhotos,
  onRescanFirstPhoto,
  onFileInputChange,
}) => {
  return (
    <div className="w-full rounded-3xl border border-[#eae8e3] bg-gradient-to-br from-surface-container-lowest via-surface to-secondary-container/10 p-5 sm:p-7 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eae8e3]">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-[#b89b72]/15 text-[#b89b72] flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-display text-sm sm:text-base text-[#1a1c1a]">
                Tải ảnh nhận diện xe
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                Tùy chọn
              </span>
            </div>
            <p className="text-xs text-[#777] mt-0.5">
              AI Vision quét ảnh để tự điền các thông số bên dưới, hoặc bạn có thể bỏ qua và nhập trực tiếp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#777]">
          <Sparkles className="w-4 h-4 text-[#b89b72] shrink-0" />
          <span>Không bắt buộc có ảnh</span>
        </div>
      </div>

      {/* Hidden Input File */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* Scanning & Success State Notifications */}
      {aiScanLoading ? (
        <div className="p-4 rounded-2xl bg-white border border-[#b89b72]/50 text-center space-y-2 animate-pulse shadow-xs">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#1a1c1a]">
            <Loader2 className="w-4 h-4 animate-spin text-[#b89b72]" />
            <span>AI Vision đang nhận diện ảnh và trích xuất thông số xe...</span>
          </div>
          <p className="text-[11px] text-[#777]">
            Hãng xe, dòng xe, kiểu dáng, màu sơn và năm sản xuất sẽ được tự động điền vào form bên dưới.
          </p>
        </div>
      ) : aiScanSuccess ? (
        <div className="p-3.5 rounded-2xl bg-secondary-container/50 border border-secondary/30 text-on-secondary-container text-xs flex items-center justify-between gap-2 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-semibold text-xs">{aiScanSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiScanSuccess(null)}
            className="text-secondary hover:text-on-secondary-fixed cursor-pointer font-bold px-1 text-sm"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Upload Dropzone & Gallery */}
      {uploadedFiles.length === 0 ? (
        /* Empty Dropzone */
        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files) onAddPhotos(Array.from(e.dataTransfer.files));
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center transition-all ${
            isDragOver
              ? 'border-[#b89b72] bg-[#b89b72]/10 shadow-md'
              : 'border-[#eae8e3] hover:border-[#b89b72]/60 bg-white hover:bg-[#faf9f6]'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-[#b89b72]/15 text-[#b89b72] flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1a1c1a]">
                  Kéo thả ảnh vào đây hoặc bấm để chọn ảnh xe (Tùy chọn)
                </h4>
                <p className="text-[11px] text-[#777] mt-0.5">
                  Hỗ trợ tối đa 8 ảnh thực tế (đầu xe, đuôi xe, mặt taplo ODO, nội thất...). Định dạng JPG, PNG, WEBP.
                </p>
              </div>
            </div>

            <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1a1c1a] hover:bg-[#b89b72] text-white text-xs font-bold transition-colors shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#b89b72]" />
              <span>Chọn ảnh từ thiết bị</span>
            </span>
          </div>
        </div>
      ) : (
        /* Uploaded Photos Gallery */
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {uploadedPreviews.map((previewUrl, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-[#eae8e3] group bg-[#f4f3f0]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt={`Ảnh xe ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold">
                    Ảnh bìa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemovePhoto(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Xóa ảnh này"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add More Button */}
            {uploadedFiles.length < 8 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-[#eae8e3] hover:border-[#b89b72] flex flex-col items-center justify-center text-[#888] hover:text-[#b89b72] transition-colors cursor-pointer bg-white"
              >
                <Plus className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold">Thêm ảnh</span>
              </button>
            )}
          </div>

          {/* Gallery Control Bar */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onRescanFirstPhoto}
              disabled={aiScanLoading}
              className="text-xs text-[#b89b72] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Quét lại từ ảnh đại diện</span>
            </button>

            <button
              type="button"
              onClick={onClearAllPhotos}
              className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
            >
              Xóa tất cả ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
