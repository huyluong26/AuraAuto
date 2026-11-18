export interface ConversationItem {
  id: string;
  listing_id: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count?: number;
  other_participant: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  listing: {
    id: string;
    title: string;
    price_vnd: number;
    primary_image_url?: string;
    manufacture_year?: number;
  };
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  content: string;
  created_at: string;
}

export interface ParsedAppointment {
  id: string;
  date: string;
  time: string;
  location: string;
  note: string;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED';
}
