'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { ArticleItem } from '@/types';
import {
  Search,
  Calendar,
  Eye,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả tin tức' },
  { id: 'THỊ TRƯỜNG', label: 'Thị trường & Giá xe' },
  { id: 'KINH NGHIỆM', label: 'Kinh nghiệm mua bán' },
  { id: 'ĐÁNH GIÁ XE', label: 'Đánh giá & Trải nghiệm' },
  { id: 'PHÁP LÝ', label: 'Pháp lý & Thủ tục' },
];

function calculateReadTime(text?: string): number {
  if (!text) return 3;
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 150));
}

export default function ArticlesListPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadArticles() {
      try {
        setLoading(true);
        const data = await api.getArticles({
          category: selectedCategory === 'ALL' ? undefined : selectedCategory,
          search: searchTerm.trim() || undefined,
        });
        if (mounted) {
          setArticles(data);
        }
      } catch (err) {
        console.error('Lỗi nạp bài viết:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadArticles();
    }, 200);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, searchTerm]);

  // Featured article: the first/newest or highest views article
  const featuredArticle = useMemo(() => {
    if (articles.length === 0) return null;
    return articles[0];
  }, [articles]);

  const regularArticles = useMemo(() => {
    if (articles.length <= 1) return [];
    return articles.slice(1);
  }, [articles]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* Hero Header */}
        <div className="w-full bg-gradient-to-b from-surface-container/60 to-surface border-b border-surface-container-high/60 py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/80 text-secondary text-xs font-semibold tracking-wider uppercase border border-secondary/20">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>AuraAuto Editorial & Insights</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary font-headline tracking-tight leading-tight">
                  Tạp chí & Tin tức Ô tô Cao cấp
                </h1>
                <p className="text-outline text-base sm:text-lg leading-relaxed">
                  Thông tin phân tích độc quyền, cẩm nang kiểm định xe sang và cập nhật pháp lý mới nhất từ hội đồng thẩm định AuraAuto.
                </p>
              </div>

              {/* Search Bar */}
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm bài viết, chủ đề..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high text-sm text-primary placeholder:text-outline focus:outline-none focus:border-secondary transition-colors shadow-xs"
                />
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high text-outline hover:text-primary'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {loading ? (
            /* Loading Skeleton */
            <div className="space-y-8 animate-pulse">
              <div className="h-96 rounded-3xl bg-surface-container-high" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-80 rounded-2xl bg-surface-container-high" />
                ))}
              </div>
            </div>
          ) : articles.length === 0 ? (
            /* Genuine Empty State */
            <div className="text-center py-20 bg-surface-container/30 rounded-3xl border border-dashed border-surface-container-high p-8">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto text-outline mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Không tìm thấy bài viết phù hợp</h3>
              <p className="text-outline text-sm max-w-md mx-auto mb-6">
                Hiện chưa có tin bài nào trong chuyên mục hoặc từ khóa bạn đang tìm kiếm. Vui lòng thử lại với tiêu chí khác.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchTerm('');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Top Featured Article Hero Card */}
              {featuredArticle && (
                <div className="group relative rounded-3xl overflow-hidden bg-surface-container-lowest border border-surface-container-high hover:border-secondary/40 transition-all duration-300 shadow-sm hover:shadow-xl">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    {/* Media Cover */}
                    <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-full min-h-[320px] overflow-hidden bg-surface-container-high">
                      {featuredArticle.thumbnail_url ? (
                        <img
                          src={featuredArticle.thumbnail_url}
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-outline">
                          <BookOpen className="w-16 h-16" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3.5 py-1.5 rounded-full bg-secondary text-white font-bold text-xs uppercase tracking-wider shadow-md backdrop-blur-md">
                          {featuredArticle.category}
                        </span>
                      </div>
                    </div>

                    {/* Information Content */}
                    <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-xs text-outline">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {featuredArticle.published_at
                              ? new Date(featuredArticle.published_at).toLocaleDateString('vi-VN')
                              : 'Vừa xuất bản'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {calculateReadTime(featuredArticle.summary)} phút đọc
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            {featuredArticle.views_count.toLocaleString()} lượt xem
                          </span>
                        </div>

                        <Link href={`/tin-tuc/${featuredArticle.slug}`}>
                          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary hover:text-secondary transition-colors font-headline leading-tight">
                            {featuredArticle.title}
                          </h2>
                        </Link>

                        <p className="text-outline text-sm sm:text-base leading-relaxed line-clamp-4">
                          {featuredArticle.summary}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-surface-container-high flex items-center justify-between mt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">
                            {featuredArticle.author.display_name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-primary">
                              {featuredArticle.author.display_name}
                            </div>
                            <div className="text-[11px] text-outline">Chuyên viên Thẩm định</div>
                          </div>
                        </div>

                        <Link
                          href={`/tin-tuc/${featuredArticle.slug}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-secondary transition-colors"
                        >
                          <span>Đọc chi tiết</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid of Remaining Articles */}
              {regularArticles.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                    <h3 className="text-xl font-bold text-primary font-headline">
                      Bài viết mới cập nhật
                    </h3>
                    <span className="text-xs text-outline font-medium">
                      {regularArticles.length} bài viết
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularArticles.map((art) => (
                      <article
                        key={art.id}
                        className="group flex flex-col rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary/40 transition-all duration-300 shadow-xs hover:shadow-lg overflow-hidden"
                      >
                        {/* Thumbnail */}
                        <Link
                          href={`/tin-tuc/${art.slug}`}
                          className="relative h-48 w-full overflow-hidden bg-surface-container-high block shrink-0"
                        >
                          {art.thumbnail_url ? (
                            <img
                              src={art.thumbnail_url}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline">
                              <BookOpen className="w-10 h-10" />
                            </div>
                          )}
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                            {art.category}
                          </span>
                        </Link>

                        {/* Article Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 text-[11px] text-outline">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {art.published_at
                                  ? new Date(art.published_at).toLocaleDateString('vi-VN')
                                  : 'Gần đây'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {calculateReadTime(art.summary)} phút đọc
                              </span>
                            </div>

                            <Link href={`/tin-tuc/${art.slug}`}>
                              <h4 className="text-base font-bold text-primary group-hover:text-secondary transition-colors line-clamp-2 leading-snug">
                                {art.title}
                              </h4>
                            </Link>

                            {art.summary && (
                              <p className="text-xs text-outline line-clamp-2 leading-relaxed">
                                {art.summary}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-surface-container-high flex items-center justify-between text-xs text-outline">
                            <span className="font-medium text-primary">
                              {art.author.display_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {art.views_count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* Luxury AI Valuation Callout */}
              <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-primary via-primary-container to-secondary-container text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/20">
                    <Sparkles className="w-3.5 h-3.5 text-secondary-fixed" />
                    <span>AuraAuto Intelligence</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-headline leading-tight">
                    Định giá ô tô tức thì với thuật toán CatBoost AI
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                    Nhập thông số xe hoặc tải ảnh đăng kiểm để nhận ngay phân tích khoảng giá thị trường chuẩn xác với sai số dưới 3.5%.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <Link
                      href="/dinh-gia-ai"
                      className="px-6 py-3 rounded-xl bg-white text-primary text-sm font-bold hover:bg-secondary hover:text-white transition-all shadow-md"
                    >
                      Trải nghiệm Định giá AI
                    </Link>
                    <Link
                      href="/xe"
                      className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all border border-white/20"
                    >
                      Khám phá xe sẵn có
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
