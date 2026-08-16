import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { getGroupMessages, sendGroupMessage } from "../../api/groupMessagesApi";
import { getAccessToken } from "../../api/client";
import type { GroupMessageItem } from "../../types/api";
import styles from "./EventChat.module.css";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";

export function GroupChat({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<GroupMessageItem[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    getGroupMessages(groupId)
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLog(error instanceof Error ? error.message : t("groups.chatLoadError"));
        }
      });

    const token = getAccessToken();
    if (!token) {
      setLog(t("groups.chatAuthRequired"));
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
        setLog(t("groups.chatConnected"));
      }
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        type?: string;
        detail?: string;
      } & Partial<GroupMessageItem>;
      if (data.type === "message" && data.id && data.sender && data.text) {
        setMessages((previous) => {
          if (previous.some((message) => message.id === data.id)) return previous;
          return [...previous, data as GroupMessageItem];
        });
      } else if (data.detail) {
        setLog(data.detail);
      }
    };
    ws.onclose = () => {
      if (!cancelled) {
        setConnected(false);
        setLog(t("groups.chatDisconnected"));
      }
    };
    ws.onerror = () => {
      if (!cancelled) setLog(t("groups.chatWsError"));
    };

    return () => {
      cancelled = true;
      ws.close();
      wsRef.current = null;
    };
  }, [groupId, t]);

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
      setLog(error instanceof Error ? error.message : t("groups.chatSendError"));
    }
  }

  return (
    <section id="group-chat" className={styles.chatPanel} aria-label={t("groups.chatTitle")}>
      <h2>{groupName}</h2>
      <div className={connected ? "ok" : "bad"}>
        {connected ? t("groups.chatConnected") : t("groups.chatDisconnected")}
      </div>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <p>{t("groups.chatEmpty")}</p>
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
          placeholder={t("groups.chatPlaceholder")}
        />
        <button type="button" onClick={() => void sendMessage()}>
          {t("common.send")}
        </button>
      </div>

      {/* {log && <pre>{log}</pre>} */}
    </section>
  );
}
