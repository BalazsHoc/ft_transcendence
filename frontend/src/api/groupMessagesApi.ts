import { apiRequest } from "./client";
import type { GroupMessageItem } from "../types/api";

export function getGroupMessages(groupId: string) {
  return apiRequest<GroupMessageItem[]>(`/api/groups/${groupId}/messages/`);
}

export function sendGroupMessage(groupId: string, text: string) {
  return apiRequest<GroupMessageItem>(`/api/groups/${groupId}/messages/`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
