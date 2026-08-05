import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";

import {
  getDirectMessages,
  sendDirectMessage,
} from "../../api/messagesApi";
import { getAccessToken } from "../../api/client";
import type {
  DirectConversationItem,
  DirectMessageItem,
} from "../../types/api";
import styles from "./EventChat.module.css";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";

export function DirectChat({ conversation }: { conversation: DirectConversationItem }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDirectMessages(conversation.id)
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLog(error instanceof Error ? error.message : t("chats.loadError"));
        }
      });

    const token = getAccessToken();
    if (!token) {
      setLog(t("chats.authRequired"));
      return () => {
        cancelled = true;
      };
    }

    const ws = new WebSocket(
      `${WS_URL}/ws/direct/${conversation.id}/?token=${encodeURIComponent(token)}`,
    );
    wsRef.current = ws;

    ws.onopen = () => {
      if (!cancelled) {
        setConnected(true);
        setLog(t("chats.connected"));
      }
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        type?: string;
        detail?: string;
      } & Partial<DirectMessageItem>;
      if (data.type === "message" && data.id && data.sender && data.text) {
        setMessages((previous) => {
          if (previous.some((message) => message.id === data.id)) return previous;
          return [...previous, data as DirectMessageItem];
        });
      } else if (data.detail) {
        setLog(data.detail);
      }
    };
    ws.onclose = () => {
      if (!cancelled) {
        setConnected(false);
        setLog(t("chats.disconnected"));
      }
    };
    ws.onerror = () => {
      if (!cancelled) setLog(t("chats.wsError"));
    };

    return () => {
      cancelled = true;
      ws.close();
      wsRef.current = null;
    };
  }, [conversation.id, t]);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: trimmed }));
      setText("");
      return;
    }

    try {
      const message = await sendDirectMessage(conversation.id, trimmed);
      setMessages((previous) => [...previous, message]);
      setText("");
    } catch (error: unknown) {
      setLog(error instanceof Error ? error.message : t("chats.sendError"));
    }
  }

  return (
    <section className={styles.chatPanel} aria-label={t("chats.personal")}>
      <h2>{conversation.peer.username}</h2>
      <div className={connected ? "ok" : "bad"}>
        {connected ? t("chats.connected") : t("chats.disconnected")}
      </div>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <p>{t("chats.noMessages")}</p>
        ) : (
          messages.map((message) => (
            <div className={styles.message} key={message.id}>
              <b>{message.sender.username}:</b> {message.text}
            </div>
          ))
        )}
      </div>

      <div className={styles.inputRow}>
        <input
          value={text}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") void sendMessage();
          }}
          placeholder={t("chats.placeholder")}
        />
        <button type="button" onClick={() => void sendMessage()}>
          {t("common.send")}
        </button>
      </div>

      {log && <pre>{log}</pre>}
    </section>
  );
}
