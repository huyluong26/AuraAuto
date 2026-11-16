'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BrandItemConfig {
  name: string;
  query: string;
  logo: string;
  category: 'luxury' | 'popular';
}

const BRANDS: BrandItemConfig[] = [
  // Hạng sang & Thể thao
  {
    name: 'Mercedes-Benz',
    query: 'Mercedes Benz',
    logo: '/brands/mercedes-benz.png',
    category: 'luxury',
  },
  {
    name: 'Porsche',
    query: 'Porsche',
    logo: '/brands/porsche.png',
    category: 'luxury',
  },
  {
    name: 'BMW',
    query: 'BMW',
    logo: '/brands/bmw.png',
    category: 'luxury',
  },
  {
    name: 'Audi',
    query: 'Audi',
    logo: '/brands/audi.png',
    category: 'luxury',
  },
  {
    name: 'Lexus',
    query: 'Lexus',
    logo: '/brands/lexus.png',
    category: 'luxury',
  },
  {
    name: 'Land Rover',
    query: 'Land Rover',
    logo: '/brands/land-rover.png',
    category: 'luxury',
  },
  {
    name: 'Volvo',
    query: 'Volvo',
    logo: '/brands/volvo.png',
    category: 'luxury',
  },
  {
    name: 'Bentley',
    query: 'Bentley',
    logo: '/brands/bentley.png',
    category: 'luxury',
  },
  // Phổ biến tại Việt Nam
  {
    name: 'Toyota',
    query: 'Toyota',
    logo: '/brands/toyota.png',
    category: 'popular',
  },
  {
    name: 'Hyundai',
    query: 'Hyundai',
    logo: '/brands/hyundai.png',
    category: 'popular',
  },
  {
    name: 'Honda',
    query: 'Honda',
    logo: '/brands/honda.png',
    category: 'popular',
  },
  {
    name: 'Mazda',
    query: 'Mazda',
    logo: '/brands/mazda.png',
    category: 'popular',
  },
  {
    name: 'Ford',
    query: 'Ford',
    logo: '/brands/ford.png',
    category: 'popular',
  },
  {
    name: 'Kia',
    query: 'Kia',
    logo: '/brands/kia.png',
    category: 'popular',
  },
  {
    name: 'VinFast',
    query: 'VinFast',
    logo: '/brands/vinfast.png',
    category: 'popular',
  },
  {
    name: 'Mitsubishi',
    query: 'Mitsubishi',
    logo: '/brands/mitsubishi.png',
    category: 'popular',
  },
];

type CategoryFilter = 'all' | 'luxury' | 'popular';

export default function BrandShowcaseSection() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filteredBrands = BRANDS.filter((brand) => {
    if (activeCategory === 'all') return true;
    return brand.category === activeCategory;
  });

  return (
    <section className="w-full bg-surface-container-low py-space-xl border-y border-outline-variant/20">
      <div className="w-full px-margin-mobile md:px-margin max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block mb-1">
            Đối Tác Chế Tác Đỉnh Cao
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-medium">
            Khám phá theo thương hiệu danh tiếng
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Khám phá các dòng xe nổi bật với logo chính hãng từ những thương hiệu ô tô hàng đầu thế giới.
          </p>

          {/* Phân loại bộ lọc */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-surface-container-high/60 rounded-full mt-6 border border-outline-variant/30">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/60'
              }`}
            >
              Tất cả ({BRANDS.length})
            </button>
            <button
              onClick={() => setActiveCategory('luxury')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === 'luxury'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/60'
              }`}
            >
              Hạng sang & Siêu xe
            </button>
            <button
              onClick={() => setActiveCategory('popular')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === 'popular'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/60'
              }`}
            >
              Phổ biến tại VN
            </button>
          </div>
        </div>

        {/* Lưới thương hiệu với logo thật - Tối giản, thuần logo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {filteredBrands.map((brand) => (
            <Link
              key={brand.name}
              href={`/xe?brand=${encodeURIComponent(brand.query)}`}
              title={brand.name}
              aria-label={brand.name}
              className="group h-20 sm:h-24 p-3 rounded-2xl bg-surface-container-lowest hover:bg-surface border border-outline-variant/30 hover:border-secondary/40 flex items-center justify-center transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_24px_rgba(114,90,55,0.12)] hover:-translate-y-1 cursor-pointer"
            >
              {/* Vùng logo chính hãng */}
              <div className="w-full h-full flex items-center justify-center relative">
                <Image
                  src={brand.logo}
                  alt={`Logo ${brand.name}`}
                  width={84}
                  height={56}
                  className="max-h-12 max-w-[80px] w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
