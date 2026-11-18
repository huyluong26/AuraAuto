import { ListingItem } from '@/types';

export type ListingFilterStatus =
  | 'ALL'
  | 'PUBLISHED'
  | 'PENDING_REVIEW'
  | 'FEATURED'
  | 'SOLD'
  | 'HIDDEN'
  | 'DRAFT'
  | 'REJECTED';

export type SortByOption =
  | 'newest'
  | 'oldest'
  | 'price_desc'
  | 'price_asc'
  | 'views_desc';

export interface ListingSummary {
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

export interface StatusTabItem {
  key: ListingFilterStatus;
  label: string;
  count: number;
  isVip?: boolean;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  onConfirm: () => void;
}
