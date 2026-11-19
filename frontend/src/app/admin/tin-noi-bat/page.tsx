'use client';

import React from 'react';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { formatFullVND } from '@/lib/api';
import {
  FeaturedListingsTab,
  PromotionPackagesTab,
  PaymentTransactionsTab,
  PackageFormModal,
  GrantFeaturedModal,
} from '@/features/admin/components/promotions';
import { useAdminPromotions } from '@/features/admin/hooks/useAdminPromotions';

export default function AdminPromotionsPage() {
  const {
    activeTab,
    setActiveTab,
    overview,
    overviewLoading,
    listings,
    listingsLoading,
    listingStatusFilter,
    setListingStatusFilter,
    listingSearch,
    setListingSearch,
    packages,
    packagesLoading,
    transactions,
    transactionsLoading,
    txStatusFilter,
    setTxStatusFilter,
    txSearch,
    setTxSearch,
    packageModalOpen,
    setPackageModalOpen,
    editingPackage,
    packageFormData,
    setPackageFormData,
    grantModalOpen,
    setGrantModalOpen,
    grantTargetListingId,
    setGrantTargetListingId,
    grantTargetListingTitle,
    setGrantTargetListingTitle,
    grantDays,
    setGrantDays,
    grantNote,
    setGrantNote,
    grantActionLoading,
    refreshCurrentView,
    handleOpenGrantModal,
    handleGrantFeaturedSubmit,
    handleRevokeFeatured,
    handleOpenPackageModal,
    handleSavePackage,
    handleTogglePackageActive,
    handleDeletePackage,
  } = useAdminPromotions();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      <AdminHeader
        title="Quản trị Dịch vụ & Tin Nổi Bật (Promotions)"
        subtitle="Cấu hình giá tiền khuyến mãi, theo dõi tin xe VIP và doanh thu thanh toán VNPay"
        onRefresh={refreshCurrentView}
        isRefreshing={overviewLoading || listingsLoading || packagesLoading || transactionsLoading}
      />

      <main className="p-8 space-y-6 flex-1">
        {/* KPI OVERVIEW METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-2">
            <div className="flex items-center justify-between text-outline text-xs font-semibold">
              <span>Doanh Thu Gói Nổi Bật</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </span>
            </div>
            <div className="text-2xl font-black text-primary tracking-tight">
              {overview ? formatFullVND(overview.total_revenue_vnd) : '0 đ'}
            </div>
            <div className="text-[11px] text-outline flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">trending_up</span>
              <span>Tổng thu từ khách thanh toán VNPay</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-2">
            <div className="flex items-center justify-between text-outline text-xs font-semibold">
              <span>Tin Đang Hiển Thị VIP</span>
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">campaign</span>
              </span>
            </div>
            <div className="text-2xl font-black text-primary tracking-tight">
              {overview ? overview.active_featured_count : 0}
            </div>
            <div className="text-[11px] text-outline flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[14px] text-amber-600">stars</span>
              <span>Tin xe đang ưu tiên trang chủ</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-2">
            <div className="flex items-center justify-between text-outline text-xs font-semibold">
              <span>Giao Dịch Thành Công</span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
              </span>
            </div>
            <div className="text-2xl font-black text-primary tracking-tight">
              {overview ? overview.success_transactions : 0}
              <span className="text-sm font-normal text-outline ml-1">
                / {overview ? overview.total_transactions : 0} GD
              </span>
            </div>
            <div className="text-[11px] text-outline flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[14px] text-blue-600">sync_alt</span>
              <span>Thanh toán nạp gói đẩy tin</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-2">
            <div className="flex items-center justify-between text-outline text-xs font-semibold">
              <span>Gói Khuyến Mãi Mở Bán</span>
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">loyalty</span>
              </span>
            </div>
            <div className="text-2xl font-black text-primary tracking-tight">
              {overview ? overview.active_packages_count : 0}
            </div>
            <div className="text-[11px] text-outline flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[14px] text-purple-600">settings</span>
              <span>Đang áp dụng trên hệ thống</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS & ACTIONS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('LISTINGS')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'LISTINGS'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-lowest text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
              <span>Danh Sách Tin Nổi Bật ({overview ? overview.active_featured_count : 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PACKAGES')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'PACKAGES'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-lowest text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">price_change</span>
              <span>Cấu Hình Gói &amp; Giá Tiền ({packages.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-lowest text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Lịch Sử Giao Dịch VNPay</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'LISTINGS' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon="add_circle"
                onClick={() => handleOpenGrantModal()}
              >
                Cấp Tin VIP Thủ Công
              </AdminButton>
            )}

            {activeTab === 'PACKAGES' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon="add_box"
                onClick={() => handleOpenPackageModal()}
              >
                Tạo Gói Khuyến Mãi Mới
              </AdminButton>
            )}
          </div>
        </div>

        {/* TAB CONTENTS */}
        {activeTab === 'LISTINGS' && (
          <FeaturedListingsTab
            listings={listings}
            loading={listingsLoading}
            statusFilter={listingStatusFilter}
            setStatusFilter={setListingStatusFilter}
            search={listingSearch}
            setSearch={setListingSearch}
            onOpenGrantModal={handleOpenGrantModal}
            onRevokeFeatured={handleRevokeFeatured}
          />
        )}

        {activeTab === 'PACKAGES' && (
          <PromotionPackagesTab
            packages={packages}
            loading={packagesLoading}
            onToggleActive={handleTogglePackageActive}
            onOpenModal={handleOpenPackageModal}
            onDeletePackage={handleDeletePackage}
          />
        )}

        {activeTab === 'TRANSACTIONS' && (
          <PaymentTransactionsTab
            transactions={transactions}
            loading={transactionsLoading}
            statusFilter={txStatusFilter}
            setStatusFilter={setTxStatusFilter}
            search={txSearch}
            setSearch={setTxSearch}
          />
        )}
      </main>

      {/* MODALS */}
      <PackageFormModal
        isOpen={packageModalOpen}
        onClose={() => setPackageModalOpen(false)}
        editingPackage={editingPackage}
        formData={packageFormData}
        setFormData={setPackageFormData}
        onSubmit={handleSavePackage}
      />

      <GrantFeaturedModal
        isOpen={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        targetListingId={grantTargetListingId}
        setTargetListingId={setGrantTargetListingId}
        targetListingTitle={grantTargetListingTitle}
        grantDays={grantDays}
        setGrantDays={setGrantDays}
        grantNote={grantNote}
        setGrantNote={setGrantNote}
        loading={grantActionLoading}
        onSubmit={handleGrantFeaturedSubmit}
      />
    </div>
  );
}
