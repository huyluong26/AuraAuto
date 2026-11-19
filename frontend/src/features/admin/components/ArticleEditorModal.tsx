'use client';

import React from 'react';
import { X, Layers, Eye } from 'lucide-react';
import { AdminButton } from './ui/AdminButton';
import { AdminArticleItem } from '../types';
import {
  BlockType,
  ContentBlock,
  generateBlockId as generateId,
  blocksToMarkdown,
  markdownToBlocks,
} from '../utils/articleMarkdown';
import { useArticleEditorForm } from '../hooks/useArticleEditorForm';
import { ArticleMetaForm } from './article-editor/ArticleMetaForm';
import { ArticleAssetTray } from './article-editor/ArticleAssetTray';
import { ArticleBlockEditor } from './article-editor/ArticleBlockEditor';
import { ArticleLivePreview } from './article-editor/ArticleLivePreview';

export type { BlockType, ContentBlock };
export { blocksToMarkdown, markdownToBlocks };

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

export function ArticleEditorModal({
  isOpen,
  onClose,
  initialArticle,
  onSubmit,
}: ArticleEditorModalProps) {
  const {
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
  } = useArticleEditorForm({
    isOpen,
    initialArticle,
    onClose,
    onSubmit,
  });

  if (!isOpen) return null;

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
                  <ArticleMetaForm
                    formTitle={formTitle}
                    setFormTitle={setFormTitle}
                    formCategory={formCategory}
                    setFormCategory={setFormCategory}
                    formStatus={formStatus}
                    setFormStatus={setFormStatus}
                    formThumbnail={formThumbnail}
                    setFormThumbnail={setFormThumbnail}
                    formSummary={formSummary}
                    setFormSummary={setFormSummary}
                    uploading={uploading}
                    coverInputRef={coverInputRef}
                  />

                  <ArticleAssetTray
                    uploadedImages={uploadedImages}
                    uploading={uploading}
                    formThumbnail={formThumbnail}
                    copiedLink={copiedLink}
                    fileInputRef={fileInputRef}
                    onInsertImage={insertImageBlockFromTray}
                    onSetThumbnail={setFormThumbnail}
                    onCopyUrl={handleCopyImgUrl}
                    onRemoveImage={handleRemoveImage}
                  />

                  <ArticleBlockEditor
                    blocks={blocks}
                    uploadedImages={uploadedImages}
                    fileInputRef={fileInputRef}
                    onAddBlock={addBlock}
                    onUpdateBlock={updateBlock}
                    onRemoveBlock={removeBlock}
                    onMoveBlock={moveBlock}
                  />
                </>
              ) : (
                <ArticleLivePreview
                  formTitle={formTitle}
                  formCategory={formCategory}
                  formThumbnail={formThumbnail}
                  formSummary={formSummary}
                  blocks={blocks}
                />
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
