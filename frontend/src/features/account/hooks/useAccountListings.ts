'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

interface UseAccountListingsProps {
  isLoggedIn: boolean;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function useAccountListings({ isLoggedIn, showToast }: UseAccountListingsProps) {
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingFilter, setListingFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING_REVIEW' | 'SOLD'>('ALL');
  const [listingActionId, setListingActionId] = useState<string | null>(null);
  const [selectedPromoteListing, setSelectedPromoteListing] = useState<any | null>(null);

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const res = await api.getMyListings(1, 50);
      setListings(res.items || []);
    } catch (err: any) {
      console.warn('Failed to load listings:', err);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadListings();
    }
  }, [isLoggedIn, loadListings]);

  const handleMarkSold = async (listingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu xe này đã bán?')) return;
    setListingActionId(listingId);
    try {
      await api.markListingSold(listingId);
      showToast('Đã đánh dấu xe đã bán thành công!', 'success');
      await loadListings();
    } catch (err: any) {
      showToast(err.message || 'Không thể đánh dấu đã bán.', 'error');
    } finally {
      setListingActionId(null);
    }
  };

  const handleSubmitReview = async (listingId: string) => {
    setListingActionId(listingId);
    try {
      await api.submitListingForReview(listingId);
      showToast('Gửi duyệt tin thành công! Tin sẽ được hiển thị sau khi Admin xét duyệt.', 'success');
      await loadListings();
    } catch (err: any) {
      showToast(err.message || 'Không thể gửi duyệt tin.', 'error');
    } finally {
      setListingActionId(null);
    }
  };

  return {
    listings,
    loadingListings,
    listingFilter,
    setListingFilter,
    listingActionId,
    selectedPromoteListing,
    setSelectedPromoteListing,
    loadListings,
    handleMarkSold,
    handleSubmitReview,
  };
}

