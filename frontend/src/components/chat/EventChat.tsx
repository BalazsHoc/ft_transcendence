import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, Send } from "lucide-react";

import { getAccessToken } from "../../api/client";
import { getEventMessages } from "../../api/eventsApi";
import { useAuth } from "../../features/auth/AuthContext";
import type { MessageItem } from "../../types/api";
import Button from "../shared/Button";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";

export function EventChat({ eventId, eventTitle }: { eventId: string; eventTitle?: string }) {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setStatusMessage("");

    getEventMessages(eventId)
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setStatusMessage(loadError instanceof Error ? loadError.message : t("chats.loadError"));
        }
      });

    const token = getAccessToken();
    if (!token) {
      setStatusMessage(t("chats.authRequired"));
      return () => {
        cancelled = true;
      };
    }

    const ws = new WebSocket(`${WS_URL}/ws/events/${eventId}/?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!cancelled) {
        setConnected(true);
        setStatusMessage("");
      }
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as { type?: string; detail?: string } & Partial<MessageItem>;
      if (data.type === "message" && data.id && data.sender && data.text) {
        setMessages((previous) => {
          if (previous.some((message) => message.id === data.id)) return previous;
          return [...previous, data as MessageItem];
        });
      } else if (data.detail) {
        setStatusMessage(data.detail);
      }
    };
    ws.onclose = (closeEvent) => {
      if (cancelled) return;
      setConnected(false);
      if (closeEvent.code === 4001) {
        setStatusMessage(t("chats.authRequired"));
      } else if (closeEvent.code === 4003) {
        setStatusMessage(t("event.chatJoinPrompt"));
      }
    };

    return () => {
      cancelled = true;
      ws.close();
      wsRef.current = null;
    };
  }, [eventId, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [eventId]);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setStatusMessage(t("chats.disconnected"));
      return;
    }
    wsRef.current.send(JSON.stringify({ text: trimmed }));
    setText("");
  }

  return (
    <section
      aria-label={t("chats.eventChats")}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] shadow-sm"
    >
      <header className="flex items-center gap-3 border-b border-[var(--surface-border)] bg-gradient-to-r from-[var(--bg)] to-transparent p-4">
        <div className="relative shrink-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--text)] ring-2 ring-[var(--surface)]">
            <CalendarDays size={18} />
          </span>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${connected ? "bg-emerald-500" : "bg-[var(--muted)]"}`}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[var(--text)]">{eventTitle || t("chats.eventChats")}</p>
          <p className="truncate text-xs text-[var(--muted)]">
            {connected ? t("chats.connected") : t("chats.disconnected")}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <CalendarDays size={28} className="text-[var(--muted)] opacity-40" />
            <p className="text-sm text-[var(--muted)]">{t("chats.noMessages")}</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender?.id === currentUser?.id;
            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            const isFirstInGroup = !previousMessage || previousMessage.sender?.id !== message.sender?.id;
            const isLastInGroup = !nextMessage || nextMessage.sender?.id !== message.sender?.id;
            const time = new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={message.id}
                className={[
                  "flex animate-message-in flex-col",
                  isOwn ? "items-end" : "items-start",
                  isFirstInGroup ? "mt-3" : "mt-0.5",
                ].join(" ")}
              >
                <div
                  className={[
                    "max-w-[75%] px-4 py-2 text-sm shadow-sm",
                    isOwn
                      ? "rounded-2xl rounded-br-md bg-[var(--button-bg)] text-[var(--button-text)]"
                      : "rounded-2xl rounded-bl-md border border-[var(--surface-border)] bg-[var(--bg)] text-[var(--text)]",
                  ].join(" ")}
                >
                  {!isOwn && isFirstInGroup && (
                    <p className="mb-0.5 text-xs font-medium text-[var(--muted)]">
                      {message.sender?.username || t("chats.eventChats")}
                    </p>
                  )}
                  {message.text}
                </div>
                {isLastInGroup && (
                  <span className="mt-1 px-1 text-[11px] text-[var(--muted)]">{time}</span>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {statusMessage && (
        <p role="alert" className="px-4 pb-2 text-xs text-red-600">
          {statusMessage}
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-[var(--surface-border)] p-3">
        <input
          ref={inputRef}
          value={text}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") void sendMessage();
          }}
          placeholder={t("chats.placeholder")}
          aria-label={t("chats.placeholder")}
          className="min-w-0 flex-1 rounded-full"
        />
        <Button
          variant="primary"
          size="sm"
          iconOnly
          icon={<Send size={16} />}
          aria-label={t("common.send")}
          disabled={!text.trim()}
          onClick={() => void sendMessage()}
        />
      </div>
    </section>
  );
}
