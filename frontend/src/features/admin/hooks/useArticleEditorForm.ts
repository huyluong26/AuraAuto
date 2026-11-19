'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { AdminArticleItem } from '../types';
import { useAdminUI } from '../context/AdminUIContext';
import {
  BlockType,
  ContentBlock,
  generateBlockId as generateId,
  blocksToMarkdown,
  markdownToBlocks,
} from '../utils/articleMarkdown';

export const ARTICLE_CATEGORIES = [
  'THỊ TRƯỜNG',
  'ĐÁNH GIÁ XE',
  'KINH NGHIỆM',
  'TƯ VẤN PHÁP LÝ',
  'CÔNG NGHỆ & XE XANH',
  'BẢNG GIÁ XE',
];

interface UseArticleEditorFormProps {
  isOpen: boolean;
  initialArticle?: AdminArticleItem | null;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    summary?: string;
    content: string;
    thumbnail_url?: string;
    category: string;
    status: string;
  }) => Promise<boolean>;
}

export function useArticleEditorForm({
  isOpen,
  initialArticle,
  onClose,
  onSubmit,
}: UseArticleEditorFormProps) {
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
      setFormTitle('');
      setFormSummary('');
      setFormThumbnail('');
      setFormCategory('THỊ TRƯỜNG');
      setFormStatus('PUBLISHED');
      setBlocks([{ id: generateId(), type: 'paragraph', value: '' }]);
      setUploadedImages([]);
    }
    setActiveTab('editor');
  }, [isOpen, initialArticle]);

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

  const insertImageBlockFromTray = (url: string) => {
    addBlock('image', undefined, url, '');
    toast.success('Đã chèn ảnh', 'Ảnh đã được thêm vào nội dung bài viết. Bạn có thể nhập chú thích ảnh.');
  };

  const handleCopyImgUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleRemoveImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

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

  return {
    activeTab,
    setActiveTab,
    formTitle,
    setFormTitle,
    formSummary,
    setFormSummary,
    formThumbnail,
    setFormThumbnail,
    formCategory,
    setFormCategory,
    formStatus,
    setFormStatus,
    blocks,
    uploadedImages,
    setUploadedImages,
    uploading,
    submitting,
    loadingDetail,
    copiedLink,
    fileInputRef,
    coverInputRef,
    handleFilesSelected,
    handleCoverUpload,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    insertImageBlockFromTray,
    handleCopyImgUrl,
    handleRemoveImage,
    handleSubmit,
  };
}
