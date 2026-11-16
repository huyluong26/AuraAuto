export interface User {
  id: string;
  email: string;
  display_name: string;
  phone_number?: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  email_verified: boolean;
  avatar_url?: string;
}

export interface ListingMedia {
  id: string;
  url?: string;
  media_url?: string;
  thumbnail_url?: string;
  media_type: 'IMAGE' | 'VIDEO' | string;
  is_primary: boolean;
  sort_order: number;
  label?: string | null;
}

export interface ListingItem {
  id: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PENDING_REVIEW' | 'PUBLISHED' | 'SOLD' | 'REJECTED' | 'HIDDEN' | string;
  title: string;
  price_vnd: number;
  manufacture_year: number;
  odometer_km: number;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  province_code?: string;
  location_address?: string;
  province_name?: string;
  primary_image_url?: string;
  seller_id?: string;
  seller_name?: string;
  seller_type?: 'INDIVIDUAL' | 'SHOWROOM';
  showroom_id?: string;
  showroom_name?: string;
  is_showroom_verified?: boolean;
  is_showroom?: boolean;
  is_featured?: boolean;
  featured_until?: string;
  featured_tier?: string;
  has_pending_revision?: boolean;
  pending_revision_no?: number | null;
  views_count?: number;
  favorites_count?: number;
  contacts_count?: number;
  rejection_reason?: string;
  published_at?: string;
  created_at: string;
}

export interface ListingDetail extends ListingItem {
  brand_id?: string;
  brand_name?: string;
  description?: string;
  engine_displacement?: number;
  doors?: number;
  seats?: number;
  color?: string;
  interior_color?: string;
  drivetrain?: string;
  condition?: string;
  origin?: string;
  location_address?: string;
  accident_status: 'UNKNOWN' | 'NONE' | 'MINOR' | 'MAJOR';
  flood_status: 'UNKNOWN' | 'NONE' | 'SUSPECTED' | 'CONFIRMED';
  service_history: 'UNKNOWN' | 'NONE' | 'PARTIAL' | 'FULL';
  owner_count?: number;
  repainted_parts_count?: number;
  replaced_parts?: string;
  engine_repaired: boolean;
  transmission_repaired: boolean;
  media: ListingMedia[];
  seller: {
    id: string;
    display_name: string;
    phone?: string;
    phone_number?: string;
    avatar_url?: string;
    role?: string;
    is_showroom?: boolean;
    showroom_name?: string;
    is_showroom_verified?: boolean;
    rating?: number;
    review_count?: number;
  };
}

export interface ValuationExplanation {
  summary: string;
  positive_factors: string[];
  negative_factors: string[];
  market_advice?: string;
}

export interface CarRecognitionResponse {
  brand?: string | null;
  model?: string | null;
  trim?: string | null;
  manufacture_year?: number | null;
  body_type?: string | null;
  color?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  seats?: number | null;
  odometer_km?: number | null;
  confidence_score: number;
  suggested_title?: string | null;
  suggested_description?: string | null;
  image_url?: string | null;
  notes?: string | null;
}

export interface ValuationResponse {
  status: string;
  model_version: string;
  estimated_price_vnd: number | null;
  interval_low_vnd: number | null;
  interval_high_vnd: number | null;
  interval_method: string;
  confidence_level?: string;
  reference_count?: number;
  ml_price_vnd?: number;
  pricing_method?: string;
  reason?: string;
  similar_listings: ListingItem[];
  explanation?: ValuationExplanation;
  disclaimer: string;
}

export interface NaturalSearchResponse {
  original_query: string;
  extracted_criteria: {
    brand?: string;
    model?: string;
    body_type?: string;
    fuel_type?: string;
    transmission?: string;
    min_price_vnd?: number;
    max_price_vnd?: number;
    min_year?: number;
    max_year?: number;
    max_km?: number;
    province_code?: string;
  };
  results: ListingItem[];
  total_found: number;
}

export interface ArticleAuthor {
  id: string;
  display_name: string;
  avatar_url?: string | null;
}

export interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  thumbnail_url?: string;
  category: string;
  status: string;
  views_count: number;
  author: ArticleAuthor;
  published_at?: string;
  created_at: string;
}

export interface ArticleDetail extends ArticleItem {
  content: string;
  updated_at: string;
}

export interface ShowroomItem {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  province_code?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  is_verified: boolean;
  active_listings_count?: number;
  created_at?: string;
}

export interface PublicSellerProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  province_code?: string;
  province_name?: string;
  account_type: 'INDIVIDUAL' | 'SHOWROOM' | string;
  created_at: string;
  rating_avg: number;
  reviews_count: number;
  active_listings_count: number;
  sold_listings_count: number;
  showroom?: ShowroomItem | null;
  active_listings: ListingItem[];
}

