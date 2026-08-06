// This file contains TypeScript type definitions 
// for the frontend API. 
// It defines the structure of user data, 
// event participants, event items, 
// and message items used in the application.

export type User = {
  id: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  district?: string;
  bio?: string;
  languages?: string[];
  interests?: string[];
  avatar?: string | null;
  friendship_status?: FriendshipStatus;
  friendship_id?: number | null;
  created_at?: string;
};

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "direct_message"
  | "group_message";

export type NotificationItem = {
  id: number;
  actor: User | null;
  type: NotificationType;
  payload: Record<string, unknown>;
  target_url: string;
  read_at: string | null;
  created_at: string;
};

export type FriendshipStatus =
  | "none"
  | "outgoing_pending"
  | "incoming_pending"
  | "accepted"
  | "rejected"
  | "blocked";
export type EventParticipant = {
  id: number;
  user: User;
  status: "attending" | "waiting";
  queue_position: number;
  joined_at: string;
};
export type EventGroupSummary = {
  id: string;
  name: string;
  sport: string;
  visibility: "public" | "private";
};
export type EventItem = {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  sport: string;
  level: "beginner" | "intermediate" | "advanced" | "all";
  languages: string[];
  location_name: string;
  location_address: string;
  latitude: number;
  longitude: number;
  start_at: string;
  end_at: string;
  max_slots: number;
  creator: User;
  group: EventGroupSummary | null;
  visibility: "public" | "private";
  participants: EventParticipant[];
  attending_count: number;
  waiting_count: number;
  user_status: null | { status: string; queue_position: number };
  created_at: string;
  updated_at: string;
};
export type MessageItem = {
  id: string;
  event: string;
  sender: User;
  text: string;
  created_at: string;
};
export type GroupMessageItem = {
  id: string;
  group: string;
  sender: User;
  text: string;
  created_at: string;
};
export type DirectMessageItem = {
  id: string;
  conversation: string;
  sender: User;
  text: string;
  created_at: string;
};
export type DirectConversationItem = {
  id: string;
  peer: User;
  last_message: DirectMessageItem | null;
  created_at: string;
  updated_at: string;
};
export type GeoSuggestion = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  source: string;
  raw: Record<string, unknown>;
};

export type SportOption = {
  code: string;
};
export type GeoResponse = {
  provider: string;
  query: string;
  language: string;
  results: GeoSuggestion[];
};

export type GroupMembership = {
  id: number;
  user: User;
  role: "owner" | "admin" | "member";
  status: "active" | "pending";
  joined_at: string;
};

export type GroupItem = {
  id: string;
  name: string;
  description: string;
  sport: string;
  levels: Array<"beginner" | "intermediate" | "advanced" | "all">;
  kind: "training" | "social" | "competitive" | "team";
  visibility: "public" | "private";
  join_policy: "open" | "approval" | "invite_only";
  max_members: number;
  languages: string[];
  location_name: string;
  location_address: string;
  cover_image: string | null;
  owner: User;
  is_active: boolean;
  member_count: number;
  current_user_membership: {
    role: "owner" | "admin" | "member";
    status: "active" | "pending";
  } | null;
  created_at: string;
  updated_at: string;
};

export type GroupPayload = {
  name: string;
  description?: string;
  sport: string;
  levels: Array<"beginner" | "intermediate" | "advanced" | "all">;
  kind?: "training" | "social" | "competitive" | "team";
  visibility?: "public" | "private";
  join_policy?: "open" | "approval" | "invite_only";
  max_members?: number;
  languages?: string[];
  location_name?: string;
  location_address?: string;
  coverImageFile?: File | null;
};
