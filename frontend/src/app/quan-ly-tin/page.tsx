'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { api, formatVND } from '@/lib/api';
import { getHighResImageUrl } from '@/lib/image';
import { PromoteListingModal } from '@/features/cars';
import { EditListingModal } from '@/features/car-listing';
import { ListingItem } from '@/types';

type ListingFilterStatus =
  | 'ALL'
  | 'PUBLISHED'
  | 'PENDING_REVIEW'
  | 'FEATURED'
  | 'SOLD'
  | 'HIDDEN'
  | 'DRAFT'
  | 'REJECTED';

interface ListingSummary {
  total_listings: number;
  published_listings: number;
  pending_listings: number;
  sold_listings: number;
  rejected_listings: number;
  draft_listings: number;
  hidden_listings: number;
  featured_listings: number;
  total_views: number;
  total_favorites: number;
}

export default function UserListingsManagementPage() {
  const router = useRouter();
  const { isLoggedIn, isLoaded } = useCurrentUser();

  // Data states
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [summary, setSummary] = useState<ListingSummary>({
    total_listings: 0,
    published_listings: 0,
    pending_listings: 0,
    sold_listings: 0,
    rejected_listings: 0,
    draft_listings: 0,
    hidden_listings: 0,
    featured_listings: 0,
    total_views: 0,
    total_favorites: 0,
  });

  // Filter & Search states
  const [filterStatus, setFilterStatus] = useState<ListingFilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_desc' | 'price_asc' | 'views_desc'>('newest');

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [selectedPromoteListing, setSelectedPromoteListing] = useState<ListingItem | null>(null);
  const [editingFullListingId, setEditingFullListingId] = useState<string | null>(null);
  const [editingPriceListing, setEditingPriceListing] = useState<ListingItem | null>(null);
  const [newPriceRaw, setNewPriceRaw] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [deletingListing, setDeletingListing] = useState<ListingItem | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auth guard
  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      router.push('/dang-nhap?redirect=/quan-ly-tin');
    }
  }, [isLoaded, isLoggedIn, router]);

  // Load Data
  useEffect(() => {
    if (!isLoggedIn) return;
    let isSubscribed = true;

    async function loadData() {
      try {
        setLoading(true);
        const apiFilter = filterStatus === 'FEATURED' ? 'ALL' : filterStatus;
        const [sumData, res] = await Promise.all([
          api.getMyListingsSummary(),
          api.getMyListings(page, pageSize, apiFilter, debouncedSearch),
        ]);
        if (!isSubscribed) return;
        if (sumData) setSummary(sumData);

        let items = (res.items || []) as ListingItem[];
        if (filterStatus === 'FEATURED') {
          items = items.filter((item) => Boolean(item.is_featured));
        }

        if (sortBy === 'oldest') {
          items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else if (sortBy === 'price_desc') {
          items.sort((a, b) => (b.price_vnd || 0) - (a.price_vnd || 0));
        } else if (sortBy === 'price_asc') {
          items.sort((a, b) => (a.price_vnd || 0) - (b.price_vnd || 0));
        } else if (sortBy === 'views_desc') {
          items.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        }

        setListings(items);
        setTotalItems(res.pagination?.total || items.length);
        setTotalPages(res.pagination?.total_pages || Math.ceil((res.pagination?.total || items.length) / pageSize) || 1);
      } catch (err: unknown) {
        if (!isSubscribed) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách tin xe.';
        showToast(msg, 'error');
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [isLoggedIn, page, pageSize, filterStatus, debouncedSearch, sortBy, refreshKey, showToast]);

  // Actions
  const handleToggleHide = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await api.toggleHideListing(id);
      showToast(res.message || 'Đã thay đổi trạng thái hiển thị!', 'success');
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái tin';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkSold = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu xe này đã bán thành công?')) return;
    try {
      setActionLoadingId(id);
      const res = await api.markListingSold(id);
      showToast(res.message || 'Đã đánh dấu xe đã bán!', 'success');
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác thất bại';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRelist = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await api.relistListing(id);
      showToast(res.message || 'Đã mở bán lại tin xe thành công!', 'success');
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể mở bán lại';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitReview = async (id: string) => {
    try {
      setActionLoadingId(id);
      await api.submitListingForReview(id);
      showToast('Gửi duyệt tin thành công! Tin sẽ được duyệt trong ít phút.', 'success');
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi duyệt';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingListing) return;
    try {
      setDeletingInProgress(true);
      await api.deleteMyListing(deletingListing.id);
      showToast('Đã xóa tin đăng xe thành công!', 'success');
      setDeletingListing(null);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa tin xe';
      showToast(msg, 'error');
    } finally {
      setDeletingInProgress(false);
    }
  };

  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceListing) return;
    const cleanPrice = parseInt(newPriceRaw.replace(/\D/g, ''), 10);
    if (!cleanPrice || cleanPrice < 10_000_000) {
      showToast('Giá xe tối thiểu phải từ 10.000.000 ₫', 'error');
      return;
    }

    try {
      setUpdatingPrice(true);
      await api.quickUpdateListing(editingPriceListing.id, { price_vnd: cleanPrice });
      showToast('Cập nhật giá bán mới thành công!', 'success');
      setEditingPriceListing(null);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật giá';
      showToast(msg, 'error');
    } finally {
      setUpdatingPrice(false);
    }
  };

  // Status tabs mapping
  const statusTabs = useMemo(
    () => [
      { key: 'ALL', label: 'Tất cả tin', count: summary.total_listings, icon: 'list_alt' },
      { key: 'PUBLISHED', label: 'Đang hiển thị', count: summary.published_listings, icon: 'check_circle' },
      { key: 'PENDING_REVIEW', label: 'Chờ duyệt', count: summary.pending_listings, icon: 'schedule' },
      { key: 'FEATURED', label: 'Tin nổi bật', count: summary.featured_listings, icon: 'rocket_launch', isVip: true },
      { key: 'SOLD', label: 'Đã bán', count: summary.sold_listings, icon: 'task_alt' },
      { key: 'HIDDEN', label: 'Đang tạm ẩn', count: summary.hidden_listings, icon: 'visibility_off' },
      { key: 'DRAFT', label: 'Bản nháp', count: summary.draft_listings, icon: 'draft' },
      { key: 'REJECTED', label: 'Từ chối duyệt', count: summary.rejected_listings, icon: 'cancel' },
    ],
    [summary]
  );

  if (!isLoaded || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
        <Navbar />
        <main className="w-full pt-32 pb-20 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-on-surface-variant font-medium">Đang xác thực thông tin tài khoản...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col">
      <Navbar />

      {/* Toast Notification (In-theme inverse surface & error container) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-inverse-surface text-inverse-on-surface border-outline/30'
                : 'bg-error-container text-on-error-container border-error/30'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 ${
                toast.type === 'success' ? 'text-secondary-fixed' : 'text-error'
              }`}
            >
              {toast.type === 'success' ? 'check_circle' : 'warning'}
            </span>
            <p className="text-xs sm:text-sm font-medium leading-snug">{toast.message}</p>
          </div>
        </div>
      )}

      <main className="w-full pt-28 pb-16 bg-surface min-h-[calc(100vh-18rem)] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
            <div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1 font-medium">
                <Link href="/" className="hover:text-primary transition-colors">
                  Trang chủ
                </Link>
                <span>/</span>
                <Link href="/tai-khoan" className="hover:text-primary transition-colors">
                  Tài khoản
                </Link>
                <span>/</span>
                <span className="text-primary font-semibold">Quản lý tin đăng</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-headline tracking-tight flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[28px] text-secondary">directions_car</span>
                <span>Quản Lý Tin Đăng Bán Xe</span>
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container transition-all text-on-surface-variant hover:text-primary cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
              title="Làm mới dữ liệu"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin text-primary' : ''}`}>
                refresh
              </span>
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>

          {/* Search Bar, Status Filter Tabs, Sort */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border border-surface-container-high shadow-xs space-y-4">
            {/* Top row: Search input & Sort dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên xe, hãng xe, đời xe..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs sm:text-sm text-primary focus:outline-none focus:border-secondary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">
                  swap_vert
                </span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as 'newest' | 'oldest' | 'price_desc' | 'price_asc' | 'views_desc'
                    )
                  }
                  className="px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs sm:text-sm text-primary font-medium focus:outline-none focus:border-secondary transition-all cursor-pointer"
                >
                  <option value="newest">Mới đăng nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="price_desc">Giá cao đến thấp</option>
                  <option value="price_asc">Giá thấp đến cao</option>
                  <option value="views_desc">Nhiều lượt xem nhất</option>
                </select>
              </div>
            </div>

            {/* Status Filter Tabs (Scrollable on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-surface-container-high/60">
              {statusTabs.map((tab) => {
                const isActive = filterStatus === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setFilterStatus(tab.key as ListingFilterStatus);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-primary'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[15px] ${
                        tab.isVip ? (isActive ? 'text-secondary-fixed' : 'text-secondary') : ''
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listings List */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
              <p className="text-xs text-on-surface-variant font-medium">Đang tải danh sách tin xe của bạn...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high/60 flex items-center justify-center mx-auto text-on-surface-variant">
                <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40">
                  directions_car
                </span>
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-primary font-headline">
                  Không tìm thấy tin xe nào
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  {debouncedSearch
                    ? `Không có tin đăng nào phù hợp với từ khóa "${debouncedSearch}".`
                    : filterStatus !== 'ALL'
                    ? 'Bạn chưa có tin đăng nào ở trạng thái này.'
                    : 'Bạn chưa có tin đăng xe nào trên hệ thống.'}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                {debouncedSearch || filterStatus !== 'ALL' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('ALL');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-container-high text-primary hover:bg-surface-container-highest transition-colors cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                ) : (
                  <Link
                    href="/dang-tin"
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-on-primary hover:bg-inverse-surface transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Đăng tin bán xe</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((item) => {
                const rawImg =
                  item.primary_image_url ||
                  'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80';
                const imgUrl = getHighResImageUrl(rawImg, 800, 85);
                const isActing = actionLoadingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-surface-container-lowest rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row items-stretch justify-between gap-4 ${
                      item.is_featured
                        ? 'border-secondary/50 ring-1 ring-secondary/20 shadow-[0_4px_20px_rgba(114,90,55,0.08)]'
                        : 'border-surface-container-high'
                    }`}
                  >
                    {/* Left: Image & Car Details */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 flex-1 min-w-0">
                      {/* Image Thumbnail */}
                      <div className="relative w-full sm:w-48 sm:h-36 h-48 rounded-2xl overflow-hidden bg-surface-container-high shrink-0 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {item.is_featured && (
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <span className="material-symbols-outlined text-[13px] text-secondary-fixed">rocket_launch</span>
                            <span>Nổi bật</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium">
                          Năm {item.manufacture_year}
                        </div>
                      </div>

                      {/* Info Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Status Badges - Using Site Theme Palette */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.status === 'PUBLISHED' && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-surface-container-high text-primary border border-outline-variant/60 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-primary">
                                check_circle
                              </span>
                              <span>Đang hiển thị</span>
                            </span>
                          )}
                          {item.status === 'PENDING_REVIEW' && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/40 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-on-surface-variant">
                                schedule
                              </span>
                              <span>Chờ kiểm duyệt</span>
                            </span>
                          )}
                          {item.status === 'SOLD' && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-surface-container-low text-outline border border-surface-container-high flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-outline">
                                task_alt
                              </span>
                              <span>Đã bán</span>
                            </span>
                          )}
                          {item.status === 'HIDDEN' && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-surface-container-low text-on-surface-variant border border-outline-variant/30 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-on-surface-variant">
                                visibility_off
                              </span>
                              <span>Đang tạm ẩn</span>
                            </span>
                          )}
                          {item.status === 'DRAFT' && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/40 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                draft
                              </span>
                              <span>Bản nháp</span>
                            </span>
                          )}
                          {item.status === 'REJECTED' && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-error-container text-on-error-container border border-error/20 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-error">
                                cancel
                              </span>
                              <span>Bị từ chối</span>
                            </span>
                          )}

                          {item.is_featured && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center gap-1 shadow-2xs">
                              <span className="material-symbols-outlined text-[13px] text-secondary">
                                rocket_launch
                              </span>
                              <span>
                                Tin Nổi Bật{' '}
                                {item.featured_until
                                  ? `(đến ${new Date(item.featured_until).toLocaleDateString('vi-VN')})`
                                  : ''}
                              </span>
                            </span>
                          )}

                          {item.has_pending_revision && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs" title="Tin đăng vẫn hiển thị bản cũ trên sàn cho tới khi admin duyệt bản sửa đổi">
                              <span className="material-symbols-outlined text-[14px] text-amber-700 animate-spin">
                                sync
                              </span>
                              <span>
                                Bản sửa đổi {item.pending_revision_no ? `#${item.pending_revision_no}` : ''} đang chờ duyệt
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-primary text-base sm:text-lg line-clamp-1" title={item.title}>
                          {item.title}
                        </h3>

                        {/* Price & Quick Price Edit */}
                        <div className="flex items-center gap-3">
                          <span className="text-secondary font-black text-lg sm:text-xl font-headline">
                            {formatVND(item.price_vnd)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceListing(item);
                              setNewPriceRaw(item.price_vnd ? String(item.price_vnd) : '');
                            }}
                            className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center"
                            title="Sửa nhanh giá bán"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                        </div>

                        {/* Specs row */}
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
                          <span>{(item.odometer_km || 0).toLocaleString('vi-VN')} km</span>
                          <span>•</span>
                          <span>{item.transmission || 'Tự động'}</span>
                          <span>•</span>
                          <span>{item.fuel_type || 'Xăng'}</span>
                          {item.location_address && (
                            <>
                              <span>•</span>
                              <span className="line-clamp-1 max-w-[200px]">{item.location_address}</span>
                            </>
                          )}
                        </div>

                        {/* Views & Date info */}
                        <div className="flex items-center gap-4 text-[11px] text-on-surface-variant pt-1 border-t border-surface-container-high/60">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-secondary">
                              visibility
                            </span>
                            <span>{(item.views_count || 0).toLocaleString('vi-VN')} lượt xem</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-secondary">
                              favorite
                            </span>
                            <span>{item.favorites_count || 0} lượt lưu</span>
                          </span>
                          <span>
                            Đăng ngày {new Date(item.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        {/* Rejection notice box if rejected */}
                        {item.status === 'REJECTED' && (
                          <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/20 text-on-surface text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-on-error-container">
                              <span className="material-symbols-outlined text-[16px] text-error">
                                warning
                              </span>
                              <span>Lý do từ chối kiểm duyệt:</span>
                            </div>
                            <p className="text-on-surface-variant">
                              {item.rejection_reason || 'Thông tin xe chưa đầy đủ hoặc ảnh chụp chưa đạt chuẩn quy định của sàn.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions Column */}
                    <div className="p-5 lg:pl-0 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-surface-container-high lg:w-56 shrink-0 bg-surface-container-lowest/60 gap-3">
                      <div className="flex flex-col gap-2">
                        {/* View Listing */}
                        <Link
                          href={`/xe/${item.id}`}
                          className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-primary transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>Xem tin đăng</span>
                        </Link>

                        {/* Edit Full Listing */}
                        <button
                          type="button"
                          onClick={() => setEditingFullListingId(item.id)}
                          className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-secondary">edit_note</span>
                          <span>Sửa thông tin tin đăng</span>
                        </button>

                        {/* Promote VIP button */}
                        {item.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() => setSelectedPromoteListing(item)}
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-secondary hover:bg-on-secondary-fixed text-on-secondary shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">campaign</span>
                            <span>{item.is_featured ? 'Gia hạn nổi bật' : 'Đưa lên nổi bật'}</span>
                          </button>
                        )}

                        {/* Submit review if draft or rejected */}
                        {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleSubmitReview(item.id)}
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-inverse-surface transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">send</span>
                            <span>{isActing ? 'Đang gửi...' : 'Gửi duyệt tin'}</span>
                          </button>
                        )}

                        {/* Mark sold button */}
                        {item.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleMarkSold(item.id)}
                            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              task_alt
                            </span>
                            <span>Đánh dấu đã bán</span>
                          </button>
                        )}

                        {/* Re-list button */}
                        {(item.status === 'SOLD' || item.status === 'HIDDEN') && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleRelist(item.id)}
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-primary hover:bg-inverse-surface text-on-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                            <span>Mở bán lại xe</span>
                          </button>
                        )}

                        {/* Toggle hide button */}
                        {item.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleToggleHide(item.id)}
                            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                            <span>Tạm ẩn tin</span>
                          </button>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setDeletingListing(item)}
                        className="w-full py-1.5 text-xs text-error hover:text-on-error-container hover:bg-error-container/30 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer pt-2 border-t border-surface-container-high"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>Xóa tin này</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pt-6 flex items-center justify-between gap-4">
                  <p className="text-xs text-on-surface-variant">
                    Hiển thị {listings.length} trên tổng số {totalItems} tin
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      className="p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-surface-container text-primary">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      className="p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* MODAL 2: Quick Update Price */}
      {editingPriceListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-high space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">sell</span>
                </div>
                <h3 className="text-base font-bold text-primary font-headline">Cập Nhật Giá Bán Xe</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPriceListing(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveQuickPrice} className="space-y-4">
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">Tin xe:</p>
                <p className="text-sm font-bold text-primary line-clamp-1">{editingPriceListing.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Giá hiện tại:{' '}
                  <strong className="text-secondary">{formatVND(editingPriceListing.price_vnd)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Nhập giá bán mới (VNĐ):
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPriceRaw}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setNewPriceRaw(val ? parseInt(val, 10).toLocaleString('vi-VN') : '');
                  }}
                  placeholder="Ví dụ: 850.000.000"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-primary font-bold text-base focus:outline-none focus:border-secondary"
                />
                {newPriceRaw && (
                  <p className="text-xs text-secondary font-semibold mt-1.5">
                    Quy đổi: {formatVND(parseInt(newPriceRaw.replace(/\D/g, ''), 10))}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPriceListing(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updatingPrice}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-inverse-surface transition-all cursor-pointer disabled:opacity-50"
                >
                  {updatingPrice ? 'Đang lưu...' : 'Lưu giá mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Delete Listing */}
      {deletingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-high space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-primary font-headline">Xác nhận xóa tin đăng xe?</h3>
              <p className="text-xs text-on-surface-variant">
                Bạn có chắc chắn muốn xóa tin: <strong>{deletingListing.title}</strong>? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingListing(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deletingInProgress}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-error text-on-error hover:bg-on-error-container transition-all cursor-pointer disabled:opacity-50"
              >
                {deletingInProgress ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Full Edit Listing Modal */}
      {editingFullListingId && (
        <EditListingModal
          listingId={editingFullListingId}
          onClose={() => setEditingFullListingId(null)}
          onSuccess={() => {
            setRefreshKey((k) => k + 1);
            showToast('Đã lưu và gửi bản chỉnh sửa tin đăng xe thành công!', 'success');
          }}
        />
      )}
    </div>
  );
}
