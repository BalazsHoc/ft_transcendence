import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { EventCard } from "../components/events/EventCard";
import { ApiLog } from "../components/shared/ApiLog";
import { EventItem } from "../types/api";
import { deleteEvent, getEvents, joinEvent, leaveEvent } from "../api/eventsApi";
import Button  from "../components/shared/Button";
import { Sidebar } from "../components/layout/Sidebar";

export function DiscoverPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sport, setSport] = useState("");
  const [level, setLevel] = useState("");
  const [time, setTime] = useState("");
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
    <div className="discover-layout">
      <Sidebar
        sport={sport}
        onSportChange={setSport}
        level={level}
        onLevelChange={setLevel}
        time={time}
        onTimeChange={setTime}
      />
      <div className="discover-main">
        <div className="card">
          <p>Same Button component, two different variants:</p>
          <div className="row">
            <Button variant="primary" onClick={load}>
              {t("discover.load")}
            </Button>
            <Button variant="outline" onClick={load}>
              {t("discover.load")}
            </Button>
          </div>

          <p style={{ marginTop: "24px" }}>
            Same Button component, rendered once per item in a list:
          </p>
          <div className="row">
            {["Tennis", "Running", "Cycling"].map((sport) => (
              <Button key={sport} variant="secondary">
                {sport}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
