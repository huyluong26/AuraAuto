'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { PromoteListingModal } from '@/features/cars';
import { EditListingModal } from '@/features/car-listing';
import { ConfirmDialogModal } from '@/features/admin/components/ui/ConfirmDialogModal';
import {
  useUserListings,
  ListingStatsOverview,
  ListingStatusTabs,
  ListingFilterToolbar,
  ListingManagementTable,
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
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md">
          <div
            className={`px-4 py-3.5 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.35)] border flex items-center gap-3.5 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-[#121315]/95 text-white border-[#2c2d30]'
                : 'bg-[#1a0f0f]/95 text-white border-rose-900/60'
            }`}
          >
            <div
              className={`w-1 h-9 rounded-full shrink-0 ${
                toast.type === 'success'
                  ? 'bg-gradient-to-b from-[#d4af37] to-[#8c6d3b]'
                  : 'bg-rose-500'
              }`}
            />
            <div className="flex-1 min-w-0 pr-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37]">
                {toast.type === 'success' ? 'Hệ thống thông báo' : 'Cảnh báo thao tác'}
              </div>
              <p className="text-xs sm:text-sm font-medium text-neutral-200 mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      <main className="w-full pt-28 pb-16 bg-[#faf9f6] min-h-[calc(100vh-18rem)] flex-1">
        <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header & Primary Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e0]">
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
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight font-headline">
                  Quản lý tin đăng bán xe
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-200/70 text-neutral-800">
                  {summary.total_listings} tin
                </span>
              </div>
              <p className="text-xs text-[#666] mt-0.5">
                Kiểm soát trạng thái hiển thị, theo dõi kiểm duyệt và điều chỉnh giá bán xe trên sàn AuraAuto.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="px-3 py-1.5 rounded-md border border-[#d8d6d0] bg-white hover:bg-[#faf9f6] text-[#334155] hover:text-[#0f172a] transition-all text-xs font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs active:scale-[0.99]"
                title="Làm mới dữ liệu"
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    loading ? 'animate-spin text-[#8c6d3b]' : 'text-[#64748b]'
                  }`}
                >
                  refresh
                </span>
                <span className="hidden sm:inline">Làm mới</span>
              </button>

              <Link
                href="/dang-tin"
                className="px-3.5 py-1.5 rounded-md bg-[#0f172a] hover:bg-black text-white border border-neutral-800 transition-all text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Đăng tin bán xe</span>
              </Link>
            </div>
          </div>

          {/* Metric KPI Overview */}
          <ListingStatsOverview summary={summary} />

          {/* Table Container Card */}
          <div className="bg-white rounded-xl border border-[#e8e6e1] shadow-sm overflow-hidden">
            {/* Status Tabs Navigation */}
            <ListingStatusTabs
              statusTabs={statusTabs}
              filterStatus={filterStatus}
              onSelectTab={(st) => {
                setFilterStatus(st);
                setPage(1);
              }}
            />

            {/* Filter & Search Bar */}
            <ListingFilterToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              pageSize={pageSize}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
              selectedCount={selectedIds.length}
              totalListingsCount={listings.length}
              onBulkToggleHide={handleBulkToggleHide}
              onClearSelection={() => handleSelectAll(false)}
            />

            {/* Management Table */}
            <ListingManagementTable
              listings={listings}
              loading={loading}
              actionLoadingId={actionLoadingId}
              selectedIds={selectedIds}
              isAllSelected={isAllSelected}
              isPartiallySelected={isPartiallySelected}
              activeMenuId={activeMenuId}
              setActiveMenuId={setActiveMenuId}
              onSelectAll={handleSelectAll}
              onToggleSelect={handleToggleSelect}
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
          </div>
        </div>
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
