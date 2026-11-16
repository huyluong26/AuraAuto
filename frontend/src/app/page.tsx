import React from 'react';
import { Navbar, Footer } from '@/components/layout';
import {
  HeroSection,
  FeaturedCarsSection,
  BrandShowcaseSection,
  AIValuationShowcaseSection,
  LatestCarsSection,
  NewsSection,
  ConciergeBannerSection,
  LuxuryCarItem,
} from '@/features/home';
import { api, formatVND } from '@/lib/api';
import { ListingItem, ArticleItem } from '@/types';
import { PROVINCE_MAP } from '@/features/auth/constants/provinces';
import { detectProvinceFromText } from '@/features/car-listing/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AuraAuto - Nền tảng Giao dịch & Thẩm định Ô tô Cao cấp',
  description:
    'Sàn giao dịch ô tô trực tiếp người mua & chủ xe không qua trung gian. Định giá xe chuẩn xác bằng công nghệ AI.',
};

function mapListingToLuxuryCar(item: ListingItem): LuxuryCarItem {
  const detectedCode = !item.province_code && item.location_address ? detectProvinceFromText(item.location_address) : null;
  const pCode = item.province_code || detectedCode;
  const provinceName =
    item.province_name ||
    (pCode ? PROVINCE_MAP[pCode] || pCode : undefined);
  const location = provinceName || 'Toàn quốc';

  return {
    id: item.id,
    title: item.title,
    subtitle: `Đời ${item.manufacture_year} • ${item.body_type || 'Hạng sang'}`,
    year: item.manufacture_year,
    odometer: `${(item.odometer_km || 0).toLocaleString('vi-VN')} km`,
    transmission: item.transmission === 'AUTOMATIC' ? 'Tự động' : 'Số sàn',
    fuel: item.fuel_type === 'GASOLINE' ? 'Xăng' : item.fuel_type === 'DIESEL' ? 'Dầu' : 'Điện EV',
    priceVnd: item.price_vnd,
    formattedPrice: formatVND(item.price_vnd),
    location: location,
    marketStatus: 'Đã kiểm định',
    badge1: location,
    badge2: 'Đã xác thực',
    isFeatured: item.is_featured,
    featuredTier: item.featured_tier,
    imageUrl:
      item.primary_image_url ||
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    detailUrl: `/xe/${item.id}`,
  };
}

export default async function HomePage() {
  let liveCars: LuxuryCarItem[] = [];
  let featuredCars: LuxuryCarItem[] = [];
  let latestArticles: ArticleItem[] = [];

  try {
    const featuredRes = await api.getFeaturedListings(6);
    if (featuredRes && featuredRes.length > 0) {
      featuredCars = featuredRes.map(mapListingToLuxuryCar);
    }
  } catch {
    featuredCars = [];
  }

  try {
    const res = await api.getListings({ page_size: 12 });
    if (res && res.items && res.items.length > 0) {
      liveCars = res.items.map(mapListingToLuxuryCar);
    }
  } catch {
    liveCars = [];
  }

  try {
    const articlesRes = await api.getArticles({ limit: 4 });
    if (articlesRes && articlesRes.length > 0) {
      latestArticles = articlesRes;
    }
  } catch {
    latestArticles = [];
  }

  const latestCars = liveCars.slice(0, 8);

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed flex flex-col min-h-screen">
      {/* 1. Header Navigation dùng chung */}
      <Navbar />

      {/* 2. Main Page Content */}
      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-20rem)] flex-1">
        <div className="flex flex-col w-full">
          {/* Hero Section Điện Ảnh & Tìm Kiếm Xe Tương Tác */}
          <HeroSection />

          {/* Xe Nổi Bật từ Cơ sở dữ liệu: Chỉ hiển thị khi có tin xe đang chạy dịch vụ nổi bật */}
          {featuredCars.length > 0 && (
            <FeaturedCarsSection customCars={featuredCars} />
          )}

          {/* Khám Phá Theo Thương Hiệu Danh Tiếng */}
          <BrandShowcaseSection />

          {/* Section Đột Phá Công Nghệ: Định Giá Xe AI & Machine Learning */}
          <AIValuationShowcaseSection />

          {/* Xe Mới Đăng Bán & Hạ Tầng Bảo Vệ Giao Dịch P2P */}
          <LatestCarsSection customCars={latestCars} />

          {/* Tin Tức & Cẩm Nang Mua Bán Ô Tô */}
          <NewsSection articles={latestArticles} />

          {/* Banner Dịch Vụ Concierge Dành Riêng Cho Chủ Xe */}
          <ConciergeBannerSection />
        </div>
      </main>

      {/* 3. Footer Dùng Chung */}
      <Footer />
    </div>
  );
}
