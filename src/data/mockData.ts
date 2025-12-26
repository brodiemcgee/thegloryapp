// Mock data for development

import { User, Location, Conversation, Message } from '@/types';

// Placeholder avatar URLs (using UI Avatars service for demo)
const getAvatarUrl = (name: string, bg: string = '1f2937') =>
  `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=128&bold=true`;

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'hungdude',
    avatar_url: getAvatarUrl('H', 'ef4444'),
    intent: 'looking_now',
    availability: 'now',
    is_verified: true,
    distance_km: 0.3,
    last_active: new Date().toISOString(),
    location: { lat: -33.8688, lng: 151.2093 },
    bio: 'Here for a good time',
    age: 28,
    photos: [],
    is_online: true,
  },
  {
    id: '2',
    username: 'chill_guy',
    avatar_url: null, // No avatar - will show initial
    intent: 'chatting',
    availability: 'now',
    is_verified: false,
    distance_km: 0.8,
    last_active: new Date().toISOString(),
    location: { lat: -33.8700, lng: 151.2100 },
    age: 35,
    photos: [],
    is_online: true,
  },
  {
    id: '3',
    username: 'later_tonight',
    avatar_url: getAvatarUrl('LT', '3b82f6'),
    intent: 'looking_later',
    availability: 'today',
    is_verified: true,
    distance_km: 1.2,
    last_active: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    location: { lat: -33.8650, lng: 151.2050 },
    bio: 'Free after work',
    age: 32,
    photos: [],
    is_online: false,
  },
  {
    id: '4',
    username: 'just_mates',
    avatar_url: getAvatarUrl('JM', '22c55e'),
    intent: 'friends',
    availability: 'later',
    is_verified: true,
    distance_km: 2.5,
    last_active: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    location: { lat: -33.8720, lng: 151.2150 },
    bio: 'Looking to make friends',
    age: 29,
    photos: [],
    is_online: false,
  },
  {
    id: '5',
    username: 'anon_user',
    avatar_url: null, // No avatar - will show initial
    intent: 'looking_now',
    availability: 'now',
    is_verified: false,
    distance_km: 0.5,
    last_active: new Date().toISOString(),
    location: { lat: -33.8695, lng: 151.2080 },
    photos: [],
    is_online: true,
  },
];

export const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Central Park Restroom',
    description: 'Ground floor, near the fountain',
    type: 'public',
    lat: -33.8688,
    lng: 151.2093,
    user_count: 3,
    created_by: '1',
    is_verified: true,
  },
  {
    id: '2',
    name: 'Beach Carpark',
    description: 'North end, after dark',
    type: 'cruising',
    lat: -33.8750,
    lng: 151.2200,
    user_count: 5,
    created_by: '2',
    is_verified: true,
  },
  {
    id: '3',
    name: 'Sauna Club',
    description: 'Members only venue',
    type: 'venue',
    lat: -33.8600,
    lng: 151.2000,
    user_count: 12,
    created_by: '3',
    is_verified: true,
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    sender_id: '2',
    receiver_id: 'current',
    content: 'Hey, you around?',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    sender_id: 'current',
    receiver_id: '2',
    content: 'Yeah, nearby',
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    read_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: '3',
    sender_id: '2',
    receiver_id: 'current',
    content: 'Want to meet up?',
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    user: mockUsers[1],
    last_message: mockMessages[2],
    unread_count: 1,
    updated_at: mockMessages[2].created_at,
  },
  {
    id: '2',
    user: mockUsers[2],
    last_message: {
      id: '4',
      sender_id: '3',
      receiver_id: 'current',
      content: 'Come over whenever',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    unread_count: 0,
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    user: mockUsers[0],
    last_message: {
      id: '5',
      sender_id: 'current',
      receiver_id: '1',
      content: 'Sounds good',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    unread_count: 0,
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export const currentUser: User = {
  id: 'current',
  username: 'me',
  avatar_url: null,
  intent: 'chatting',
  availability: 'now',
  is_verified: true,
  last_active: new Date().toISOString(),
  location: { lat: -33.8688, lng: 151.2093 },
  bio: 'Just here to connect',
  age: 30,
  photos: [],
  is_online: true,
};
