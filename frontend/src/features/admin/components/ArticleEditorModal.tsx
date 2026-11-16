'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  Star,
  Quote,
  Heading2,
  List,
  Sparkles,
  Check,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Layers,
} from 'lucide-react';
import { AdminButton } from './ui/AdminButton';
import { useAdminUI } from '../context/AdminUIContext';
import { api } from '@/lib/api';
import { AdminArticleItem } from '../types';

export type BlockType = 'paragraph' | 'image' | 'heading' | 'quote' | 'list';

export interface ContentBlock {
  id: string;
  type: BlockType;
  value: string;
  caption?: string;
  headingLevel?: 2 | 3;
}

interface ArticleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialArticle?: AdminArticleItem | null;
  onSubmit: (data: {
    title: string;
    summary?: string;
    content: string;
    thumbnail_url?: string;
    category: string;
    status: string;
  }) => Promise<boolean>;
}

const CATEGORIES = [
  'THỊ TRƯỜNG',
  'ĐÁNH GIÁ XE',
  'KINH NGHIỆM',
  'TƯ VẤN PHÁP LÝ',
  'CÔNG NGHỆ & XE XANH',
  'BẢNG GIÁ XE',
];

function generateId(): string {
  return 'b_' + Math.random().toString(36).substring(2, 9);
}

// Chuyển danh sách blocks thành chuỗi Markdown lưu trữ
export function blocksToMarkdown(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `## ${b.value.trim()}`;
        case 'image':
          if (b.caption && b.caption.trim()) {
            return `![${b.caption.trim()}](${b.value.trim()})\n*${b.caption.trim()}*`;
          }
          return `![Hình ảnh minh họa](${b.value.trim()})`;
        case 'quote':
          return `> ${b.value.trim()}`;
        case 'list':
          return b.value
            .split('\n')
            .map((line) => (line.trim().startsWith('-') ? line.trim() : `- ${line.trim()}`))
            .join('\n');
        case 'paragraph':
        default:
          return b.value.trim();
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

// Phân giải chuỗi Markdown thành các khối Blocks trực quan
export function markdownToBlocks(md: string): { blocks: ContentBlock[]; images: string[] } {
  const sections = md.split('\n\n');
  const blocks: ContentBlock[] = [];
  const foundImages: string[] = [];

  sections.forEach((sec) => {
    const trimmed = sec.trim();
    if (!trimmed) return;

    // Image: ![caption](url)
    const imgMatch = trimmed.match(/^!\[([\s\S]*?)\]\((https?:\/\/[^\s\)]+)\)(?:\s*\n\*(.*?)\*)?$/);
    if (imgMatch) {
      const url = imgMatch[2];
      const caption = imgMatch[3] || imgMatch[1];
      blocks.push({
        id: generateId(),
        type: 'image',
        value: url,
        caption: caption === 'Hình ảnh minh họa' ? '' : caption,
      });
      if (!foundImages.includes(url)) foundImages.push(url);
      return;
    }

    // Heading 2 or 3
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^#{2,3}\s+/, '');
      blocks.push({
        id: generateId(),
        type: 'heading',
        headingLevel: trimmed.startsWith('###') ? 3 : 2,
        value: text,
      });
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const text = trimmed.replace(/^>\s*/gm, '');
      blocks.push({
        id: generateId(),
        type: 'quote',
        value: text,
      });
      return;
    }

    // Bullet List
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({
        id: generateId(),
        type: 'list',
        value: trimmed,
      });
      return;
    }

    // Paragraph
    blocks.push({
      id: generateId(),
      type: 'paragraph',
      value: trimmed,
    });
  });

  return { blocks, images: foundImages };
}

