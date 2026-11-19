'use client';

import React from 'react';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatInlineMarkdown(text: string): string {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-primary">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
}

export function calculateReadTime(text?: string): number {
  if (!text) return 3;
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 150));
}

interface ArticleBodyRendererProps {
  content: string;
}

export function ArticleBodyRenderer({ content }: ArticleBodyRendererProps) {
  const sections = content.split('\n\n');

  return (
    <div className="space-y-6 text-on-surface text-base sm:text-lg leading-relaxed font-body">
      {sections.map((sec, idx) => {
        const trimmed = sec.trim();
        if (!trimmed) return null;

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="text-2xl sm:text-3xl font-bold text-primary font-headline tracking-tight pt-6 pb-2 border-b border-surface-container-high"
            >
              {trimmed.replace('### ', '')}
            </h3>
          );
        }

        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className="text-3xl sm:text-4xl font-bold text-primary font-headline tracking-tight pt-8 pb-3"
            >
              {trimmed.replace('## ', '')}
            </h2>
          );
        }

        // Image with Caption: ![Caption](URL)
        const imageMatch = trimmed.match(/^!\[([\s\S]*?)\]\((https?:\/\/[^\s\)]+)\)(?:\s*\n\*(.*?)\*)?$/);
        if (imageMatch) {
          const caption = imageMatch[3] || imageMatch[1];
          const url = imageMatch[2];
          return (
            <figure key={idx} className="my-8 rounded-2xl overflow-hidden border border-surface-container-high bg-surface-container-high/20 shadow-md">
              <img
                src={url}
                alt={caption || 'Hình ảnh tin tức'}
                className="w-full h-auto max-h-[600px] object-cover"
                loading="lazy"
              />
              {caption && (
                <figcaption className="p-3 bg-surface-container-low text-center text-xs sm:text-sm text-outline italic border-t border-surface-container-high/60">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // Blockquote / Pull Quote
        if (trimmed.startsWith('> ')) {
          const quoteText = trimmed.replace(/^>\s*/gm, '');
          return (
            <blockquote
              key={idx}
              className="my-6 p-6 sm:p-8 rounded-2xl bg-secondary-container/20 border-l-4 border-secondary text-primary font-medium text-lg leading-relaxed italic shadow-xs"
            >
              &ldquo;{quoteText}&rdquo;
            </blockquote>
          );
        }

        // Divider
        if (trimmed === '---') {
          return <hr key={idx} className="my-8 border-surface-container-high" />;
        }

        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n');
          return (
            <ol key={idx} className="list-decimal pl-6 space-y-3">
              {items.map((it, iIdx) => {
                const itemText = it.replace(/^\d+\.\s/, '');
                return (
                  <li key={iIdx} className="text-on-surface leading-relaxed pl-1">
                    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
                  </li>
                );
              })}
            </ol>
          );
        }

        // Bullet list
        if (trimmed.startsWith('- ')) {
          const items = trimmed.split('\n');
          return (
            <ul key={idx} className="list-disc pl-6 space-y-3">
              {items.map((it, iIdx) => {
                const itemText = it.replace(/^[-\*]\s/, '');
                return (
                  <li key={iIdx} className="text-on-surface leading-relaxed pl-1">
                    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard Paragraph
        return (
          <p
            key={idx}
            className="leading-relaxed text-on-surface"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
          />
        );
      })}
    </div>
  );
}

