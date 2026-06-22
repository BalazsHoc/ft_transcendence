import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EventCard } from "../components/events/EventCard";
import { ApiLog } from "../components/shared/ApiLog";
import { EventItem } from "../types/api";
import { deleteEvent, getEvents, joinEvent, leaveEvent } from "../api/eventsApi";
import styles from "./DiscoverPage.module.css";

export function DiscoverPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sport, setSport] = useState("");
  const [level, setLevel] = useState("");
  const [log, setLog] = useState("");

  async function load() {
    try {
      const data = await getEvents({ sport, level });
      setEvents(Array.isArray(data) ? data : []);
      setLog(`Loaded ${data.length} events.`);
    } catch (e: any) {
      setLog(e.message);
    }
  }

  async function doJoin(id: string) {
    try {
      setLog(JSON.stringify(await joinEvent(id), null, 2));
      await load();
    } catch (e: any) {
      setLog(e.message);
    }
  }

  async function doLeave(id: string) {
    try {
      setLog(JSON.stringify(await leaveEvent(id), null, 2));
      await load();
    } catch (e: any) {
      setLog(e.message);
    }
  }

  async function doDelete(id: string) {
    try {
      await deleteEvent(id);
      setLog("Event deleted.");
      await load();
    } catch (e: any) {
      setLog(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1>{t("discover.title")}</h1>
      <section className={styles.filters}>
        <input
          placeholder={t("discover.sport")}
          value={sport}
          onChange={(e) => setSport(e.target.value)}
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">all levels</option>
          <option value="all">all</option>
          <option value="beginner">beginner</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
        <button onClick={load}>{t("discover.load")}</button>
      </section>
      <div className="event-list">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onJoin={doJoin}
            onLeave={doLeave}
            onDelete={doDelete}
          />
        ))}
      </div>
      <ApiLog log={log} />
    </>
  );
}
