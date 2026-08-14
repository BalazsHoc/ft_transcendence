import { apiRequest } from "./client";
import type { NotificationItem } from "../types/api";

export function getNotifications(unreadOnly = false) {
  const query = unreadOnly ? "?unread=true" : "";
  return apiRequest<NotificationItem[]>(`/api/notifications/${query}`);
}

export function getUnreadNotificationCount() {
  return apiRequest<{ count: number }>("/api/notifications/unread-count/");
}

export function markNotificationRead(notificationId: number) {
  return apiRequest<NotificationItem>(`/api/notifications/${notificationId}/read/`, {
    method: "POST",
  });
}

export function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>("/api/notifications/read-all/", {
    method: "POST",
  });
}
