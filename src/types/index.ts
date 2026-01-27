// Type definitions for thehole.app

export type Intent = 'chatting' | 'looking_now' | 'looking_later' | 'friends';

export type Availability = 'now' | 'today' | 'later' | 'offline';

export type BodyType = 'slim' | 'average' | 'athletic' | 'muscular' | 'stocky' | 'heavy';

export type Position = 'top' | 'bottom' | 'vers' | 'vers_top' | 'vers_bottom' | 'side';

export type HostTravel = 'host' | 'travel' | 'both' | 'neither';

export type SmokingStatus = 'never' | 'sometimes' | 'often';

export type DrugStatus = 'never' | 'sometimes' | 'party';

export type SaferSex = 'always' | 'sometimes' | 'never';

export type HivStatus = 'negative' | 'positive' | 'undetectable' | 'on_prep' | 'unknown';

export interface LookingFor {
  position?: Position[];
  body_type?: BodyType[];
  age_min?: number;
  age_max?: number;
  host_travel?: HostTravel[];
}

export interface User {
  id: string;
  username: string;
  display_name?: string; // User-facing name shown on profile, can be duplicated (e.g., "cruising now")
  avatar_url: string | null;
  intent: Intent;
  availability: Availability;
  is_verified: boolean;
  verified_at?: string;
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

  // Stats
  height_cm?: number;
  weight_kg?: number;
  body_type?: BodyType;
  ethnicity?: string;

  // About me
  position?: Position;
  host_travel?: HostTravel;
  smoker?: SmokingStatus;
  drugs?: DrugStatus;
  safer_sex?: SaferSex;
  hiv_status?: HivStatus;

  // Social links
  instagram_handle?: string;
  twitter_handle?: string;

  // Preferences
  looking_for?: LookingFor;

  // Kinks
  kinks?: string[];

  // Visibility settings
  show_in_grid?: boolean;
  show_on_map?: boolean;
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

  // Premium location details
  directions?: string;
  best_times?: string;
  parking_info?: string;
  safety_tips?: string;
  amenities?: string[];
  photos?: string[];
  cover_photo?: string;
  hours?: Record<string, string>;
  website?: string;
  phone?: string;
  entry_fee?: string;
  dress_code?: string;
  crowd_type?: string;
  vibe?: string;
  age_range?: string;
  busy_rating?: number; // 1-5
  avg_rating?: number;
  last_verified_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  album_share?: AlbumShareMessage;
  created_at: string;
  read_at?: string;
}

// Album types
export type AlbumItemType = 'photo' | 'video';

export interface Album {
  id: string;
  owner_id: string;
  name: string;
  cover_url: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface AlbumItem {
  id: string;
  album_id: string;
  type: AlbumItemType;
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  sort_order: number;
  created_at: string;
}

export interface AlbumAccessGrant {
  id: string;
  album_id: string;
  granted_by: string;
  granted_to: string;
  conversation_id: string | null;
  granted_at: string;
  expires_at: string | null;
  is_locked: boolean;
}

export interface AlbumWithAccess extends Album {
  access?: AlbumAccessGrant;
  items?: AlbumItem[];
}

export interface AlbumShareMessage {
  album_id: string;
  album_name: string;
  item_count: number;
  preview_url: string | null;
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
  location_accuracy: number; // 0-200 meters, how much to fuzz location for privacy
  show_in_grid: boolean;
  show_on_map: boolean;
}

// Contact types for managing people you've had encounters with
export type ContactHivStatus = 'negative' | 'positive' | 'undetectable' | 'on_prep' | 'unknown';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  phone_hint: string | null;
  social_handle: string | null;
  appearance_notes: string | null;
  preferred_activities: string[] | null;
  hiv_status: ContactHivStatus | null;
  last_tested_date: string | null;
  health_notes: string | null;
  created_at: string;
  updated_at: string;
  // Computed client-side
  encounter_count?: number;
  last_met?: string;
}

export interface UnifiedContact {
  type: 'app_user' | 'manual';
  id: string;               // profile_id or contact_id
  name: string;
  avatar_url: string | null;
  encounter_count: number;
  last_met: string | null;
  first_met: string | null;
  profile?: User;           // For app users only
  contact?: Contact;        // For manual contacts only
}
