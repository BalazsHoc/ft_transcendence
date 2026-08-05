import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getEvents } from "../api/eventsApi";
import {
  createDirectConversation,
  getDirectConversation,
  getDirectConversations,
} from "../api/messagesApi";
import { DirectChat } from "../components/chat/DirectChat";
import { EventChat } from "../components/chat/EventChat";
import type {
  DirectConversationItem,
  EventItem,
} from "../types/api";

export function ChatsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const requestedUserId = searchParams.get("userId");
  const requestedConversationId = searchParams.get("conversationId");
  const [conversations, setConversations] = useState<DirectConversationItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setLoadingConversations(true);
      try {
        let nextConversations = await getDirectConversations();
        let requestedConversation = requestedConversationId
          ? nextConversations.find((item) => item.id === requestedConversationId)
          : undefined;

        if (!requestedConversation && requestedConversationId) {
          try {
            requestedConversation = await getDirectConversation(requestedConversationId);
            nextConversations = [requestedConversation, ...nextConversations];
          } catch {
            requestedConversation = undefined;
          }
        }

        if (requestedUserId) {
          const createdConversation = await createDirectConversation(requestedUserId);
          if (!nextConversations.some((item) => item.id === createdConversation.id)) {
            nextConversations = [createdConversation, ...nextConversations];
          }
          requestedConversation = createdConversation;
        }

        if (cancelled) return;
        setConversations(nextConversations);
        setSelectedConversationId(requestedConversation?.id || "");
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t("chats.loadError"));
        }
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    }

    void loadConversations();
    return () => {
      cancelled = true;
    };
  }, [requestedConversationId, requestedUserId, t]);

  useEffect(() => {
    let cancelled = false;

    getEvents()
      .then((data) => {
        if (cancelled) return;
        const joinedEvents = (Array.isArray(data) ? data : []).filter(
          (event) => event.user_status,
        );
        setEvents(joinedEvents);
        if (!selectedConversationId) setSelectedEventId(joinedEvents[0]?.id || "");
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t("chats.loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );
  const selectedEvent = events.find((event) => event.id === selectedEventId) || null;

  return (
    <main>
      <h1>{t("chats.title")}</h1>
      {error && <p role="alert">{error}</p>}

      <div className="two-column">
        <aside className="sidebar-list">
          <h3>{t("chats.personal")}</h3>
          {loadingConversations ? (
            <p>{t("chats.loading")}</p>
          ) : conversations.length === 0 ? (
            <p>{t("chats.noPersonal")}</p>
          ) : (
            conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                className={conversation.id === selectedConversationId ? "active" : ""}
                onClick={() => {
                  setSelectedConversationId(conversation.id);
                  setSelectedEventId("");
                }}
              >
                {conversation.peer.username}
              </button>
            ))
          )}

          <h3>{t("chats.eventChats")}</h3>
          {loadingEvents ? (
            <p>{t("chats.loadingEvents")}</p>
          ) : events.length === 0 ? (
            <p>{t("chats.noEventChats")}</p>
          ) : (
            events.map((event) => (
              <button
                type="button"
                key={event.id}
                className={event.id === selectedEventId ? "active" : ""}
                onClick={() => {
                  setSelectedEventId(event.id);
                  setSelectedConversationId("");
                }}
              >
                {event.title}
              </button>
            ))
          )}
        </aside>

        {selectedConversation ? (
          <DirectChat conversation={selectedConversation} />
        ) : selectedEvent ? (
          <EventChat eventId={selectedEvent.id} />
        ) : (
          <p>{t("chats.empty")}</p>
        )}
      </div>
    </main>
  );
}
