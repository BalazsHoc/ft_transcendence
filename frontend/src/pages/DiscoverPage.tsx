import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "../components/layout/Sidebar";
import { getEvents, joinEvent, leaveEvent, deleteEvent } from "../api/eventsApi";
import { EventItem } from "../types/api";
import { HappeningNowSection } from "../components/discover/HappeningNowSection";
import Button from "../components/shared/Button";

export function DiscoverPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);

  const [sport, setSport] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [time, setTime] = useState("");

  const [log, setLog] = useState("");

  const levelParam = levels.join(",");

  function toggleLevel(value: string) {
    setLevels((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
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
  }, [levelParam, sport, time]);

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
      />

      <main className="discover-main">
        <HappeningNowSection
          events={events}
          onCardClick={openEventPage}
        />

        <div className="card">
          <h1>
            Discover
          </h1>

          <div className="row">
            <Button
              variant="primary"
              onClick={load}
            >
              {t("discover.load")}
            </Button>
          </div>

          <p>
            {log}
          </p>
        </div>
      </main>
    </div>
  );
}