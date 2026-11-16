'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PromoteListingModal } from '@/features/cars';
import {
  useCarDetail,
  CarBreadcrumbBar,
  CarGallery,
  CarHeaderPricing,
  CarValuationCard,
  CarInspectionCard,
  CarSpecsTable,
  SellerContactCard,
  SimilarCarsSection,
  ChatModal,
  ToastNotification,
} from '@/features/car-detail';

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useCurrentUser();
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);

  const {
    listing,
    valuation,
    valuationLoading,
    requestValuation,
    similarCars,
    similarLoading,
    loading,
    error,
    galleryImages,
    originalPriceEstimate,
    gaugePercent,
    isSaved,
    chatModalOpen,
    setChatModalOpen,
    toastMessage,
    showToast,
    handleToggleSave,
    handleShare,
  } = useCarDetail(id);

  const isOwner = Boolean(
    user &&
    listing &&
    (listing.seller?.id || listing.seller_id) &&
    String(user.id).toLowerCase() === String(listing.seller?.id || listing.seller_id).toLowerCase()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
        <Navbar />
        <main className="w-full pt-20 bg-surface flex-1 flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">
              Đang tải dữ liệu hồ sơ xe chuẩn xác từ hệ thống...
            </span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
        <Navbar />
        <main className="w-full pt-20 bg-surface flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6 p-8 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-lg">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline">
              <span className="material-symbols-outlined text-[32px]">directions_car</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary font-semibold">
              Không tìm thấy thông tin xe
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Chiếc xe bạn đang tìm kiếm có thể đã được giao dịch thành công, bị chủ xe gỡ tin hoặc đường dẫn không còn hiệu lực.
            </p>
            <div className="pt-2">
              <Link
                href="/xe"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Khám phá bộ sưu tập xe khác</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed flex flex-col">
      <Navbar />

      <main className="w-full pt-28 pb-16 bg-surface min-h-[calc(100vh-20rem)] flex-1">
        <div className="flex flex-col w-full">
          {/* 1. Slim Elegant Breadcrumb & Quick Actions Bar */}
          <CarBreadcrumbBar
            listing={listing}
            isSaved={isSaved}
            onToggleSave={handleToggleSave}
            onShare={handleShare}
          />

          {/* 2. Primary Cinematic Gallery Showcase */}
          <CarGallery
            images={galleryImages}
            title={listing.title}
            condition={listing.condition}
            isVerified={true}
          />

          {/* Owner Promotion Banner */}
          {isOwner && (
            <div className="w-full px-margin-mobile lg:px-margin mt-4 mb-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-secondary-container/30 border border-secondary/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-secondary-container text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">campaign</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-primary font-headline">
                        Tối ưu hiệu quả tin đăng của bạn
                      </h4>
                      {listing.is_featured && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary font-bold uppercase tracking-wider">
                          Tin Nổi Bật
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 max-w-2xl leading-relaxed">
                      {listing.is_featured
                        ? `Tin xe đang được ưu tiên hiển thị tại chuyên mục Tin Nổi Bật trang chủ (đến ${listing.featured_until ? new Date(listing.featured_until).toLocaleDateString('vi-VN') : 'khi hết hạn'}). Bạn có thể gia hạn để tiếp tục duy trì vị trí.`
                        : 'Đưa bài đăng xe lên vị trí Nổi bật trang chủ để tối đa hóa tỷ lệ tiếp cận khách mua tiềm năng và rút ngắn thời gian giao dịch.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoteModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-secondary hover:bg-on-secondary-fixed text-on-secondary shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                  <span>{listing.is_featured ? 'Gia hạn nổi bật' : 'Đưa lên nổi bật'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Main Vehicle Information Placed DIRECTLY BELOW The Images */}
          <div className="w-full px-margin-mobile lg:px-margin pb-space-xl pt-space-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              {/* Left Column (8 cols): Vehicle Overview, Description, Specs, AI Valuation, Inspection */}
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                {/* 3.1 Primary Vehicle Overview & Pricing Card */}
                <CarHeaderPricing
                  listing={listing}
                  originalPriceEstimate={originalPriceEstimate}
                />

                {/* 3.2 Description from Seller & Full Technical Specifications */}
                <CarSpecsTable listing={listing} />

                {/* 3.3 On-demand Smart AI Valuation (Loaded ONLY upon user request) */}
                <CarValuationCard
                  priceVnd={listing.price_vnd}
                  valuation={valuation}
                  gaugePercent={gaugePercent}
                  loading={valuationLoading}
                  onRequestValuation={requestValuation}
                />

                {/* 3.4 Platform Guarantees & Buyer Protection */}
                <CarInspectionCard />
              </div>

              {/* Right Column (4 cols Sticky): Seller Profile & Direct Contact */}
              <div className="lg:col-span-4 flex flex-col gap-space-md lg:sticky lg:top-24">
                <SellerContactCard
                  listing={listing}
                  onOpenChat={() => setChatModalOpen(true)}
                />
              </div>
            </div>
          </div>

          {/* Similar Cars Recommendation */}
          <SimilarCarsSection cars={similarCars} loading={similarLoading} />

          {/* In-App Direct Chat Modal */}
          <ChatModal
            isOpen={chatModalOpen}
            listing={listing}
            onClose={() => setChatModalOpen(false)}
            onShowToast={showToast}
          />

          {/* Toast Notification */}
          <ToastNotification message={toastMessage} />

          {/* Promote Featured Listing Modal */}
          {listing && (
            <PromoteListingModal
              isOpen={promoteModalOpen}
              onClose={() => setPromoteModalOpen(false)}
              listingId={listing.id}
              listingTitle={listing.title}
              listingImageUrl={galleryImages?.[0]?.url || listing.primary_image_url}
              listingPriceVnd={listing.price_vnd}
              manufactureYear={listing.manufacture_year}
              currentFeaturedUntil={listing.featured_until}
              onSuccess={() => {
                setPromoteModalOpen(false);
                window.location.reload();
              }}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
