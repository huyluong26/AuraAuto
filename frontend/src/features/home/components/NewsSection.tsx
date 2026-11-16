/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import Link from 'next/link';
import { ArticleItem } from '@/types';
import { Calendar, Clock, ArrowRight, BookOpen, ChevronRight } from 'lucide-react';

interface NewsSectionProps {
  articles?: ArticleItem[];
}

const DEFAULT_ARTICLES: ArticleItem[] = [
  {
    id: 'news-1',
    title: 'Toàn bộ quy trình thủ tục sang tên đổi chủ ô tô cũ và biển số định danh 2026',
    slug: 'thu-tuc-sang-ten-doi-chu-o-to-cu-2026',
    summary:
      'Hướng dẫn chi tiết thủ tục công chứng hợp đồng mua bán, rút hồ sơ gốc trực tuyến qua Cổng Dịch vụ công Quốc gia và nộp lệ phí trước bạ không dùng tiền mặt.',
    thumbnail_url:
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    category: 'PHÁP LÝ',
    status: 'PUBLISHED',
    views_count: 424,
    author: {
      id: 'author-1',
      display_name: 'Hội đồng Pháp lý AuraAuto',
      avatar_url: '',
    },
    published_at: '2026-11-11T07:04:21.000Z',
    created_at: '2026-11-11T07:04:21.000Z',
  },
  {
    id: 'news-2',
    title: 'Xu hướng giá ô tô cũ cuối năm 2026: Cơ hội vàng cho người mua xe lướt',
    slug: 'xu-huong-gia-o-to-cu-cuoi-nam-2026-co-hoi-vang-cho-nguoi-mua-xe-luot',
    summary:
      'Phân tích toàn cảnh thị trường ô tô đã qua sử dụng quý 4/2026. Dữ liệu từ AuraAuto AI ghi nhận mức chiết khấu hấp dẫn ở phân khúc sedan và SUV hạng sang lướt dưới 20.000 km.',
    thumbnail_url:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    category: 'THỊ TRƯỜNG',
    status: 'PUBLISHED',
    views_count: 348,
    author: {
      id: 'author-2',
      display_name: 'Chuyên gia Phân tích Dữ liệu',
      avatar_url: '',
    },
    published_at: '2026-11-11T05:54:52.000Z',
    created_at: '2026-11-11T05:54:52.000Z',
  },
  {
    id: 'news-3',
    title: 'Kinh nghiệm chọn mua xe SUV hạng sang đã qua sử dụng an tâm tuyệt đối',
    slug: 'kinh-nghiem-chon-mua-xe-suv-2026',
    summary:
      'Cẩm nang hướng dẫn kiểm tra lịch sử xe, đánh giá tình trạng động cơ, hộp số tự động và các bước nghiệm thu hệ thống treo khí nén trên các dòng SUV cao cấp.',
    thumbnail_url:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    category: 'KINH NGHIỆM',
    status: 'PUBLISHED',
    views_count: 513,
    author: {
      id: 'author-3',
      display_name: 'Kỹ sư Giám định Trưởng',
      avatar_url: '',
    },
    published_at: '2026-11-11T06:46:27.000Z',
    created_at: '2026-11-11T06:46:27.000Z',
  },
  {
    id: 'news-4',
    title: 'Đánh giá chi tiết pin và hệ thống trạm sạc xe điện tại Việt Nam 2026',
    slug: 'danh-gia-xe-dien-2026',
    summary:
      'Phân tích độ thoái hóa pin Lithium-ion sau 50.000 km vận hành thực tế tại khí hậu nhiệt đới gió mùa Việt Nam và mạng lưới trạm sạc siêu nhanh 360kW.',
    thumbnail_url:
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
    category: 'ĐÁNH GIÁ XE',
    status: 'PUBLISHED',
    views_count: 690,
    author: {
      id: 'author-4',
      display_name: 'Bộ phận Thử nghiệm & Đánh giá',
      avatar_url: '',
    },
    published_at: '2026-11-11T06:46:27.000Z',
    created_at: '2026-11-11T06:46:27.000Z',
  },
];

