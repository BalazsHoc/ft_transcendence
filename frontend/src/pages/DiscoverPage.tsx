import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { EventCard } from "../components/events/EventCard";
import { ApiLog } from "../components/shared/ApiLog";
import { EventItem } from "../types/api";
import { deleteEvent, getEvents, joinEvent, leaveEvent } from "../api/eventsApi";
import { Sidebar } from "../components/layout/Sidebar";
import { DiscoverMain } from "../components/discover/DiscoverMain";

export function DiscoverPage() {
  const { i18n } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sport, setSport] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [log, setLog] = useState("");

  function toggleLevel(value: string) {
    setLevels((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function load() {
    try {
      const data = await getEvents({ sport, level: levels.join(",") });
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
    <div className="discover-layout">
      <Sidebar
        sport={sport}
        onSportChange={setSport}
        level={levels}
        onLevelChange={toggleLevel}
        time={time}
        onTimeChange={setTime}
      />
      <DiscoverMain />
    </div>
  );
}
