import { useEffect, useRef, useState } from "react";
import { getAccessToken } from "../../api/client";
import { getEventMessages } from "../../api/eventsApi";
import { MessageItem } from "../../types/api";
import { useTranslation } from "react-i18next";
import styles from "./EventChat.module.css";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";

export function EventChat({ eventId }: { eventId: string }) {
  const { t } = useTranslation();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState("");

  const wsRef = useRef<WebSocket | null>(null);

  async function loadMessages() {
    try {
      setMessages(await getEventMessages(eventId));
    } catch (e: any) {
      setLog(e.message);
    }
  }

  function connect() {
    const token = getAccessToken();

    const ws = new WebSocket(`${WS_URL}/ws/events/${eventId}/?token=${token}`);

    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setLog("WebSocket connected.");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "message") {
        setMessages((prev) => [...prev, data as MessageItem]);
      } else {
        setLog(JSON.stringify(data, null, 2));
      }
    };

    ws.onclose = (event) => {
      setConnected(false);
      setLog(`WebSocket closed: ${event.code}`);
    };

    ws.onerror = () => setLog("WebSocket error.");
  }

  function sendMessage() {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setLog("WebSocket is not connected.");
      return;
    }

    wsRef.current.send(JSON.stringify({ text }));
    setText("");
  }

  useEffect(() => {
    loadMessages();

    return () => wsRef.current?.close();
  }, [eventId]);

  return (
    <section className={styles.chatPanel}>
      <div className={connected ? "ok" : "bad"}>
        WS: {connected ? "connected" : "not connected"}
      </div>

      <div className="row">
        <button onClick={loadMessages}>{t("common.refresh")}</button>

        <button onClick={connect}>{t("chats.connect")}</button>
      </div>

      <div className={styles.messages}>
        {messages.map((m) => (
          <div className={styles.message} key={m.id}>
            <b>{m.sender?.username || "user"}:</b> {m.text}
          </div>
        ))}
      </div>

      <div className={styles.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("chats.placeholder")}
        />

        <button onClick={sendMessage}>{t("common.send")}</button>
      </div>

      {log && <pre>{log}</pre>}
    </section>
  );
}
