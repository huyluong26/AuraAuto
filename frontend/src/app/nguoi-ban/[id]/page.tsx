'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { useSellerProfile } from '@/features/seller-profile/hooks/useSellerProfile';
import { SellerHeroBanner } from '@/features/seller-profile/components/SellerHeroBanner';
import { SellerListingsSection } from '@/features/seller-profile/components/SellerListingsSection';

export default function PublicSellerProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const {
    profile,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    phoneRevealed,
    setPhoneRevealed,
    filteredListings,
    isShowroom,
    displayName,
    phone,
    maskedPhone,
    locationText,
  } = useSellerProfile(id);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
      <Navbar />

      <main className="w-full pt-20 pb-20 flex-1">
        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
            <p className="font-label-md text-label-md text-on-surface-variant font-medium">
              Đang tải thông tin hồ sơ và kho xe từ hệ thống...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <h2 className="font-headline-sm text-xl font-bold text-primary mb-2">
              Không thể tải hồ sơ người bán
            </h2>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
              {error}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/xe"
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all"
              >
                <span>Khám phá kho xe AuraAuto</span>
              </Link>
            </div>
          </div>
        )}

        {/* Loaded Profile Content */}
        {!loading && profile && (
          <div className="w-full">
            <SellerHeroBanner
              profile={profile}
              isShowroom={isShowroom}
              displayName={displayName}
              phone={phone}
              maskedPhone={maskedPhone}
              locationText={locationText}
              phoneRevealed={phoneRevealed}
              onRevealPhone={() => setPhoneRevealed(true)}
            />

            <SellerListingsSection
              profile={profile}
              isShowroom={isShowroom}
              filteredListings={filteredListings}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
