'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { ArticleDetail, ArticleItem } from '@/types';
import {
  Calendar,
  Clock,
  Eye,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Phone,
  MessageSquare,
  Globe,
  ExternalLink,
} from 'lucide-react';

function calculateReadTime(text?: string): number {
  if (!text) return 3;
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 150));
}

// Simple and clean markdown renderer for editorial articles
function ArticleBodyRenderer({ content }: { content: string }) {
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

function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-primary">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
}

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchArticle() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getArticleDetail(slug);
        if (mounted) {
          setArticle(data);

          // Fetch related articles in background
          try {
            const list = await api.getArticles({
              category: data.category,
              limit: 4,
            });
            if (mounted) {
              setRelatedArticles(list.filter((a) => a.id !== data.id));
            }
          } catch (e) {
            console.error('Không thể nạp bài viết liên quan:', e);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Không tìm thấy bài viết tin tức');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (slug) {
      fetchArticle();
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-32 w-full animate-pulse space-y-6">
          <div className="h-6 w-32 bg-surface-container-high rounded-full" />
          <div className="h-12 w-3/4 bg-surface-container-high rounded-2xl" />
          <div className="h-6 w-1/2 bg-surface-container-high rounded-lg" />
          <div className="h-96 w-full bg-surface-container-high rounded-3xl" />
          <div className="space-y-4 pt-6">
            <div className="h-4 bg-surface-container-high rounded w-full" />
            <div className="h-4 bg-surface-container-high rounded w-5/6" />
            <div className="h-4 bg-surface-container-high rounded w-4/6" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-surface-container/30 border border-surface-container-high">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto text-outline">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-primary font-headline">
              Bài viết không tồn tại
            </h2>
            <p className="text-outline text-sm leading-relaxed">
              Bài viết bạn đang tìm kiếm có thể đã bị xóa, gỡ khỏi xuất bản hoặc đường dẫn không chính xác.
            </p>
            <div className="pt-2">
              <Link
                href="/tin-tuc"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Về danh mục Tin tức</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* Breadcrumb Navigation */}
        <div className="w-full bg-surface border-b border-surface-container-high/60 py-3.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-outline overflow-x-auto scrollbar-none">
            <Link href="/" className="hover:text-primary transition-colors whitespace-nowrap">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/tin-tuc" className="hover:text-primary transition-colors whitespace-nowrap">
              Tin tức
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-secondary uppercase whitespace-nowrap">
              {article.category}
            </span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate text-primary max-w-xs sm:max-w-md">
              {article.title}
            </span>
          </div>
        </div>

        {/* Article Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Editorial Content Column */}
            <article className="lg:col-span-8 space-y-8">
              {/* Category & Date Header */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/80 text-secondary text-xs font-bold tracking-wider uppercase border border-secondary/20">
                  <span>{article.category}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary font-headline tracking-tight leading-tight">
                  {article.title}
                </h1>

                {/* Author & Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-surface-container-high text-xs sm:text-sm text-outline">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">
                      {article.author.display_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-primary">
                        {article.author.display_name}
                      </div>
                      <div className="text-[11px] text-outline">Ban Biên tập & Thẩm định AuraAuto</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-outline" />
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Mới cập nhật'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-outline" />
                      {calculateReadTime(article.content)} phút đọc
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-outline" />
                      {article.views_count.toLocaleString()} lượt xem
                    </span>
                  </div>
                </div>
              </div>

              {/* Cover Photo */}
              {article.thumbnail_url && (
                <div className="rounded-3xl overflow-hidden border border-surface-container-high bg-surface-container-high shadow-md">
                  <img
                    src={article.thumbnail_url}
                    alt={article.title}
                    className="w-full h-auto max-h-[500px] object-cover"
                  />
                  <div className="p-3 bg-surface-container/40 text-center text-[11px] text-outline italic">
                    Nguồn: AuraAuto Automotive Intelligence Hub & Atelier Network
                  </div>
                </div>
              )}

              {/* Summary Lead Quote Callout */}
              {article.summary && (
                <div className="p-6 sm:p-8 rounded-2xl bg-secondary-container/30 border-l-4 border-secondary text-base sm:text-lg text-primary font-medium leading-relaxed italic shadow-xs">
                  &ldquo;{article.summary}&rdquo;
                </div>
              )}

              {/* Full Content Body */}
              <div className="pt-2">
                <ArticleBodyRenderer content={article.content} />
              </div>

              {/* Share & Feedback Bar */}
              <div className="pt-8 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-outline font-medium">
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ bài viết này:</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      copiedShare
                        ? 'bg-secondary text-on-secondary'
                        : 'bg-surface-container hover:bg-surface-container-high text-primary border border-surface-container-high'
                    }`}
                  >
                    {copiedShare ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã chép link!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Sao chép liên kết</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.href : ''
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary border border-surface-container-high transition-colors"
                    title="Chia sẻ lên Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Back to news button */}
              <div className="pt-4">
                <Link
                  href="/tin-tuc"
                  className="inline-flex items-center gap-2 text-secondary hover:text-secondary-fixed text-sm font-bold transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Quay lại chuyên mục Tin tức & Tạp chí</span>
                </Link>
              </div>
            </article>

            {/* Sidebar Column */}
            <aside className="lg:col-span-4 space-y-8">
              {/* Author Info Card */}
              <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary text-white font-bold text-base flex items-center justify-center shadow-sm">
                    {article.author.display_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary text-base">
                      {article.author.display_name}
                    </h4>
                    <span className="text-xs text-secondary font-semibold">
                      Chuyên gia Thẩm định Xe sang
                    </span>
                  </div>
                </div>
                <p className="text-xs text-outline leading-relaxed">
                  Đội ngũ cố vấn kỹ thuật và phân tích thị trường độc lập của AuraAuto, chuyên sâu về thẩm định chất lượng phương tiện và dữ liệu định giá xe đã qua sử dụng.
                </p>
                <div className="pt-2 border-t border-surface-container-high flex items-center gap-2 text-xs text-secondary font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Nội dung đã được xác thực chuyên môn</span>
                </div>
              </div>

              {/* AI Valuation Widget Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-surface-container-lowest to-surface-container border border-secondary/30 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Công nghệ AI AuraAuto</span>
                </div>
                <h4 className="font-bold text-primary text-lg font-headline leading-snug">
                  Định giá chiếc xe của bạn trong 30 giây
                </h4>
                <p className="text-xs text-outline leading-relaxed">
                  Áp dụng mô hình học máy CatBoost phân tích đa chiều dữ liệu thị trường thực tế giúp xác định mức giá bán thanh khoản tối ưu nhất.
                </p>
                <Link
                  href="/dinh-gia-ai"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-secondary transition-all shadow-sm"
                >
                  <span>Thử Định Giá Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Related Articles Widget */}
              {relatedArticles.length > 0 && (
                <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-5">
                  <h4 className="font-bold text-primary text-base font-headline border-b border-surface-container-high pb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-secondary" />
                    <span>Bài viết liên quan</span>
                  </h4>

                  <div className="space-y-4">
                    {relatedArticles.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/tin-tuc/${rel.slug}`}
                        className="group flex gap-3 items-start"
                      >
                        <div className="w-20 h-16 rounded-xl bg-surface-container-high overflow-hidden shrink-0 border border-surface-container-high">
                          {rel.thumbnail_url ? (
                            <img
                              src={rel.thumbnail_url}
                              alt={rel.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                            {rel.category}
                          </span>
                          <h5 className="text-xs font-bold text-primary group-hover:text-secondary transition-colors line-clamp-2 leading-snug">
                            {rel.title}
                          </h5>
                          <div className="text-[10px] text-outline flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {calculateReadTime(rel.summary)} phút đọc
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Concierge Hotline Card */}
              <div className="p-6 rounded-3xl bg-primary-container text-white space-y-4 shadow-md">
                <div className="text-xs text-secondary-fixed-dim uppercase tracking-wider font-bold">
                  Hotline Hỗ Trợ 24/7
                </div>
                <div className="text-2xl font-bold font-headline">
                  1800 8899
                </div>
                <p className="text-xs text-surface-container-highest leading-relaxed">
                  Tư vấn quy trình kiểm định 200 điểm, thẩm định giá trị xe và hỗ trợ thủ tục sang tên đổi chủ trọn gói.
                </p>
                <div className="pt-2">
                  <a
                    href="tel:18008899"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi Chuyên Viên VIP</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
