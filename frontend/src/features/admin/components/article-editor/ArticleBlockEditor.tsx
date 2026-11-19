'use client';

import React from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Quote,
  Heading2,
  List,
} from 'lucide-react';
import { BlockType, ContentBlock } from '../../utils/articleMarkdown';

interface ArticleBlockEditorProps {
  blocks: ContentBlock[];
  uploadedImages: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAddBlock: (type: BlockType, afterIndex?: number, val?: string, caption?: string) => void;
  onUpdateBlock: (id: string, updates: Partial<ContentBlock>) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (idx: number, dir: 'up' | 'down') => void;
}

export function ArticleBlockEditor({
  blocks,
  uploadedImages,
  fileInputRef,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock,
}: ArticleBlockEditorProps) {
  return (
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
            onClick={() => onAddBlock('paragraph')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-surface-container-high transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-secondary" />
            <span>+ Đoạn văn</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (uploadedImages.length > 0) {
                onAddBlock('image', undefined, uploadedImages[0], '');
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
            onClick={() => onAddBlock('heading')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-surface-container-high transition-colors cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5 text-secondary" />
            <span>+ Tiêu đề mục</span>
          </button>
          <button
            type="button"
            onClick={() => onAddBlock('quote')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-surface-container-high transition-colors cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5 text-secondary" />
            <span>+ Trích dẫn</span>
          </button>
          <button
            type="button"
            onClick={() => onAddBlock('list')}
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
                  onClick={() => onMoveBlock(idx, 'up')}
                  title="Di chuyển lên trên"
                  className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                {/* Move Down */}
                <button
                  type="button"
                  disabled={idx === blocks.length - 1}
                  onClick={() => onMoveBlock(idx, 'down')}
                  title="Di chuyển xuống dưới"
                  className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => onRemoveBlock(block.id)}
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
                onChange={(e) => onUpdateBlock(block.id, { value: e.target.value })}
                placeholder="Nhập nội dung đoạn văn... (Hỗ trợ **in đậm**, *in nghiêng*)"
                rows={3}
                className="w-full px-3 py-2 text-sm leading-relaxed rounded-xl border border-surface-container-high bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            )}

            {block.type === 'heading' && (
              <input
                type="text"
                value={block.value}
                onChange={(e) => onUpdateBlock(block.id, { value: e.target.value })}
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
                            onUpdateBlock(block.id, { value: e.target.value })
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
                          onUpdateBlock(block.id, { caption: e.target.value })
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
                              onClick={() => onUpdateBlock(block.id, { value: u })}
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
                  onChange={(e) => onUpdateBlock(block.id, { value: e.target.value })}
                  placeholder="Nhập trích dẫn phát biểu hoặc đánh giá nổi bật từ chuyên gia..."
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm font-medium italic rounded-xl border-l-4 border-secondary border-surface-container-high bg-secondary-container/10 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
                />
              </div>
            )}

            {block.type === 'list' && (
              <textarea
                value={block.value}
                onChange={(e) => onUpdateBlock(block.id, { value: e.target.value })}
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
                onClick={() => onAddBlock('paragraph', idx)}
                className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-primary hover:bg-surface-container-high cursor-pointer"
              >
                + Đoạn văn
              </button>
              <button
                type="button"
                onClick={() => {
                  if (uploadedImages.length > 0) {
                    onAddBlock('image', idx, uploadedImages[0], '');
                  } else {
                    onAddBlock('image', idx);
                  }
                }}
                className="px-2 py-0.5 rounded bg-secondary-container/60 text-[10px] font-bold text-secondary hover:bg-secondary-container cursor-pointer"
              >
                + Ảnh
              </button>
              <button
                type="button"
                onClick={() => onAddBlock('heading', idx)}
                className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-primary hover:bg-surface-container-high cursor-pointer"
              >
                + Tiêu đề
              </button>
              <button
                type="button"
                onClick={() => onAddBlock('quote', idx)}
                className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-primary hover:bg-surface-container-high cursor-pointer"
              >
                + Trích dẫn
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

