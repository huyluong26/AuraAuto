import { ReactNode } from 'react';

// ==========================================
// 1. DOMAIN MODELS & STATUSES
// ==========================================

export type ListingStatus =
  | 'ALL'
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'HIDDEN'
  | 'SOLD'
  | 'REMOVED';

export type UserRole = 'ADMIN' | 'INSPECTOR' | 'SUPPORT' | 'USER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type ArticleStatus = 'ALL' | 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type ArticleCategory =
  | 'THỊ TRƯỜNG'
  | 'ĐÁNH GIÁ XE'
  | 'KINH NGHIỆM'
  | 'TƯ VẤN PHÁP LÝ';

export type AppointmentStatus =
  | 'ALL'
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DECLINED';

export interface AdminMetrics {
  total_users: number;
  total_listings: number;
  pending_listings: number;
  published_listings: number;
  sold_listings: number;
  rejected_listings: number;
  total_appointments: number;
  pending_appointments?: number;
  confirmed_appointments?: number;
  completed_appointments?: number;
  cancelled_appointments?: number;
  declined_appointments?: number;
  appointment_status_distribution?: Array<{
    status: string;
    label: string;
    count: number;
    pct: number;
    color: string;
  }>;
  appointment_success_rate?: number;
  total_inventory_value_vnd?: number;
  total_sold_value_vnd?: number;
  monthly_trend?: Array<{
    month: string;
    listings: number;
    sold: number;
    gmv_bil: number;
  }>;
  brand_distribution?: Array<{
    name: string;
    count: number;
    pct: number;
    color: string;
  }>;
  price_segments?: Array<{
    segment: string;
    count: number;
    label: string;
    pct: number;
  }>;
  body_type_distribution?: Array<{
    type: string;
    count: number;
    pct: number;
    color: string;
  }>;
}

export interface AdminListingItem {
  id: string;
  status: ListingStatus;
  title: string;
  price_vnd: number;
  manufacture_year: number;
  odometer_km?: number | null;
  body_type: string;
  fuel_type: string;
  transmission: string;
  province_code: string;
  primary_image_url?: string | null;
  images_count: number;
  seller_id: string;
  seller_name: string;
  seller_email?: string | null;
  seller_phone?: string | null;
  has_pending_revision?: boolean;
  review_status?: string | null;
  revision_no?: number;
  published_at?: string | null;
  created_at: string;
  rejection_reason?: string | null;
}

export interface AdminListingDetail {
  id: string;
  status: ListingStatus;
  title: string;
  price_vnd: number;
  manufacture_year: number;
  odometer_km?: number | null;
  condition?: string | null;
  origin?: string | null;
  body_type: string;
  fuel_type: string;
  transmission: string;
  drivetrain?: string | null;
  engine_displacement?: string | null;
  seats?: number | null;
  doors?: number | null;
  color?: string | null;
  interior_color?: string | null;
  province_code: string;
  location_address?: string | null;
  description?: string | null;
  brand_id?: string | null;
  brand_name?: string | null;
  model_id?: string | null;
  model_name?: string | null;
  variant_id?: string | null;
  vin?: string | null;
  license_plate?: string | null;
  accident_status?: string | null;
  flood_status?: string | null;
  service_history?: string | null;
  owner_count?: number | null;
  repainted_parts_count?: number | null;
  replaced_parts?: string | null;
  engine_repaired?: boolean;
  transmission_repaired?: boolean;
  images: string[];
  media?: Array<{
    id: string;
    url: string;
    thumbnail_url?: string | null;
    media_type: string;
    is_primary: boolean;
    sort_order: number;
    label?: string | null;
  }>;
  revision_no?: number;
  review_status?: string;
  has_pending_revision?: boolean;
  published_revision?: any;
  seller: {
    id: string;
    display_name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
    role: string;
    status: string;
    created_at?: string | null;
  };
  created_at: string;
  published_at?: string | null;
  rejection_reason?: string | null;
  inspection_score?: number | null;
  inspection_inspector_name?: string | null;
  inspection_report_pdf_url?: string | null;
  inspection_checklist?: any;
  events: Array<{
    from_status?: string | null;
    to_status: string;
    reason?: string | null;
    created_at?: string | null;
  }>;
}

