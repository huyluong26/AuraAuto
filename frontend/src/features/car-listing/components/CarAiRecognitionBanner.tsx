'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { CarRecognitionResponse } from '@/types';

interface CarAiRecognitionBannerProps {
  onApplyRecognition: (data: CarRecognitionResponse, file: File) => void;
  className?: string;
}

export function CarAiRecognitionBanner({
  onApplyRecognition,
  className = '',
}: CarAiRecognitionBannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<CarRecognitionResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn định dạng file hình ảnh (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Dung lượng ảnh tối đa 15MB.');
      return;
    }

    setError(null);
    setLoading(true);
    setRecognitionResult(null);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const data = await api.recognizeCarImage(file);
      setRecognitionResult(data);
      onApplyRecognition(data, file);
    } catch (err: any) {
      setError(err?.message || 'Không thể nhận diện hình ảnh xe. Vui lòng thử lại với ảnh rõ nét hơn.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessUrl = async () => {
    if (!imageUrl.trim()) return;
    setError(null);
    setLoading(true);
    setRecognitionResult(null);
    setPreviewUrl(imageUrl.trim());

    try {
      const data = await api.recognizeCarFromUrl(imageUrl.trim());
      setRecognitionResult(data);
      // Create a dummy file or pass url data
      onApplyRecognition(data, new File([], 'car_from_url.jpg', { type: 'image/jpeg' }));
      setShowUrlInput(false);
    } catch (err: any) {
      setError(err?.message || 'Không thể nhận diện ảnh từ đường link này.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setRecognitionResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className={`rounded-2xl border border-secondary/35 bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-secondary-fixed/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(25,25,25,0.04)] transition-all ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-base sm:text-[17px] font-bold text-primary tracking-tight">
                Trợ lý AI Vision: Nhận diện ảnh &amp; Tự điền xe
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-[10px] font-bold uppercase tracking-wider">
                AI Vision
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Tải ảnh xe (góc trước, sau, mặt taplo hoặc cavet), AI tự động nhận dạng hãng, đời, màu sắc và điền vào form.
            </p>
          </div>
        </div>

        {!loading && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
              <span>{recognitionResult ? 'Đổi ảnh khác' : 'Chọn ảnh xe'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary transition-colors text-xs font-medium cursor-pointer"
              title="Nhập URL ảnh"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
            </button>
          </div>
        )}
      </div>

      {/* URL Input Accordion */}
      {showUrlInput && !loading && (
        <div className="mt-4 p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high flex flex-col sm:flex-row items-center gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Dán đường link ảnh xe trực tuyến (https://...)"
            className="w-full h-10 px-3.5 rounded-lg bg-surface text-primary text-xs border border-surface-container-high focus:outline-none focus:border-secondary"
          />
          <button
            type="button"
            onClick={handleProcessUrl}
            className="w-full sm:w-auto px-4 h-10 rounded-lg bg-primary text-on-primary text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-primary/90"
          >
            Quét link ảnh
          </button>
        </div>
      )}

      {/* Main Body: Dropzone / Scanning state / Results */}
      <div className="mt-4">
        {loading ? (
          /* Scanning Loading Animation */
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-secondary/40 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-surface-container shadow-inner">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Ảnh xe đang quét"
                  className="w-full h-full object-cover opacity-80"
                />
              )}
              {/* Laser scanner animation line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_12px_#b89b72] animate-bounce" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm font-display">
                <span className="material-symbols-outlined text-secondary text-[20px] animate-spin">
                  progress_activity
                </span>
                <span>AI Vision đang phân tích xe...</span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Đang đối chiếu lưới tản nhiệt, logo thương hiệu, form dáng thế hệ và màu sắc ngoại thất với cơ sở dữ liệu xe Việt Nam.
              </p>
            </div>
          </div>
        ) : recognitionResult ? (
          /* Recognition Success Result Card */
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-secondary/30 shadow-xs space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                      Nhận diện thành công
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                      Độ chính xác: {Math.round((recognitionResult.confidence_score || 0.9) * 100)}%
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold text-primary mt-0.5">
                    {recognitionResult.brand} {recognitionResult.model} {recognitionResult.trim || ''} (
                    {recognitionResult.manufacture_year || 'Đời xe'}
                    )
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[11px] text-on-surface-variant italic">
                  Đã tự động điền các ô bên dưới
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1 rounded-lg text-outline hover:text-primary transition-colors cursor-pointer"
                  title="Đóng kết quả"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-surface-container-high/60 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] text-on-surface-variant block uppercase font-medium">Hãng & Dòng</span>
                <span className="font-bold text-primary truncate block mt-0.5">
                  {recognitionResult.brand || '---'} {recognitionResult.model || ''}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] text-on-surface-variant block uppercase font-medium">Năm & Kiểu dáng</span>
                <span className="font-bold text-primary truncate block mt-0.5">
                  {recognitionResult.manufacture_year || '---'} • {recognitionResult.body_type || '---'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] text-on-surface-variant block uppercase font-medium">Màu sắc</span>
                <span className="font-bold text-primary truncate block mt-0.5">
                  {recognitionResult.color || '---'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] text-on-surface-variant block uppercase font-medium">Hộp số & Nhiên liệu</span>
                <span className="font-bold text-primary truncate block mt-0.5">
                  {recognitionResult.transmission === 'AUTOMATIC' ? 'Tự động' : recognitionResult.transmission === 'MANUAL' ? 'Số sàn' : '---'} •{' '}
                  {recognitionResult.fuel_type === 'GASOLINE' ? 'Xăng' : recognitionResult.fuel_type === 'DIESEL' ? 'Dầu' : recognitionResult.fuel_type === 'ELECTRIC' ? 'Điện' : '---'}
                </span>
              </div>
            </div>

            {/* Note & Suggestions */}
            {recognitionResult.suggested_title && (
              <div className="p-3 rounded-xl bg-secondary-fixed/15 border border-secondary/25 text-xs text-primary space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-secondary">
                  <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                  <span>Tiêu đề đề xuất:</span>
                </div>
                <p className="font-medium text-[#1a1c1a]">{recognitionResult.suggested_title}</p>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Initial Drag & Drop Zone */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              isDragOver
                ? 'border-secondary bg-secondary-fixed/20 shadow-md'
                : 'border-surface-container-high hover:border-secondary/60 bg-surface-container-lowest/70 hover:bg-surface-container-lowest'
            }`}
          >
            <div className="mx-auto w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/25 flex items-center justify-center text-secondary mb-3">
              <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-primary">
              Kéo thả hoặc nhấn để chọn ảnh xe tải lên
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Hỗ trợ ảnh ngoại thất, ảnh đuôi xe, mặt đồng hồ taplo hoặc giấy đăng ký xe (JPG, PNG, tối đa 15MB)
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 border border-error/30 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
