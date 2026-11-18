'use client';

import React, { Suspense } from 'react';
import { Navbar, Footer } from '@/components/layout';
import {
  CarCatalogSidebar,
  CarCatalogToolbar,
  CarCatalogGrid,
  useCarCatalog,
} from '@/features/cars';
import { X } from 'lucide-react';

function XeContent() {
  const {
    keyword,
    setKeyword,
    selectedBrand,
    setSelectedBrand,
    selectedProvince,
    setSelectedProvince,
    priceIndex,
    setPriceIndex,
    setCustomPrice,
    yearIndex,
    setYearIndex,
    setCustomYear,
    selectedBody,
    setSelectedBody,
    selectedTransmission,
    setSelectedTransmission,
    selectedFuel,
    setSelectedFuel,
    odoIndex,
    setOdoIndex,
    sortBy,
    setSortBy,
    showMobileFilter,
    setShowMobileFilter,
    currentPage,
    setCurrentPage,
    totalItems,
    totalPages,
    listings,
    loading,
    hasActiveFilters,
    resetFilters,
    handlePageChange,
  } = useCarCatalog();

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Sort Toolbar */}
      <CarCatalogToolbar
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        keyword={keyword}
        setKeyword={setKeyword}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showMobileFilter={showMobileFilter}
        setShowMobileFilter={setShowMobileFilter}
        hasActiveFilters={hasActiveFilters}
        resetFilters={resetFilters}
        selectedProvince={selectedProvince}
        setSelectedProvince={setSelectedProvince}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        priceIndex={priceIndex}
        setPriceIndex={setPriceIndex}
        yearIndex={yearIndex}
        setYearIndex={setYearIndex}
        selectedBody={selectedBody}
        setSelectedBody={setSelectedBody}
        selectedTransmission={selectedTransmission}
        setSelectedTransmission={setSelectedTransmission}
        selectedFuel={selectedFuel}
        setSelectedFuel={setSelectedFuel}
        odoIndex={odoIndex}
        setOdoIndex={setOdoIndex}
        onFilterChangeResetPage={() => setCurrentPage(1)}
      />

      {/* Main Content Layout: Left Sidebar + 4 Cars per Row Grid */}
      <div className="flex flex-col lg:flex-row gap-7 items-start">
        {/* Left Sidebar Filter (Desktop & Mobile Drawer) */}
        <aside
          className={`w-full lg:w-72 shrink-0 ${
            showMobileFilter
              ? 'fixed inset-0 z-50 bg-[#faf9f6] p-6 overflow-y-auto block'
              : 'hidden lg:block'
          }`}
        >
          {showMobileFilter && (
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#eae8e3] lg:hidden">
              <span className="font-bold font-display text-base text-[#1a1c1a]">Bộ lọc tìm kiếm</span>
              <button
                type="button"
                onClick={() => setShowMobileFilter(false)}
                className="p-1 rounded-lg text-outline hover:text-primary cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          <CarCatalogSidebar
            selectedProvince={selectedProvince}
            setSelectedProvince={(p) => {
              setSelectedProvince(p);
              setCurrentPage(1);
            }}
            selectedBrand={selectedBrand}
            setSelectedBrand={(b) => {
              setSelectedBrand(b);
              setCurrentPage(1);
            }}
            priceIndex={priceIndex}
            setPriceIndex={(pi) => {
              setPriceIndex(pi);
              setCurrentPage(1);
            }}
            setCustomPrice={setCustomPrice}
            yearIndex={yearIndex}
            setYearIndex={(yi) => {
              setYearIndex(yi);
              setCurrentPage(1);
            }}
            setCustomYear={setCustomYear}
            selectedBody={selectedBody}
            setSelectedBody={(b) => {
              setSelectedBody(b);
              setCurrentPage(1);
            }}
            selectedTransmission={selectedTransmission}
            setSelectedTransmission={(t) => {
              setSelectedTransmission(t);
              setCurrentPage(1);
            }}
            selectedFuel={selectedFuel}
            setSelectedFuel={(f) => {
              setSelectedFuel(f);
              setCurrentPage(1);
            }}
            odoIndex={odoIndex}
            setOdoIndex={(oi) => {
              setOdoIndex(oi);
              setCurrentPage(1);
            }}
            hasActiveFilters={hasActiveFilters}
            resetFilters={resetFilters}
            onFilterApplied={() => setShowMobileFilter(false)}
            isMobile={showMobileFilter}
          />
        </aside>

        {/* Cars Grid Area */}
        <section className="flex-1 min-w-0 w-full space-y-6">
          <CarCatalogGrid
            listings={listings}
            loading={loading}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            resetFilters={resetFilters}
          />
        </section>
      </div>
    </div>
  );
}

export default function XePage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans text-[#1a1c1a]">
      <Navbar />
      <main className="flex-1 pt-28 sm:pt-32 pb-16">
        <Suspense
          fallback={<div className="py-20 text-center text-[#777777]">Đang tải dữ liệu...</div>}
        >
          <XeContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
