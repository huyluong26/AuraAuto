'use client';

import React from 'react';
import { useCarSearchFilter } from '@/features/cars';

export default function HeroSearchFilter() {
  const {
    brand,
    setBrand,
    bodyType,
    setBodyType,
    priceRange,
    setPriceRange,
    year,
    setYear,
    handleSearch,
    handleQuickFilter,
  } = useCarSearchFilter();

  return (
    <div className="mt-space-xl w-full bg-surface-container-lowest/95 backdrop-blur-2xl p-space-md sm:p-space-lg rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md items-end">
        {/* Thương hiệu */}
        <div className="space-y-1.5">
          <label className="block font-label-md text-label-md text-on-surface-variant font-medium">Thương hiệu</label>
          <div className="relative">
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full h-12 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Tất cả thương hiệu</option>
              <option value="porsche">Porsche</option>
              <option value="mercedes">Mercedes-Benz</option>
              <option value="bmw">BMW</option>
              <option value="landrover">Range Rover</option>
              <option value="audi">Audi</option>
              <option value="lexus">Lexus</option>
              <option value="bentley">Bentley</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant text-[20px]">
              expand_more
            </span>
          </div>
        </div>

        {/* Kiểu dáng */}
        <div className="space-y-1.5">
          <label className="block font-label-md text-label-md text-on-surface-variant font-medium">Kiểu dáng</label>
          <div className="relative">
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className="w-full h-12 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Tất cả kiểu dáng</option>
              <option value="sedan">Sedan Hạng sang</option>
              <option value="suv">SUV / Crossover</option>
              <option value="coupe">Coupe Thể thao</option>
              <option value="gran-turismo">Gran Turismo</option>
              <option value="electric">Xe thuần điện EV</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant text-[20px]">
              expand_more
            </span>
          </div>
        </div>

        {/* Khoảng giá */}
        <div className="space-y-1.5">
          <label className="block font-label-md text-label-md text-on-surface-variant font-medium">Khoảng giá</label>
          <div className="relative">
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full h-12 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Mọi mức ngân sách</option>
              <option value="u1">Dưới 1 tỷ ₫</option>
              <option value="1-2">1 - 2 tỷ ₫</option>
              <option value="2-5">2 - 5 tỷ ₫</option>
              <option value="o5">Trên 5 tỷ ₫ (Flagship)</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant text-[20px]">
              expand_more
            </span>
          </div>
        </div>

        {/* Năm sản xuất */}
        <div className="space-y-1.5">
          <label className="block font-label-md text-label-md text-on-surface-variant font-medium">Năm sản xuất</label>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full h-12 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Tất cả các năm</option>
              <option value="2024">2024 (Mới nhất)</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2020-2021">2020 - 2021</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant text-[20px]">
              expand_more
            </span>
          </div>
        </div>

        {/* Nút Hành động Deep Charcoal */}
        <div>
          <button
            type="submit"
            className="w-full h-12 px-space-lg rounded-lg bg-primary hover:bg-inverse-surface text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-colors shadow-[0_8px_20px_rgba(0,0,0,0.25)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
            <span>Tìm kiếm xe</span>
          </button>
        </div>
      </form>

      {/* Quick Filters Micro-strip */}
      <div className="mt-space-md pt-space-sm flex flex-wrap items-center gap-2">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mr-1">
          Bộ lọc nhanh:
        </span>
        {['Mercedes S-Class', 'Porsche Macan', 'Range Rover Sport', 'Lexus RX 350'].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleQuickFilter(chip)}
            className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
