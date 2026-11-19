'use client';

import React from 'react';
import { Upload } from 'lucide-react';
import { ARTICLE_CATEGORIES } from '../../hooks/useArticleEditorForm';

interface ArticleMetaFormProps {
  formTitle: string;
  setFormTitle: (title: string) => void;
  formCategory: string;
  setFormCategory: (category: string) => void;
  formStatus: string;
  setFormStatus: (status: string) => void;
  formThumbnail: string;
  setFormThumbnail: (thumb: string) => void;
  formSummary: string;
  setFormSummary: (summary: string) => void;
  uploading: boolean;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ArticleMetaForm({
  formTitle,
  setFormTitle,
  formCategory,
  setFormCategory,
  formStatus,
  setFormStatus,
  formThumbnail,
  setFormThumbnail,
  formSummary,
  setFormSummary,
  uploading,
  coverInputRef,
}: ArticleMetaFormProps) {
  return (
    <div className="p-5 rounded-2xl bg-surface-container-low/40 border border-surface-container-high/80 space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <span>Tiêu đề bài viết</span>
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="Nhập tiêu đề hấp dẫn, chuẩn SEO (Ví dụ: Đánh giá chi tiết Mercedes-Benz E300 AMG 2024...)"
          required
          className="w-full px-4 py-2.5 text-base font-semibold rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-primary uppercase tracking-wider">
            Chuyên mục bài viết
          </label>
          <select
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none cursor-pointer"
          >
            {ARTICLE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-primary uppercase tracking-wider">
            Trạng thái bài đăng
          </label>
          <select
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none cursor-pointer"
          >
            <option value="PUBLISHED">🟢 Xuất bản công khai ngay</option>
            <option value="DRAFT">🟡 Lưu bản nháp (DRAFT)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center justify-between">
            <span>Ảnh bìa đại diện (Cover)</span>
            {formThumbnail && (
              <button
                type="button"
                onClick={() => setFormThumbnail('')}
                className="text-[10px] text-red-500 hover:underline cursor-pointer"
              >
                Gỡ ảnh bìa
              </button>
            )}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={formThumbnail}
              onChange={(e) => setFormThumbnail(e.target.value)}
              placeholder="Dán link hoặc chọn từ khay ảnh"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary border border-surface-container-high flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              title="Tải ảnh bìa mới từ máy tính"
            >
              <Upload className="w-3.5 h-3.5 text-secondary" />
              <span>Tải bìa</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center justify-between">
          <span>Tóm tắt mở đầu (Sa-pô bài viết)</span>
          <span className="text-[11px] text-outline font-normal">1-2 câu điểm nhấn mở màn</span>
        </label>
        <textarea
          value={formSummary}
          onChange={(e) => setFormSummary(e.target.value)}
          placeholder="Đoạn văn ngắn làm nổi bật thông điệp chính của bài viết..."
          rows={2}
          className="w-full px-4 py-2 text-sm rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
        />
      </div>
    </div>
  );
}

