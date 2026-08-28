import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Users, Send } from "lucide-react";
import { getGroupMessages, sendGroupMessage } from "../../api/groupMessagesApi";
import { getAccessToken } from "../../api/client";
import type { GroupMessageItem } from "../../types/api";
import { useAuth } from "../../features/auth/AuthContext";
import Button from "../shared/Button";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";

export function GroupChat({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [messages, setMessages] = useState<GroupMessageItem[]>([]);
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

    getGroupMessages(groupId)
      .then((data) => {
        if (!cancelled) {
          setMessages(data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatusMessage(
            error instanceof Error
              ? error.message
              : t("groups.chatLoadError"),
          );
        }
      });

    const token = getAccessToken();

    if (!token) {
      setStatusMessage(t("groups.chatAuthRequired"));

      return () => {
        cancelled = true;
      };
    }

    const ws = new WebSocket(
      `${WS_URL}/ws/groups/${groupId}/?token=${encodeURIComponent(token)}`,
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
      } & Partial<GroupMessageItem>;

      if (data.type === "message" && data.id && data.sender && data.text) {
        setMessages((previous) => {
          if (previous.some((message) => message.id === data.id)) {
            return previous;
          }

          return [...previous, data as GroupMessageItem];
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
        setStatusMessage(t("groups.chatWsError"));
      }
    };

    return () => {
      cancelled = true;
      ws.close();
      wsRef.current = null;
    };
  }, [groupId, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [groupId]);

  async function sendMessage() {
    const trimmed = text.trim();

    if (!trimmed) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: trimmed }));
      setText("");
      return;
    }

    try {
      const message = await sendGroupMessage(groupId, trimmed);
      setMessages((previous) => [...previous, message]);
      setText("");
    } catch (error: unknown) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : t("groups.chatSendError"),
      );
    }
  }

  return (
    <section
      id="group-chat"
      aria-label={t("groups.chatTitle")}
      className="flex h-[500px] flex-col overflow-hidden rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] shadow-sm"
    >
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[var(--surface-border)] bg-gradient-to-r from-[var(--bg)] to-transparent p-4">
        <div className="relative shrink-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--text)] ring-2 ring-[var(--surface)]">
            <Users size={18} />
          </span>

          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${
              connected ? "bg-emerald-500" : "bg-[var(--muted)]"
            }`}
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[var(--text)]">
            {groupName}
          </p>

          <p className="truncate text-xs text-[var(--muted)]">
            {connected
              ? t("groups.chatConnected")
              : t("groups.chatDisconnected")}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Users
              size={28}
              className="text-[var(--muted)] opacity-40"
            />

            <p className="text-sm text-[var(--muted)]">
              {t("groups.chatEmpty")}
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
                      {message.sender?.username || groupName}
                    </p>
                  )}

                  {message.text}
                </div>

                {isLastInGroup && (
                  <span className="mt-1 px-1 text-[11px] text-[var(--muted)]">
                    {time}
                  </span>
                )}
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error/status */}
      {statusMessage && (
        <p
          role="alert"
          className="px-4 pb-2 text-xs text-red-600"
        >
          {statusMessage}
        </p>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-[var(--surface-border)] p-3">
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
          placeholder={t("groups.chatPlaceholder")}
          aria-label={t("groups.chatPlaceholder")}
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