export interface AdminUserItem {
  id: string;
  email: string;
  display_name: string;
  phone?: string | null;
  province_code?: string | null;
  province_name?: string | null;
  address?: string | null;
  role: UserRole;
  status?: UserStatus;
  avatar_url?: string | null;
  is_email_verified: boolean;
  created_at: string;
}

export interface AdminArticleItem {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  thumbnail_url?: string | null;
  category: string;
  status: ArticleStatus;
  views_count: number;
  author: {
    id: string;
    display_name: string;
  };
  published_at?: string | null;
  created_at: string;
}

export interface AdminReportItem {
  id: string;
  reporter_user_id: string;
  reporter_name?: string | null;
  reporter_email?: string | null;
  target_type: 'LISTING' | 'USER' | 'SHOWROOM' | string;
  target_id: string;
  reason_code: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolution_note?: string | null;
  resolved_by_user_id?: string | null;
  resolved_at?: string | null;
  created_at: string;
  evidences: Array<{
    id: string;
    media_url: string;
  }>;
}

export interface AdminShowroomItem {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  province_code?: string | null;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  is_verified: boolean;
  is_active?: boolean;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  user?: {
    display_name: string;
    email: string;
  };
}

export interface AdminAppointmentParticipant {
  id: string;
  display_name: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface AdminAppointmentListingBrief {
  id: string;
  title: string;
  price_vnd: number;
  primary_image_url?: string | null;
}

export interface AdminAppointmentEvent {
  id: string;
  actor_user_id?: string | null;
  from_status?: string | null;
  to_status: string;
  note?: string | null;
  created_at?: string | null;
}

export interface AdminAppointmentItem {
  id: string;
  listing_id: string;
  listing: AdminAppointmentListingBrief;
  buyer: AdminAppointmentParticipant;
  seller: AdminAppointmentParticipant;
  scheduled_at: string;
  location?: string | null;
  note?: string | null;
  status: AppointmentStatus;
  cancel_reason_code?: string | null;
  cancel_reason_text?: string | null;
  cancelled_by_user_id?: string | null;
  cancelled_by_name?: string | null;
  completed_at?: string | null;
  created_at: string;
  events: AdminAppointmentEvent[];
}

// ==========================================
// 2. DIALOG & INTERACTION SYSTEM TYPES
// ==========================================

export type DialogVariant = 'danger' | 'warning' | 'primary' | 'success';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: string;
}

export interface PromptDialogOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  suggestions?: string[];
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ==========================================
// 3. TABLE & COMPONENT TYPES
// ==========================================

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

// ==========================================
// 4. PROMOTIONS & FEATURED LISTINGS TYPES
// ==========================================

export interface AdminPromotionPackage {
  id: string;
  code: string;
  name: string;
  days: number;
  amount_vnd: number;
  original_amount_vnd?: number | null;
  discount_percent?: number | null;
  description?: string | null;
  badge?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminFeaturedListing {
  id: string;
  title: string;
  price_vnd: number;
  primary_image_url?: string | null;
  seller_id: string;
  seller_name: string;
  seller_phone?: string | null;
  seller_email?: string | null;
  seller_avatar?: string | null;
  province_name?: string | null;
  featured_tier?: string | null;
  is_featured: boolean;
  featured_until?: string | null;
  is_active_featured: boolean;
  hours_remaining: number;
  days_remaining: number;
  views_count: number;
  favorites_count: number;
  created_at: string;
}

export interface AdminPaymentTransaction {
  id: string;
  order_code: string;
  user_id: string;
  user_name: string;
  user_email: string;
  listing_id: string;
  listing_title: string;
  package_code: string;
  package_days: number;
  amount_vnd: number;
  provider: string;
  status: string;
  vnp_transaction_no?: string | null;
  vnp_bank_code?: string | null;
  created_at: string;
  paid_at?: string | null;
}

export interface AdminPromotionsOverview {
  total_revenue_vnd: number;
  total_transactions: number;
  success_transactions: number;
  active_featured_count: number;
  active_packages_count: number;
}
