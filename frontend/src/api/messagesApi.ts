import { apiRequest } from "./client";
import type {
  DirectConversationItem,
  DirectMessageItem,
} from "../types/api";

export function getDirectConversations() {
  return apiRequest<DirectConversationItem[]>("/api/messages/conversations/");
}

export function createDirectConversation(userId: string) {
  return apiRequest<DirectConversationItem>("/api/messages/conversations/", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export function getDirectConversation(conversationId: string) {
  return apiRequest<DirectConversationItem>(
    `/api/messages/conversations/${conversationId}/`,
  );
}

export function getDirectMessages(conversationId: string) {
  return apiRequest<DirectMessageItem[]>(
    `/api/messages/conversations/${conversationId}/messages/`,
  );
}

export function sendDirectMessage(conversationId: string, text: string) {
  return apiRequest<DirectMessageItem>(
    `/api/messages/conversations/${conversationId}/messages/`,
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
  );
}
