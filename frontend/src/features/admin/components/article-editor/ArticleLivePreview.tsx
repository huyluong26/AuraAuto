'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { ContentBlock, blocksToMarkdown } from '../../utils/articleMarkdown';

interface ArticleLivePreviewProps {
  formTitle: string;
  formCategory: string;
  formThumbnail: string;
  formSummary: string;
  blocks: ContentBlock[];
}

export function ArticleLivePreview({
  formTitle,
  formCategory,
  formThumbnail,
  formSummary,
  blocks,
}: ArticleLivePreviewProps) {
  const readTimeMinutes = Math.max(
    2,
    Math.ceil(blocksToMarkdown(blocks).split(/\s+/).length / 150)
  );

  return (
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
            {readTimeMinutes} phút đọc
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
  );
}

