import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, Send } from "lucide-react";

import { getAccessToken } from "../../api/client";
import { getEventMessages } from "../../api/eventsApi";
import { useAuth } from "../../features/auth/AuthContext";
import type { MessageItem } from "../../types/api";
import Button from "../shared/Button";

import styles from "./EventChat.module.css";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";

export function EventChat({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle?: string;
}) {
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
    setConnected(false);

    getEventMessages(eventId)
      .then((data) => {
        if (!cancelled) {
          setMessages(data);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setStatusMessage(
            loadError instanceof Error
              ? loadError.message
              : t("chats.loadError"),
          );
        }
      });

    const token = getAccessToken();

    if (!token) {
      setStatusMessage(t("chats.authRequired"));

      return () => {
        cancelled = true;
      };
    }

    const ws = new WebSocket(
      `${WS_URL}/ws/events/${eventId}/?token=${encodeURIComponent(token)}`,
    );

    wsRef.current = ws;

    ws.onopen = () => {
      if (!cancelled) {
        setConnected(true);
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        type?: string;
        detail?: string;
      } & Partial<MessageItem>;

      if (data.type === "message" && data.id && data.sender && data.text) {
        setMessages((previous) => {
          if (previous.some((message) => message.id === data.id)) {
            return previous;
          }

          return [...previous, data as MessageItem];
        });
      } else if (data.detail) {
        setStatusMessage(data.detail);
      }
    };

    ws.onclose = () => {
      if (!cancelled) {
        setConnected(false);
      }
    };

    ws.onerror = () => {
      if (!cancelled) {
        setStatusMessage(t("chats.wsError"));
      }
    };

    return () => {
      cancelled = true;
      ws.close();
      wsRef.current = null;
    };
  }, [eventId, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [eventId]);

  async function sendMessage() {
    const trimmed = text.trim();

    if (!trimmed) return;

    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setStatusMessage(t("chats.wsError"));
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        text: trimmed,
      }),
    );

    setText("");
  }

  return (
    <section
      aria-label={t("chats.eventChats")}
      className={styles.chatPanel}
    >
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerIconWrapper}>
          <span className={styles.headerIcon}>
            <CalendarDays size={18} />
          </span>

          <span
            className={`${styles.connectionIndicator} ${
              connected
                ? styles.connected
                : styles.disconnected
            }`}
            aria-hidden="true"
          />
        </div>

        <div className={styles.headerContent}>
          <p className={styles.eventName}>
            {eventTitle || t("chats.eventChats")}
          </p>

          <p className={styles.connectionStatus}>
            {connected
              ? t("chats.connected")
              : t("chats.disconnected")}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <CalendarDays
              size={28}
              className={styles.emptyIcon}
              aria-hidden="true"
            />

            <p className={styles.emptyText}>
              {t("chats.noMessages")}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn =
              message.sender?.id === currentUser?.id;

            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];

            const isFirstInGroup =
              !previousMessage ||
              previousMessage.sender?.id !== message.sender?.id;

            const isLastInGroup =
              !nextMessage ||
              nextMessage.sender?.id !== message.sender?.id;

            const time = new Date(
              message.created_at,
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={message.id}
                className={[
                  styles.messageRow,
                  isOwn
                    ? styles.messageRowOwn
                    : styles.messageRowOther,
                  isFirstInGroup
                    ? styles.messageRowFirst
                    : styles.messageRowContinued,
                ].join(" ")}
              >
                <div
                  className={[
                    styles.messageBubble,
                    isOwn
                      ? styles.ownBubble
                      : styles.otherBubble,
                  ].join(" ")}
                >
                  {!isOwn && isFirstInGroup && (
                    <p className={styles.senderName}>
                      {message.sender?.username ||
                        t("chats.eventChats")}
                    </p>
                  )}

                  {message.text}
                </div>

                {isLastInGroup && (
                  <span className={styles.timestamp}>
                    {time}
                  </span>
                )}
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Status */}
      {statusMessage && (
        <p
          role="alert"
          className={styles.statusMessage}
        >
          {statusMessage}
        </p>
      )}

      {/* Input */}
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          value={text}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setText(event.target.value)
          }
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              void sendMessage();
            }
          }}
          placeholder={t("chats.placeholder")}
          aria-label={t("chats.placeholder")}
          className={styles.input}
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