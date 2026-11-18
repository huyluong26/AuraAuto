'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { api } from '@/lib/api';
import { ListingItem } from '@/types';
import {
  ListingFilterStatus,
  ListingSummary,
  SortByOption,
  StatusTabItem,
  ToastState,
  ConfirmModalState,
} from '../types';

export function useUserListings() {
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
  const [sortBy, setSortBy] = useState<SortByOption>('newest');

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal dialog states
  const [selectedPromoteListing, setSelectedPromoteListing] = useState<ListingItem | null>(null);
  const [editingFullListingId, setEditingFullListingId] = useState<string | null>(null);
  const [editingPriceListing, setEditingPriceListing] = useState<ListingItem | null>(null);
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [deletingListing, setDeletingListing] = useState<ListingItem | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close row action dropdown when clicking outside
  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  // Auth guard
  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      router.push('/dang-nhap?redirect=/quan-ly-tin');
    }
  }, [isLoaded, isLoggedIn, router]);

  // Fetch Listings & Summary
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
        setTotalPages(
          res.pagination?.total_pages ||
            Math.ceil((res.pagination?.total || items.length) / pageSize) ||
            1
        );
        setSelectedIds([]);
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

  // Selection logic
  const isAllSelected = listings.length > 0 && listings.every((item) => selectedIds.includes(item.id));
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(listings.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Single Item Operations
  const handleToggleHide = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await api.toggleHideListing(id);
      showToast(res.message || 'Đã thay đổi trạng thái hiển thị!', 'success');
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái tin';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeMarkSold = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await api.markListingSold(id);
      showToast(res.message || 'Đã đánh dấu xe đã bán thành công!', 'success');
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác thất bại';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkSold = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Đánh dấu xe đã bán',
      message:
        'Bạn có chắc chắn muốn xác nhận xe này đã giao dịch thành công?\nTin đăng sẽ chuyển sang trạng thái "Đã bán" trên sàn AuraAuto.',
      confirmText: 'Xác nhận đã bán',
      cancelText: 'Hủy bỏ',
      variant: 'success',
      onConfirm: () => executeMarkSold(id),
    });
  };

  const handleRelist = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await api.relistListing(id);
      showToast(res.message || 'Đã mở bán lại tin xe thành công!', 'success');
      refresh();
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
      refresh();
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
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa tin xe';
      showToast(msg, 'error');
    } finally {
      setDeletingInProgress(false);
    }
  };

  const handleSaveQuickPrice = async (cleanPrice: number) => {
    if (!editingPriceListing) return;
    try {
      setUpdatingPrice(true);
      await api.quickUpdateListing(editingPriceListing.id, { price_vnd: cleanPrice });
      showToast('Cập nhật giá bán mới thành công!', 'success');
      setEditingPriceListing(null);
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật giá';
      showToast(msg, 'error');
    } finally {
      setUpdatingPrice(false);
    }
  };

  // Bulk Operations
  const executeBulkToggleHide = async () => {
    try {
      setLoading(true);
      await Promise.all(selectedIds.map((id) => api.toggleHideListing(id).catch(() => null)));
      showToast(`Đã cập nhật trạng thái ${selectedIds.length} tin xe!`, 'success');
      setSelectedIds([]);
      refresh();
    } catch {
      showToast('Có lỗi xảy ra khi thao tác hàng loạt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkToggleHide = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Thay đổi trạng thái hiển thị hàng loạt',
      message: `Bạn có chắc chắn muốn thay đổi trạng thái ẩn/hiển thị của ${selectedIds.length} tin xe đã chọn?`,
      confirmText: 'Xác nhận thao tác',
      cancelText: 'Hủy bỏ',
      variant: 'primary',
      onConfirm: executeBulkToggleHide,
    });
  };

  // Status Tabs Definition
  const statusTabs: StatusTabItem[] = useMemo(
    () => [
      { key: 'ALL', label: 'Tất cả', count: summary.total_listings },
      { key: 'PUBLISHED', label: 'Đang hiển thị', count: summary.published_listings },
      { key: 'PENDING_REVIEW', label: 'Chờ duyệt', count: summary.pending_listings },
      { key: 'FEATURED', label: 'Tin VIP', count: summary.featured_listings, isVip: true },
      { key: 'SOLD', label: 'Đã bán', count: summary.sold_listings },
      { key: 'HIDDEN', label: 'Đang ẩn', count: summary.hidden_listings },
      { key: 'DRAFT', label: 'Bản nháp', count: summary.draft_listings },
      { key: 'REJECTED', label: 'Bị từ chối', count: summary.rejected_listings },
    ],
    [summary]
  );

  return {
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
    setSelectedIds,
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
    // Modals & Feedback
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
  };
}