export function ArticleEditorModal({
  isOpen,
  onClose,
  initialArticle,
  onSubmit,
}: ArticleEditorModalProps) {
  const { toast } = useAdminUI();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formCategory, setFormCategory] = useState('THỊ TRƯỜNG');
  const [formStatus, setFormStatus] = useState('PUBLISHED');

  const [blocks, setBlocks] = useState<ContentBlock[]>([
    { id: generateId(), type: 'paragraph', value: '' },
  ]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Nạp dữ liệu khi mở modal (tạo mới hoặc chỉnh sửa bài viết cũ)
  useEffect(() => {
    if (!isOpen) return;

    if (initialArticle) {
      setFormTitle(initialArticle.title || '');
      setFormSummary(initialArticle.summary || '');
      setFormThumbnail(initialArticle.thumbnail_url || '');
      setFormCategory(initialArticle.category || 'THỊ TRƯỜNG');
      setFormStatus(initialArticle.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');

      const initialImgs: string[] = [];
      if (initialArticle.thumbnail_url) initialImgs.push(initialArticle.thumbnail_url);

      // Tải chi tiết bài viết để lấy content đầy đủ
      setLoadingDetail(true);
      api
        .getArticleDetail(initialArticle.id)
        .then((detail) => {
          if (detail.content) {
            const { blocks: parsedBlocks, images: parsedImgs } = markdownToBlocks(detail.content);
            setBlocks(
              parsedBlocks.length > 0
                ? parsedBlocks
                : [{ id: generateId(), type: 'paragraph', value: detail.content }]
            );
            parsedImgs.forEach((img) => {
              if (!initialImgs.includes(img)) initialImgs.push(img);
            });
          }
          setUploadedImages(initialImgs);
        })
        .catch((err) => {
          console.error('Không thể nạp nội dung bài viết:', err);
          toast.error('Lỗi nạp bài viết', 'Không thể tải toàn bộ nội dung chi tiết bài viết');
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    } else {
      // Form tạo mới bài viết trắng
      setFormTitle('');
      setFormSummary('');
      setFormThumbnail('');
      setFormCategory('THỊ TRƯỜNG');
      setFormStatus('PUBLISHED');
      setBlocks([
        { id: generateId(), type: 'paragraph', value: '' },
      ]);
      setUploadedImages([]);
    }
    setActiveTab('editor');
  }, [isOpen, initialArticle]);

  if (!isOpen) return null;

  // Xử lý upload nhiều file cùng lúc lên Cloudinary
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setUploading(true);

    try {
      const results = await api.uploadMultipleMedia(fileList, 'articles');
      const newUrls: string[] = results.map((r: any) => r.secure_url).filter(Boolean);

      setUploadedImages((prev) => {
        const merged = [...prev];
        newUrls.forEach((url) => {
          if (!merged.includes(url)) merged.push(url);
        });
        return merged;
      });

      // Tự động gán ảnh bìa nếu chưa có
      if (!formThumbnail && newUrls.length > 0) {
        setFormThumbnail(newUrls[0]);
      }

      toast.success(
        'Tải ảnh thành công',
        `Đã tải ${newUrls.length} ảnh lên khay lưu trữ bài viết.`
      );
    } catch (err: any) {
      toast.error('Lỗi tải ảnh', err.message || 'Không thể upload ảnh lên máy chủ');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload riêng 1 ảnh làm Cover Thumbnail
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadMedia(file, 'articles');
      if (res?.secure_url) {
        setFormThumbnail(res.secure_url);
        setUploadedImages((prev) =>
          prev.includes(res.secure_url) ? prev : [res.secure_url, ...prev]
        );
        toast.success('Ảnh bìa', 'Đã cập nhật ảnh đại diện bài viết.');
      }
    } catch (err: any) {
      toast.error('Lỗi tải ảnh bìa', err.message || 'Không thể tải ảnh bìa');
    } finally {
      setUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // Thao tác với Block nội dung
  const addBlock = (type: BlockType, afterIndex?: number, val = '', caption = '') => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      value: val,
      caption,
      headingLevel: 2,
    };

    setBlocks((prev) => {
      const next = [...prev];
      if (typeof afterIndex === 'number' && afterIndex >= 0) {
        next.splice(afterIndex + 1, 0, newBlock);
      } else {
        next.push(newBlock);
      }
      return next;
    });
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) {
        return [{ id: generateId(), type: 'paragraph', value: '' }];
      }
      return prev.filter((b) => b.id !== id);
    });
  };

  const moveBlock = (idx: number, dir: 'up' | 'down') => {
    setBlocks((prev) => {
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Chèn nhanh ảnh từ khay ảnh vào bài viết
  const insertImageBlockFromTray = (url: string) => {
    addBlock('image', undefined, url, '');
    toast.success('Đã chèn ảnh', 'Ảnh đã được thêm vào nội dung bài viết. Bạn có thể nhập chú thích ảnh.');
  };

  const handleCopyImgUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Submit bài viết
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.warning('Thiếu dữ liệu', 'Vui lòng nhập tiêu đề bài viết.');
      return;
    }

    const compiledContent = blocksToMarkdown(blocks);
    if (!compiledContent.trim() || compiledContent.length < 20) {
      toast.warning(
        'Nội dung quá ngắn',
        'Vui lòng nhập nội dung bài viết (tối thiểu 20 ký tự hoặc thêm hình ảnh & đoạn văn).'
      );
      return;
    }

    setSubmitting(true);
    const success = await onSubmit({
      title: formTitle.trim(),
      summary: formSummary.trim() || undefined,
      content: compiledContent,
      thumbnail_url: formThumbnail.trim() || undefined,
      category: formCategory,
      status: formStatus,
    });
    setSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-high rounded-3xl w-full max-w-6xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high bg-surface-container-low/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container/60 border border-secondary/20 flex items-center justify-center text-secondary shadow-xs">
              <span className="material-symbols-outlined text-[22px]">
                {initialArticle ? 'edit_note' : 'post_add'}
              </span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                <span>{initialArticle ? 'Biên tập & Sửa bài viết' : 'Soạn thảo bài viết tin tức mới'}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary-container text-secondary uppercase">
                  {formCategory}
                </span>
              </h3>
              <p className="text-xs text-outline hidden sm:block">
                Hỗ trợ tải nhiều ảnh cùng lúc, chèn ảnh xen kẽ giữa các đoạn văn kèm chú thích chuẩn báo chí
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-surface-container rounded-xl p-1 border border-surface-container-high text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-outline hover:text-primary'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Soạn theo Khối</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-outline hover:text-primary'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem trước bài viết</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-outline hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <input
          type="file"
          ref={coverInputRef}
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          onChange={handleCoverUpload}
        />

        {/* Modal Main Body */}
        {loadingDetail ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 space-y-4">
            <div className="w-10 h-10 border-3 border-secondary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-outline">Đang nạp dữ liệu bài viết & khay hình ảnh...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'editor' ? (
                <>
                  {/* Article Meta Details Box */}
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
                          {CATEGORIES.map((cat) => (
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

                  {/* Multi-image Asset Tray (Khay ảnh bài viết) */}
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
                                  onClick={() => insertImageBlockFromTray(url)}
                                  title="Chèn ảnh này vào bài viết"
                                  className="flex-1 py-1 px-1.5 rounded-lg bg-secondary-container/60 hover:bg-secondary text-primary hover:text-white font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10px]"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Chèn</span>
                                </button>

                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => setFormThumbnail(url)}
                                    title="Đặt làm ảnh bìa"
                                    className="p-1 rounded-lg text-outline hover:text-secondary hover:bg-surface-container-high transition-colors cursor-pointer"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleCopyImgUrl(url)}
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
                                  onClick={() =>
                                    setUploadedImages((prev) => prev.filter((_, i) => i !== idx))
                                  }
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

                  {/* Visual Content Blocks Workspace */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                      <div>
                        <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                          <span>Nội dung bài viết ({blocks.length} phân đoạn)</span>
                        </h4>
                        <p className="text-xs text-outline">
                          Sắp xếp các đoạn văn và hình ảnh xen kẽ theo thứ tự mạch lạc như tòa soạn báo chuyên nghiệp
                        </p>
                      </div>

                      {/* Quick Add Block Bar */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => addBlock('paragraph')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-surface-container-high transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-secondary" />
                          <span>+ Đoạn văn</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (uploadedImages.length > 0) {
                              addBlock('image', undefined, uploadedImages[0], '');
                            } else {
                              fileInputRef.current?.click();
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary-container/60 hover:bg-secondary-container text-secondary text-xs font-bold border border-secondary/30 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>+ Ảnh xen kẽ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlock('heading')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-surface-container-high transition-colors cursor-pointer"
                        >
                          <Heading2 className="w-3.5 h-3.5 text-secondary" />
                          <span>+ Tiêu đề mục</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlock('quote')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-surface-container-high transition-colors cursor-pointer"
                        >
                          <Quote className="w-3.5 h-3.5 text-secondary" />
                          <span>+ Trích dẫn</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlock('list')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-surface-container-high transition-colors cursor-pointer"
                        >
                          <List className="w-3.5 h-3.5 text-secondary" />
                          <span>+ Gạch đầu dòng</span>
                        </button>
                      </div>
                    </div>

                    {/* Blocks List */}
                    <div className="space-y-4">
                      {blocks.map((block, idx) => (
                        <div
                          key={block.id}
                          className="group relative rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary/50 shadow-xs transition-all p-4"
                        >
                          {/* Block Controls Header */}
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-container-high/60 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-surface-container text-outline font-bold flex items-center justify-center text-[11px]">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-primary uppercase text-[11px] tracking-wider">
                                {block.type === 'paragraph' && '📝 Đoạn văn'}
                                {block.type === 'image' && '🖼️ Khối Ảnh có Chú thích'}
                                {block.type === 'heading' && '📌 Tiêu đề phân đoạn'}
                                {block.type === 'quote' && '💬 Hộp Trích dẫn nổi bật'}
                                {block.type === 'list' && '📋 Danh sách gạch đầu dòng'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveBlock(idx, 'up')}
                                title="Di chuyển lên trên"
                                className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={idx === blocks.length - 1}
                                onClick={() => moveBlock(idx, 'down')}
                                title="Di chuyển xuống dưới"
                                className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => removeBlock(block.id)}
                                title="Xóa khối này"
                                className="p-1 rounded-md text-outline hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Block Content Editor per type */}
                          {block.type === 'paragraph' && (
                            <textarea
                              value={block.value}
                              onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                              placeholder="Nhập nội dung đoạn văn... (Hỗ trợ **in đậm**, *in nghiêng*)"
                              rows={3}
                              className="w-full px-3 py-2 text-sm leading-relaxed rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
                            />
                          )}

                          {block.type === 'heading' && (
                            <input
                              type="text"
                              value={block.value}
                              onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                              placeholder="Nhập tiêu đề phân đoạn..."
                              className="w-full px-3 py-2 text-base font-bold rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
                            />
                          )}

                          {block.type === 'image' && (
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row gap-4 items-start">
                                {/* Thumbnail Preview */}
                                <div className="w-full sm:w-60 aspect-video rounded-xl overflow-hidden bg-surface-container border border-surface-container-high shrink-0 relative group">
                                  {block.value ? (
                                    <img
                                      src={block.value}
                                      alt={block.caption || 'Ảnh bài viết'}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-outline text-xs">
                                      <ImageIcon className="w-8 h-8 mb-1" />
                                      <span>Chưa chọn ảnh</span>
                                    </div>
                                  )}
                                </div>

                                {/* Image Details & Caption */}
                                <div className="flex-1 w-full space-y-2">
                                  <div>
                                    <label className="text-[11px] font-bold text-primary uppercase">
                                      URL Hình ảnh
                                    </label>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <input
                                        type="url"
                                        value={block.value}
                                        onChange={(e) =>
                                          updateBlock(block.id, { value: e.target.value })
                                        }
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-primary uppercase flex items-center justify-between">
                                      <span>Chú thích ảnh (Caption)</span>
                                      <span className="text-[10px] text-outline font-normal">
                                        Hiển thị in nghiêng dưới ảnh như báo VnExpress, Zing
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      value={block.caption || ''}
                                      onChange={(e) =>
                                        updateBlock(block.id, { caption: e.target.value })
                                      }
                                      placeholder="Ví dụ: Khoang nội thất da cao cấp trên dòng sedan hạng sang..."
                                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none italic"
                                    />
                                  </div>

                                  {/* Select from tray picker if available */}
                                  {uploadedImages.length > 0 && (
                                    <div className="pt-1">
                                      <span className="text-[10px] text-outline block mb-1">
                                        Hoặc chọn nhanh từ khay ảnh:
                                      </span>
                                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                        {uploadedImages.map((u, i) => (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => updateBlock(block.id, { value: u })}
                                            className={`w-12 h-8 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                                              block.value === u
                                                ? 'border-secondary ring-2 ring-secondary/40'
                                                : 'border-surface-container-high opacity-70 hover:opacity-100'
                                            }`}
                                          >
                                            <img
                                              src={u}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {block.type === 'quote' && (
                            <div className="relative">
                              <textarea
                                value={block.value}
                                onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                                placeholder="Nhập trích dẫn phát biểu hoặc đánh giá nổi bật từ chuyên gia..."
                                rows={2}
                                className="w-full px-4 py-2.5 text-sm font-medium italic rounded-xl border-l-4 border-secondary border-surface-container-high bg-secondary-container/10 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
                              />
                            </div>
                          )}

                          {block.type === 'list' && (
                            <textarea
                              value={block.value}
                              onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                              placeholder="- Ý thứ nhất\n- Ý thứ hai\n- Ý thứ ba"
                              rows={3}
                              className="w-full px-3 py-2 text-sm leading-relaxed rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
                            />
                          )}

                          {/* Quick insert between blocks */}
                          <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-outline mr-1">Chèn bên dưới:</span>
                            <button
                              type="button"
                              onClick={() => addBlock('paragraph', idx)}
                              className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-primary hover:bg-surface-container-high cursor-pointer"
                            >
                              + Đoạn văn
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (uploadedImages.length > 0) {
                                  addBlock('image', idx, uploadedImages[0], '');
                                } else {
                                  addBlock('image', idx);
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-secondary-container/60 text-[10px] font-bold text-secondary hover:bg-secondary-container cursor-pointer"
                            >
                              + Ảnh
                            </button>
                            <button
                              type="button"
                              onClick={() => addBlock('heading', idx)}
                              className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-primary hover:bg-surface-container-high cursor-pointer"
                            >
                              + Tiêu đề
                            </button>
                            <button
                              type="button"
                              onClick={() => addBlock('quote', idx)}
                              className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-primary hover:bg-surface-container-high cursor-pointer"
                            >
                              + Trích dẫn
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* LIVE PREVIEW TAB */
                <div className="max-w-3xl mx-auto py-6 space-y-6 animate-in fade-in">
                  <div className="space-y-3 pb-6 border-b border-surface-container-high">
                    <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold uppercase tracking-wider">
                      {formCategory}
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-bold text-primary font-headline tracking-tight leading-tight">
                      {formTitle || 'Tiêu đề bài viết tin tức'}
                    </h1>
                    <div className="flex items-center gap-4 text-xs text-outline">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date().toLocaleDateString('vi-VN')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.max(2, Math.ceil(blocksToMarkdown(blocks).split(/\s+/).length / 150))} phút đọc
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-primary">Ban Biên tập AuraAuto</span>
                    </div>
                  </div>

                  {/* Cover photo in preview */}
                  {formThumbnail && (
                    <div className="rounded-2xl overflow-hidden border border-surface-container-high shadow-md">
                      <img
                        src={formThumbnail}
                        alt={formTitle}
                        className="w-full h-auto max-h-[460px] object-cover"
                      />
                      <div className="p-2.5 bg-surface-container-low text-center text-xs text-outline italic">
                        Ảnh bìa: AuraAuto Automotive Intelligence Hub
                      </div>
                    </div>
                  )}

                  {/* Summary in preview */}
                  {formSummary && (
                    <div className="p-5 rounded-2xl bg-secondary-container/20 border-l-4 border-secondary text-base text-primary font-medium italic shadow-xs">
                      &ldquo;{formSummary}&rdquo;
                    </div>
                  )}

                  {/* Rendered Blocks Preview */}
                  <div className="space-y-6 pt-2 text-on-surface leading-relaxed text-base">
                    {blocks.map((b, i) => {
                      if (b.type === 'heading') {
                        return (
                          <h2
                            key={i}
                            className="text-2xl sm:text-3xl font-bold text-primary font-headline tracking-tight pt-4 border-b border-surface-container-high pb-2"
                          >
                            {b.value || 'Tiêu đề mục'}
                          </h2>
                        );
                      }
                      if (b.type === 'image') {
                        if (!b.value) return null;
                        return (
                          <figure
                            key={i}
                            className="my-6 rounded-2xl overflow-hidden border border-surface-container-high bg-surface-container-high/20 shadow-md"
                          >
                            <img
                              src={b.value}
                              alt={b.caption || 'Ảnh minh họa'}
                              className="w-full h-auto max-h-[500px] object-cover"
                            />
                            {b.caption && (
                              <figcaption className="p-3 bg-surface-container-low text-center text-xs text-outline italic border-t border-surface-container-high/60">
                                {b.caption}
                              </figcaption>
                            )}
                          </figure>
                        );
                      }
                      if (b.type === 'quote') {
                        return (
                          <blockquote
                            key={i}
                            className="my-5 p-5 rounded-2xl bg-secondary-container/20 border-l-4 border-secondary text-primary font-medium text-base italic shadow-xs"
                          >
                            &ldquo;{b.value}&rdquo;
                          </blockquote>
                        );
                      }
                      if (b.type === 'list') {
                        const items = b.value.split('\n');
                        return (
                          <ul key={i} className="list-disc pl-6 space-y-1.5 my-4">
                            {items.map((it, idx2) => (
                              <li key={idx2} className="pl-1 text-on-surface">
                                {it.replace(/^[-\*]\s*/, '')}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={i} className="text-on-surface leading-relaxed whitespace-pre-line">
                          {b.value}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Action Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-surface-container-high bg-surface-container-low/60 shrink-0">
              <div className="text-xs text-outline flex items-center gap-3">
                <span>{blocks.length} phân đoạn</span>
                <span>•</span>
                <span>{uploadedImages.length} ảnh đã nạp</span>
                <span>•</span>
                <span className="font-semibold text-secondary">
                  {formStatus === 'PUBLISHED' ? 'Xuất bản công khai' : 'Bản nháp'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <AdminButton variant="outline" size="sm" type="button" onClick={onClose}>
                  Hủy bỏ
                </AdminButton>
                <AdminButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={submitting}
                  icon={initialArticle ? 'save' : 'send'}
                >
                  {initialArticle ? 'Lưu thay đổi bài viết' : 'Đăng bài viết ngay'}
                </AdminButton>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Giữ lại alias ArticleCreateModal để tương thích ngược hoàn toàn
export const ArticleCreateModal = ArticleEditorModal;
