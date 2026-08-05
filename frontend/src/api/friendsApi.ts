import { apiRequest } from "./client";
import type { FriendshipStatus, User } from "../types/api";

export type FriendshipItem = {
  id: number;
  friend: User;
  requester: User;
  requested_by: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

export function sendFriendRequest(userId: string) {
  return apiRequest<FriendshipItem>("/api/friends/requests/", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export function getFriends() {
  return apiRequest<FriendshipItem[]>("/api/friends/");
}

export function getIncomingFriendRequests() {
  return apiRequest<FriendshipItem[]>("/api/friends/requests/incoming/");
}

export function getOutgoingFriendRequests() {
  return apiRequest<FriendshipItem[]>("/api/friends/requests/outgoing/");
}

export function removeFriend(friendshipId: number) {
  return apiRequest<void>(`/api/friends/${friendshipId}/`, { method: "DELETE" });
}

export function acceptFriendRequest(friendshipId: number) {
  return apiRequest<FriendshipItem>(`/api/friends/requests/${friendshipId}/accept/`, {
    method: "POST",
  });
}

export function rejectFriendRequest(friendshipId: number) {
  return apiRequest<FriendshipItem>(`/api/friends/requests/${friendshipId}/reject/`, {
    method: "POST",
  });
}
