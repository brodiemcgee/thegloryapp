// Type definitions for thehole.app

export type Intent = 'looking' | 'hosting' | 'traveling' | 'discrete';

export type Availability = 'now' | 'today' | 'later' | 'offline';

export interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  intent: Intent;
  availability: Availability;
  is_verified: boolean;
  distance_km?: number;
  last_active: string;
  location?: {
    lat: number;
    lng: number;
  };
  bio?: string;
  age?: number;
  photos: string[];
  is_online: boolean;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'cruising' | 'venue';
  lat: number;
  lng: number;
  user_count: number;
  created_by: string;
  is_verified: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  read_at?: string;
}

export interface Conversation {
  id: string;
  user: User;
  last_message: Message | null;
  unread_count: number;
  updated_at: string;
}

export interface AppSettings {
  sfw_mode: boolean;
  location_enabled: boolean;
  push_notifications: boolean;
  ghost_mode: boolean;
  hide_from_contacts: boolean;
}