function calculateReadTime(text?: string): number {
  if (!text) return 3;
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 150));
}

export default function NewsSection({ articles }: NewsSectionProps) {
  const displayArticles = articles && articles.length > 0 ? articles : DEFAULT_ARTICLES;
  const featured = displayArticles[0];
  const sideArticles = displayArticles.slice(1, 4);

  return (
    <section className="w-full bg-surface-container-low/50 py-space-xl border-t border-outline-variant/20">
      <div className="w-full px-margin-mobile md:px-margin max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-space-lg">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/60 text-secondary text-xs font-semibold uppercase tracking-wider mb-2 border border-secondary/20">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kiến Thức & Thị Trường</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-medium">
              Tin tức & Cẩm nang mua bán ô tô
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-2xl">
              Cập nhật biến động giá xe, kinh nghiệm kiểm định độc lập và hướng dẫn pháp lý sang tên mới nhất từ chuyên gia.
            </p>
          </div>

          <Link
            href="/tin-tuc"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-secondary transition-colors group flex-shrink-0"
          >
            <span>Xem tất cả tin tức</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Bố cục Tin Tức: 1 Bài Nổi Bật (Lớn) + 3 Bài Cập Nhật Nhanh (Bên Phải) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Cột Trái: Bài viết Tiêu điểm */}
          {featured && (
            <div className="lg:col-span-7">
              <Link
                href={`/tin-tuc/${featured.slug}`}
                className="group flex flex-col h-full rounded-2xl bg-surface-container-lowest hover:bg-surface border border-outline-variant/30 hover:border-secondary/40 overflow-hidden transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(114,90,55,0.12)] hover:-translate-y-1"
              >
                {/* Ảnh bài viết nổi bật */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-high">
                  <img
                    src={featured.thumbnail_url || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'}
                    alt={featured.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-semibold tracking-wider uppercase shadow-md backdrop-blur-md">
                      {featured.category}
                    </span>
                  </div>
                </div>

                {/* Nội dung bài viết */}
                <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
                  <div>
                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant/80 mb-2.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {featured.published_at
                          ? new Date(featured.published_at).toLocaleDateString('vi-VN')
                          : 'Vừa xuất bản'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {calculateReadTime(featured.summary)} phút đọc
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-headline-md text-lg sm:text-xl font-bold text-primary group-hover:text-secondary transition-colors line-clamp-2 leading-snug mb-2">
                      {featured.title}
                    </h3>

                    {/* Summary */}
                    <p className="font-body-sm text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
                      {featured.summary}
                    </p>
                  </div>

                  {/* Footer callout */}
                  <div className="pt-4 mt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-secondary">
                    <span>Đọc toàn bộ bài phân tích</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Cột Phải: Danh sách 3 bài viết tiếp theo */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {sideArticles.map((article) => (
              <Link
                key={article.id}
                href={`/tin-tuc/${article.slug}`}
                className="group p-3.5 sm:p-4 rounded-2xl bg-surface-container-lowest hover:bg-surface border border-outline-variant/30 hover:border-secondary/40 flex gap-4 items-center transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(114,90,55,0.1)] hover:-translate-y-0.5 flex-1"
              >
                {/* Thumbnail nhỏ */}
                <div className="relative w-28 sm:w-36 aspect-[16/11] rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                  <img
                    src={article.thumbnail_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm uppercase">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Tiêu đề & Thông tin */}
                <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant/70 mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString('vi-VN')
                        : 'Mới cập nhật'}
                    </span>
                    <span>•</span>
                    <span>{calculateReadTime(article.summary)} phút</span>
                  </div>

                  <h4 className="font-label-lg text-sm sm:text-base font-semibold text-primary group-hover:text-secondary transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h4>

                  <div className="mt-2 text-[11px] font-medium text-secondary inline-flex items-center gap-1">
                    <span>Xem chi tiết</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
