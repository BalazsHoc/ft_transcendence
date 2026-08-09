import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "../components/layout/Sidebar";
import { DiscoverMain } from "../components/discover/DiscoverMain";
import {
  deleteEvent,
  getEvents,
  joinEvent,
  leaveEvent,
} from "../api/eventsApi";
import { EventItem } from "../types/api";
import { useSports } from "../hooks/useSports";

export function DiscoverPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const sports = useSports();

  const [sport, setSport] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [time, setTime] = useState("");

  const [log, setLog] = useState("");

  const levelParam = levels.join(",");

  function toggleLevel(value: string) {
    setLevels((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  const load = useCallback(async () => {
    try {
      const data = await getEvents({
        sport,
        level: levelParam,
      });

      const nextEvents = Array.isArray(data) ? data : [];
      setEvents(nextEvents);
      setLog(`Loaded ${nextEvents.length} events.`);
    } catch (e: any) {
      setLog(e.message);
    }
  }, [levelParam, sport]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (!time) return true;

        const start = new Date(event.start_at);
        if (Number.isNaN(start.getTime())) return false;

        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const next7DaysEnd = new Date(todayStart);
        next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
        next7DaysEnd.setHours(23, 59, 59, 999);

        const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        nextMonthEnd.setHours(23, 59, 59, 999);

        if (time === "today") {
          const todayEnd = new Date(todayStart);
          todayEnd.setHours(23, 59, 59, 999);
          return start >= todayStart && start <= todayEnd;
        }

        if (time === "tomorrow") {
          const tomorrowEnd = new Date(tomorrowStart);
          tomorrowEnd.setHours(23, 59, 59, 999);
          return start >= tomorrowStart && start <= tomorrowEnd;
        }

        if (time === "next7Days") {
          return start >= todayStart && start <= next7DaysEnd;
        }

        if (time === "nextMonth") {
          return start >= todayStart && start <= nextMonthEnd;
        }

        return true;
      }),
    [events, time],
  );

  async function doJoin(id: string) {
    try {
      await joinEvent(id);
      await load();
    } catch (e: any) {
      setLog(e.message);
    }
  }

  async function doLeave(id: string) {
    try {
      await leaveEvent(id);
      await load();
    } catch (e: any) {
      setLog(e.message);
    }
  }

  async function doDelete(id: string) {
    try {
      await deleteEvent(id);
      await load();
    } catch (e: any) {
      setLog(e.message);
    }
  }

  function openEventPage(id: string) {
    navigate(`/events/${id}`);
  }

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="discover-layout">
      <Sidebar
        sport={sport}
        onSportChange={setSport}
        level={levels}
        onLevelChange={toggleLevel}
        time={time}
        onTimeChange={setTime}
        sports={sports}
      />
      <DiscoverMain events={filteredEvents} onCardClick={openEventPage} />
    </div>
  );
}
