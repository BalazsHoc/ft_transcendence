export type User = {
  id: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  district?: string;
  languages?: string[];
  interests?: string[];
  avatar?: string | null;
  created_at?: string;
};
export type EventParticipant = {
  id: number;
  user: User;
  status: "attending" | "waiting";
  queue_position: number;
  joined_at: string;
};
export type EventItem = {
  id: string;
  title: string;
  description: string;
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
