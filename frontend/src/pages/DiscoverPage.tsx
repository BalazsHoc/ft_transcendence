import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { EventCard } from "../components/events/EventCard";
import { ApiLog } from "../components/shared/ApiLog";
import { EventItem } from "../types/api";
import { deleteEvent, getEvents, joinEvent, leaveEvent } from "../api/eventsApi";
import Button  from "../components/shared/Button";
import { Sidebar } from "../components/layout/Sidebar";

export function DiscoverPage() {
  const { t, i18n } = useTranslation();
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
      <div className="discover-main">
        <div className="card">
          <h1 style={{ marginTop: "24px" }}>
            Same Button component, two different variants:
          </h1>
          <p>check change language feature in these two buttons</p>
          <p>1-color</p>
          <p>2-translate page feature</p>
          <p>3-dark/light mode — click the moon icon in the header</p>


          <div className="row" style={{ marginTop: "20px" }}>
            <Button variant="primary" onClick={load}>
              {t("discover.load")}
            </Button>
            <Button variant="outline" onClick={load}>
              load events
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
