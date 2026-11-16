import { ListingDetail, ListingItem, ValuationResponse } from '@/types';

export interface GalleryImage {
  url: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  sender_user_id: string;
  content: string;
  created_at: string;
}

export interface ConversationInfo {
  id: string;
  listing_id: string;
  other_participant?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  };
}
