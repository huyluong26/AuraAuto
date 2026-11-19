'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { PromoteListingModal } from '@/features/cars';
import { EditListingModal } from '@/features/car-listing';
import { ConfirmDialogModal } from '@/features/admin/components/ui/ConfirmDialogModal';
import {
  useUserListings,
  ListingStatusTabs,
  ListingManagementCardList,
  QuickPriceEditModal,
  DeleteListingModal,
} from '@/features/user-listings';

export default function UserListingsManagementPage() {
  const {
    isLoaded,
    isLoggedIn,
    listings,
    summary,
    loading,
    actionLoadingId,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    sortBy,
    setSortBy,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    refresh,
    selectedIds,
    activeMenuId,
    setActiveMenuId,
    isAllSelected,
    isPartiallySelected,
    handleSelectAll,
    handleToggleSelect,
    handleToggleHide,
    handleMarkSold,
    handleRelist,
    handleSubmitReview,
    handleConfirmDelete,
    handleSaveQuickPrice,
    handleBulkToggleHide,
    statusTabs,
    // Modals
    selectedPromoteListing,
    setSelectedPromoteListing,
    editingFullListingId,
    setEditingFullListingId,
    editingPriceListing,
    setEditingPriceListing,
    updatingPrice,
    deletingListing,
    setDeletingListing,
    deletingInProgress,
    confirmModal,
    setConfirmModal,
    toast,
    setToast,
    showToast,
  } = useUserListings();

  if (!isLoaded || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans text-[#1a1c1a] antialiased">
        <Navbar />
        <main className="w-full pt-32 pb-20 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-[#111827] border-t-transparent animate-spin" />
            <p className="text-xs text-[#6b7280] font-medium tracking-wide">Đang xác thực tài khoản...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] font-sans text-[#1a1c1a] antialiased flex flex-col">
      <Navbar />

      {/* Luxury Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-2 duration-300 max-w-md">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-body-sm ${
              toast.type === 'success'
                ? 'bg-surface-container-lowest border-secondary text-primary'
                : 'bg-error-container border-error text-on-error-container'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 ${
                toast.type === 'success' ? 'text-secondary' : 'text-error'
              }`}
            >
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <div className="flex-1 min-w-0 pr-1">
              <p className="font-medium leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded text-outline hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full space-y-6">
        {/* Title Header matching /lich-hen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#888] mb-1 font-medium">
              <Link href="/" className="hover:text-[#111827] transition-colors">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/tai-khoan" className="hover:text-[#111827] transition-colors">
                Tài khoản
              </Link>
              <span>/</span>
              <span className="text-[#111827] font-semibold">Quản lý tin đăng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1c1a] tracking-tight">
              Quản Lý Tin Đăng Bán Xe
            </h1>
            <p className="text-xs sm:text-sm text-[#777777] mt-1">
              Kiểm soát trạng thái hiển thị, theo dõi duyệt tin và các thao tác giao dịch xe trên AuraAuto.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-[#eae8e3] bg-white hover:bg-[#faf9f6] text-[#1a1c1a] transition text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
              title="Làm mới dữ liệu"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  loading ? 'animate-spin text-[#b89b72]' : 'text-[#777777]'
                }`}
              >
                refresh
              </span>
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            <Link
              href="/dang-tin"
              className="px-4 py-2 rounded-lg bg-[#191919] hover:bg-black text-white transition text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Đăng tin bán xe</span>
            </Link>
          </div>
        </div>

        {/* Filter Capsule Tabs matching /lich-hen */}
        <div className="inline-flex p-1 bg-white rounded-lg border border-[#eae8e3] shadow-sm overflow-x-auto max-w-full no-scrollbar">
          {statusTabs.map((tab) => {
            const isActive = filterStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilterStatus(tab.key);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#191919] text-white shadow-xs'
                    : 'text-[#777777] hover:text-[#1a1c1a] hover:bg-black/[0.02]'
                }`}
              >
                {tab.isVip && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0" />
                )}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-none ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-[#f4f3f0] text-[#777777]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Bar matching /lich-hen */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#eae8e3] shadow-2xs">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên xe, năm sản xuất, mã tin..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#eae8e3] bg-[#faf9f6] text-xs text-[#1a1c1a] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#b89b72] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-[#777777]">
              <span className="material-symbols-outlined text-[16px] text-[#b89b72]">sort</span>
              <span className="hidden sm:inline">Sắp xếp:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-[#eae8e3] bg-[#faf9f6] text-xs font-medium text-[#1a1c1a] focus:outline-none focus:border-[#b89b72] cursor-pointer"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
              <option value="views_desc">Xem nhiều nhất</option>
            </select>
          </div>
        </div>

        {/* Real Car Listing Cards matching /lich-hen */}
        <ListingManagementCardList
          listings={listings}
          loading={loading}
          actionLoadingId={actionLoadingId}
          onQuickEditPrice={(item) => setEditingPriceListing(item)}
          onFullEdit={(id) => setEditingFullListingId(id)}
          onPromote={(item) => setSelectedPromoteListing(item)}
          onRelist={handleRelist}
          onSubmitReview={handleSubmitReview}
          onToggleHide={handleToggleHide}
          onMarkSold={handleMarkSold}
          onDelete={(item) => setDeletingListing(item)}
          filterStatus={filterStatus}
          searchQuery={debouncedSearch}
          onResetFilters={() => {
            setSearchQuery('');
            setFilterStatus('ALL');
          }}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </main>

      <Footer />

      {/* MODAL 1: Promote Featured Listing with VNPay */}
      {selectedPromoteListing && (
        <PromoteListingModal
          isOpen={!!selectedPromoteListing}
          onClose={() => setSelectedPromoteListing(null)}
          listingId={selectedPromoteListing.id}
          listingTitle={selectedPromoteListing.title}
          listingImageUrl={selectedPromoteListing.primary_image_url}
          listingPriceVnd={selectedPromoteListing.price_vnd}
          manufactureYear={selectedPromoteListing.manufacture_year}
          currentFeaturedUntil={selectedPromoteListing.featured_until}
          onSuccess={() => {
            setSelectedPromoteListing(null);
            refresh();
          }}
        />
      )}

      {/* MODAL 2: Quick Update Price */}
      {editingPriceListing && (
        <QuickPriceEditModal
          listing={editingPriceListing}
          updating={updatingPrice}
          onClose={() => setEditingPriceListing(null)}
          onSave={handleSaveQuickPrice}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* MODAL 3: Confirm Delete Listing */}
      {deletingListing && (
        <DeleteListingModal
          listing={deletingListing}
          deleting={deletingInProgress}
          onClose={() => setDeletingListing(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* MODAL 4: Custom Luxury Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <ConfirmDialogModal
          isOpen={confirmModal.isOpen}
          options={{
            title: confirmModal.title,
            message: confirmModal.message,
            confirmText: confirmModal.confirmText,
            cancelText: confirmModal.cancelText,
            variant: confirmModal.variant,
          }}
          onConfirm={() => {
            const cb = confirmModal.onConfirm;
            setConfirmModal(null);
            cb();
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* MODAL 5: Full Edit Listing Modal */}
      {editingFullListingId && (
        <EditListingModal
          listingId={editingFullListingId}
          onClose={() => setEditingFullListingId(null)}
          onSuccess={() => {
            refresh();
            showToast('Đã lưu và gửi bản chỉnh sửa tin đăng xe thành công!', 'success');
          }}
        />
      )}
    </div>
  );
}
