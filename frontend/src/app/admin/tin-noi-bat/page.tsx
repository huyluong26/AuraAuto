'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminButton } from '@/features/admin/components/ui/AdminButton';
import { useAdminUI } from '@/features/admin/context/AdminUIContext';
import { api, formatFullVND } from '@/lib/api';
import {
  AdminPromotionsOverview,
  AdminPromotionPackage,
  AdminFeaturedListing,
  AdminPaymentTransaction,
} from '@/features/admin/types';
import {
  FeaturedListingsTab,
  PromotionPackagesTab,
  PaymentTransactionsTab,
  PackageFormModal,
  GrantFeaturedModal,
} from '@/features/admin/components/promotions';

export default function AdminPromotionsPage() {
  const { confirm, prompt, toast } = useAdminUI();

  // Active Tab: 'LISTINGS' | 'PACKAGES' | 'TRANSACTIONS'
  const [activeTab, setActiveTab] = useState<'LISTINGS' | 'PACKAGES' | 'TRANSACTIONS'>('LISTINGS');

  // KPI Overview
  const [overview, setOverview] = useState<AdminPromotionsOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Tab 1: Featured Listings
  const [listings, setListings] = useState<AdminFeaturedListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingStatusFilter, setListingStatusFilter] = useState<'ACTIVE' | 'EXPIRED' | 'ALL'>('ACTIVE');
  const [listingSearch, setListingSearch] = useState('');

  // Tab 2: Promotion Packages
  const [packages, setPackages] = useState<AdminPromotionPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);

  // Tab 3: Transactions
  const [transactions, setTransactions] = useState<AdminPaymentTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [txStatusFilter, setTxStatusFilter] = useState<string>('');
  const [txSearch, setTxSearch] = useState('');

  // Modal States
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<AdminPromotionPackage | null>(null);
  const [packageFormData, setPackageFormData] = useState({
    code: '',
    name: '',
    days: 3,
    amount_vnd: 129000,
    original_amount_vnd: 160000,
    badge: 'Phổ biến',
    description: '',
    is_active: true,
    sort_order: 0,
  });

  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantTargetListingId, setGrantTargetListingId] = useState<string>('');
  const [grantTargetListingTitle, setGrantTargetListingTitle] = useState<string>('');
  const [grantDays, setGrantDays] = useState<number>(7);
  const [grantNote, setGrantNote] = useState<string>('');
  const [grantActionLoading, setGrantActionLoading] = useState(false);

  // ==============================================================
  // DATA LOADERS
  // ==============================================================
  const loadOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const data = await api.getAdminPromotionsOverview();
      setOverview(data);
    } catch (err: any) {
      console.error('Lỗi tải tổng quan doanh thu:', err);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadFeaturedListings = useCallback(async () => {
    try {
      setListingsLoading(true);
      const data = await api.getAdminFeaturedListings({
        status_filter: listingStatusFilter,
        search: listingSearch.trim() || undefined,
      });
      setListings(data);
    } catch (err: any) {
      toast.error('Lỗi tải tin nổi bật', err.message || 'Không thể tải danh sách tin');
    } finally {
      setListingsLoading(false);
    }
  }, [listingStatusFilter, listingSearch, toast]);

  const loadPackages = useCallback(async () => {
    try {
      setPackagesLoading(true);
      const data = await api.getAdminPromotionPackages();
      setPackages(data);
    } catch (err: any) {
      toast.error('Lỗi tải gói khuyến mãi', err.message || 'Không thể tải danh sách gói cước');
    } finally {
      setPackagesLoading(false);
    }
  }, [toast]);

  const loadTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const data = await api.getAdminPaymentTransactions({
        status_filter: txStatusFilter || undefined,
        search: txSearch.trim() || undefined,
      });
      setTransactions(data);
    } catch (err: any) {
      toast.error('Lỗi tải lịch sử giao dịch', err.message || 'Không thể tải danh sách giao dịch');
    } finally {
      setTransactionsLoading(false);
    }
  }, [txStatusFilter, txSearch, toast]);

  const refreshCurrentView = useCallback(() => {
    loadOverview();
    if (activeTab === 'LISTINGS') loadFeaturedListings();
    if (activeTab === 'PACKAGES') loadPackages();
    if (activeTab === 'TRANSACTIONS') loadTransactions();
  }, [activeTab, loadOverview, loadFeaturedListings, loadPackages, loadTransactions]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === 'LISTINGS') loadFeaturedListings();
    if (activeTab === 'PACKAGES') loadPackages();
    if (activeTab === 'TRANSACTIONS') loadTransactions();
  }, [activeTab, loadFeaturedListings, loadPackages, loadTransactions]);

  // ==============================================================
  // ACTIONS: LISTINGS
  // ==============================================================
  const handleOpenGrantModal = (listing?: AdminFeaturedListing) => {
    if (listing) {
      setGrantTargetListingId(listing.id);
      setGrantTargetListingTitle(listing.title);
    } else {
      setGrantTargetListingId('');
      setGrantTargetListingTitle('');
    }
    setGrantDays(7);
    setGrantNote('');
    setGrantModalOpen(true);
  };

  const handleGrantFeaturedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantTargetListingId) {
      toast.error('Lỗi', 'Vui lòng cung cấp ID tin đăng xe cần kích hoạt VIP');
      return;
    }

    try {
      setGrantActionLoading(true);
      await api.grantAdminFeaturedListing(grantTargetListingId, {
        days: grantDays,
        note: grantNote.trim() || undefined,
      });
      toast.success(
        'Kích hoạt VIP thành công',
        `Tin xe đã được đưa lên vị trí nổi bật thêm ${grantDays} ngày.`
      );
      setGrantModalOpen(false);
      loadFeaturedListings();
      loadOverview();
    } catch (err: any) {
      toast.error('Lỗi kích hoạt VIP', err.message || 'Không thể cấp quyền tin nổi bật');
    } finally {
      setGrantActionLoading(false);
    }
  };

  const handleRevokeFeatured = async (listing: AdminFeaturedListing) => {
    const reason = await prompt({
      title: 'Thu hồi quyền tin nổi bật',
      message: `Bạn đang thu hồi trạng thái VIP của xe "${listing.title}". Vui lòng nhập lý do (gửi tới người bán):`,
      placeholder: 'VD: Vi phạm hình ảnh, hết điều kiện tài trợ...',
      confirmText: 'Thu hồi VIP',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
    });

    if (reason === null) return;

    try {
      await api.revokeAdminFeaturedListing(listing.id, {
        reason: reason.trim() || undefined,
      });
      toast.success('Đã thu hồi VIP', `Tin "${listing.title}" đã trở về trạng thái tin thông thường.`);
      loadFeaturedListings();
      loadOverview();
    } catch (err: any) {
      toast.error('Lỗi thu hồi', err.message || 'Không thể thu hồi quyền nổi bật');
    }
  };

  // ==============================================================
  // ACTIONS: PACKAGES
  // ==============================================================
  const handleOpenPackageModal = (pkg?: AdminPromotionPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageFormData({
        code: pkg.code,
        name: pkg.name,
        days: pkg.days,
        amount_vnd: pkg.amount_vnd,
        original_amount_vnd: pkg.original_amount_vnd || 0,
        badge: pkg.badge || '',
        description: pkg.description || '',
        is_active: pkg.is_active,
        sort_order: pkg.sort_order,
      });
    } else {
      setEditingPackage(null);
      setPackageFormData({
        code: `PROMO_${Date.now().toString().slice(-4)}`,
        name: 'Gói VIP Tăng Cường',
        days: 5,
        amount_vnd: 199000,
        original_amount_vnd: 250000,
        badge: 'Mới',
        description: 'Tăng cường hiển thị xe liên tục trong 5 ngày cao điểm.',
        is_active: true,
        sort_order: packages.length,
      });
    }
    setPackageModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await api.updateAdminPromotionPackage(editingPackage.id, {
          name: packageFormData.name,
          days: packageFormData.days,
          amount_vnd: packageFormData.amount_vnd,
          original_amount_vnd: packageFormData.original_amount_vnd || null,
          badge: packageFormData.badge || null,
          description: packageFormData.description || null,
          is_active: packageFormData.is_active,
          sort_order: packageFormData.sort_order,
        });
        toast.success('Đã cập nhật', `Cấu hình gói "${packageFormData.name}" đã được lưu.`);
      } else {
        await api.createAdminPromotionPackage({
          code: packageFormData.code,
          name: packageFormData.name,
          days: packageFormData.days,
          amount_vnd: packageFormData.amount_vnd,
          original_amount_vnd: packageFormData.original_amount_vnd || null,
          badge: packageFormData.badge || null,
          description: packageFormData.description || null,
          is_active: packageFormData.is_active,
          sort_order: packageFormData.sort_order,
        });
        toast.success('Đã tạo gói mới', `Đã thêm gói khuyến mãi "${packageFormData.name}".`);
      }
      setPackageModalOpen(false);
      loadPackages();
      loadOverview();
    } catch (err: any) {
      toast.error('Lỗi lưu gói', err.message || 'Không thể lưu thông tin gói khuyến mãi');
    }
  };

  const handleTogglePackageActive = async (pkg: AdminPromotionPackage) => {
    const newActive = !pkg.is_active;
    try {
      await api.updateAdminPromotionPackage(pkg.id, { is_active: newActive });
      toast.success(
        'Đã thay đổi trạng thái',
        `Gói "${pkg.name}" hiện đã ${newActive ? 'mở bán' : 'tạm dừng hiển thị'}.`
      );
      loadPackages();
      loadOverview();
    } catch (err: any) {
      toast.error('Lỗi cập nhật', err.message || 'Không thể cập nhật trạng thái gói');
    }
  };

  const handleDeletePackage = async (pkg: AdminPromotionPackage) => {
    const isConfirmed = await confirm({
      title: 'Xóa gói cước khuyến mãi',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn gói "${pkg.name}" (${pkg.code})? Các tin đã kích hoạt gói trước đây không bị ảnh hưởng.`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Giữ lại',
      variant: 'danger',
      icon: 'delete',
    });

    if (!isConfirmed) return;

    try {
      await api.deleteAdminPromotionPackage(pkg.id);
      toast.success('Đã xóa', `Đã xóa gói "${pkg.name}".`);
      loadPackages();
      loadOverview();
    } catch (err: any) {
      toast.error('Lỗi xóa', err.message || 'Không thể xóa gói');
    }
  };

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
