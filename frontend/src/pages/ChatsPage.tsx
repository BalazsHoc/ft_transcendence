import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CalendarDays, MessageCircle } from "lucide-react";

import { getEvents } from "../api/eventsApi";
import {
  createDirectConversation,
  getDirectConversation,
  getDirectConversations,
} from "../api/messagesApi";
import { useAuth } from "../features/auth/AuthContext";
import { DirectChat } from "../components/chat/DirectChat";
import { EventChat } from "../components/chat/EventChat";
import { Badge } from "../components/shared/Badge";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../utils/media";
import { PresenceStatus } from "../components/shared/PresenceStatus";
import type {
  DirectConversationItem,
  EventItem,
} from "../types/api";

type ChatFilter = "all" | "personal" | "events";

const CHAT_FILTERS: { value: ChatFilter; labelKey: string }[] = [
  { value: "all", labelKey: "chats.filterAll" },
  { value: "personal", labelKey: "chats.filterPersonal" },
  { value: "events", labelKey: "chats.filterEvents" },
];

export function ChatsPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
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
  const [filter, setFilter] = useState<ChatFilter>("all");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

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
        if (requestedConversation) setMobileView("chat");
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
  const mobileChatVisible = mobileView === "chat" && Boolean(selectedConversation || selectedEvent);

  return (
    <div className="mx-auto flex h-[calc(100vh-88px)] max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
      <header
        className={`${mobileChatVisible ? "hidden md:flex" : "flex"} shrink-0 flex-nowrap items-center gap-3 border-b border-[var(--surface-border)] pb-4 md:flex-wrap md:gap-4 md:pb-6`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--button-bg)] text-[var(--button-text)] md:h-14 md:w-14 md:rounded-2xl">
          <MessageCircle size={26} />
        </div>
        <div className="flex min-w-0 items-center md:block md:space-y-1">
          <h1 className="font-display text-2xl font-bold text-[var(--text)] md:text-4xl">
            {t("chats.title")}
          </h1>
          <p className="hidden text-sm text-[var(--text)] opacity-70 md:block md:text-base">{t("chats.description")}</p>
        </div>
      </header>

      {error && <p role="alert" className="shrink-0 text-sm text-red-600">{error}</p>}

      <div className="grid min-h-0 flex-1 gap-6 md:grid-cols-12">
        <aside
          className={`${mobileChatVisible ? "hidden md:block" : "block"} min-h-0 space-y-6 overflow-y-auto md:col-span-4`}
        >
          <div role="tablist" className="flex gap-1 rounded-full bg-[var(--bg)] p-1">
            {CHAT_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={filter === option.value}
                onClick={() => {
                  setFilter(option.value);
                  setMobileView("list");
                }}
                className={[
                  "flex-1 rounded-full px-3 py-1.5 text-sm font-medium text-white transition-all",
                  filter === option.value
                    ? "bg-[var(--button-bg)] shadow-sm"
                    : "opacity-70 hover:opacity-100",
                ].join(" ")}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>

          {filter !== "events" && (
          <section className="space-y-2 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-4 shadow-sm">
            <h2 className="flex items-center justify-between gap-2 px-1 text-sm font-medium text-[var(--text)] opacity-70">
              <span className="flex items-center gap-2">
                <MessageCircle size={16} />
                {t("chats.personal")}
              </span>
              {conversations.length > 0 && <Badge>{conversations.length}</Badge>}
            </h2>
            {loadingConversations ? (
              <p className="px-1 text-sm text-[var(--text)] opacity-70">{t("chats.loading")}</p>
            ) : conversations.length === 0 ? (
              <p className="px-1 text-sm text-[var(--text)] opacity-70">{t("chats.noPersonal")}</p>
            ) : (
              <ul className="space-y-1">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === selectedConversationId;
                  const preview = conversation.last_message
                    ? `${conversation.last_message.sender.id === currentUser?.id ? `${t("chats.you")}: ` : ""}${conversation.last_message.text}`
                    : t("chats.noMessages");
                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedConversationId(conversation.id);
                          setSelectedEventId("");
                          setMobileView("chat");
                        }}
                        className={[
                          "group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all",
                          isActive
                            ? "border-transparent bg-[var(--surface-border)] shadow-sm"
                            : "border-transparent hover:bg-[var(--bg)]",
                        ].join(" ")}
                      >
                        <img
                          src={resolveMediaUrl(conversation.peer.avatar, DEFAULT_AVATAR_SRC)}
                          alt=""
                          className={[
                            "h-10 w-10 shrink-0 rounded-full object-cover transition-all",
                            isActive ? "ring-2 ring-[var(--button-bg)] ring-offset-2 ring-offset-[var(--surface)]" : "",
                          ].join(" ")}
                          onError={(event: any) => {
                            event.currentTarget.src = DEFAULT_AVATAR_SRC;
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white group-hover:text-[var(--text)]">
                            {conversation.peer.username}
                          </p>
                          <PresenceStatus user={conversation.peer} />
                          <p className="truncate text-xs text-white opacity-70 group-hover:text-[var(--text)]">{preview}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          )}

          {filter !== "personal" && (
          <section className="space-y-2 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-4 shadow-sm">
            <h2 className="flex items-center justify-between gap-2 px-1 text-sm font-medium text-[var(--text)] opacity-70">
              <span className="flex items-center gap-2">
                <CalendarDays size={16} />
                {t("chats.eventChats")}
              </span>
              {events.length > 0 && <Badge>{events.length}</Badge>}
            </h2>
            {loadingEvents ? (
              <p className="px-1 text-sm text-[var(--text)] opacity-70">{t("chats.loadingEvents")}</p>
            ) : events.length === 0 ? (
              <p className="px-1 text-sm text-[var(--text)] opacity-70">{t("chats.noEventChats")}</p>
            ) : (
              <ul className="space-y-1">
                {events.map((event) => {
                  const isActive = event.id === selectedEventId;
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEventId(event.id);
                          setSelectedConversationId("");
                          setMobileView("chat");
                        }}
                        className={[
                          "group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all",
                          isActive
                            ? "border-transparent bg-[var(--surface-border)] shadow-sm"
                            : "border-transparent hover:bg-[var(--bg)]",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--muted)] transition-all",
                            isActive ? "ring-2 ring-[var(--button-bg)] ring-offset-2 ring-offset-[var(--surface)]" : "",
                          ].join(" ")}
                        >
                          <CalendarDays size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white group-hover:text-[var(--text)]">{event.title}</p>
                          <p className="truncate text-xs text-white opacity-70 group-hover:text-[var(--text)]">{t(`sports.${event.sport}`)}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          )}
        </aside>

        <div
          className={`${mobileChatVisible ? "flex" : "hidden md:flex"} min-h-0 flex-col md:col-span-8`}
        >
          {mobileChatVisible && (
            <button
              type="button"
              className="mb-3 inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface)] md:hidden"
              onClick={() => setMobileView("list")}
            >
              <ArrowLeft size={16} />
              {t("chats.backToList")}
            </button>
          )}

          <div className="min-h-0 flex-1">
            {selectedConversation ? (
              <DirectChat conversation={selectedConversation} />
            ) : selectedEvent ? (
              <EventChat eventId={selectedEvent.id} eventTitle={selectedEvent.title} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[var(--surface-border)] bg-[var(--surface)] text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--muted)]">
                  <MessageCircle size={28} />
                </span>
                <p className="max-w-xs text-sm text-[var(--text)] opacity-70">{t("chats.empty")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
