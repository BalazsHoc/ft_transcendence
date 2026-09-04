import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DiscoverMain } from "../components/discover/DiscoverMain";
import {
  deleteEvent,
  getEventsPage,
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
  const [sort, setSort] = useState("");
  const [search, setSearch] = useState("");
  // The input updates on every keystroke so typing stays instant, but the
  // request waits until you pause — otherwise every letter refetches the list.
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const [log, setLog] = useState("");

  function toggleLevel(value: string) {
    setPage(1);
    setLevels((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchQuery(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const timeBounds = useMemo(() => {
    if (!time) return {};

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);
    const next7DaysEnd = new Date(todayStart);
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
    next7DaysEnd.setHours(23, 59, 59, 999);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    nextMonthEnd.setHours(23, 59, 59, 999);

    if (time === "today") {
      return {
        startAfter: todayStart.toISOString(),
        startBefore: todayEnd.toISOString(),
      };
    }
    if (time === "tomorrow") {
      return {
        startAfter: tomorrowStart.toISOString(),
        startBefore: tomorrowEnd.toISOString(),
      };
    }
    if (time === "next7Days") {
      return {
        startAfter: todayStart.toISOString(),
        startBefore: next7DaysEnd.toISOString(),
      };
    }
    if (time === "nextMonth") {
      return {
        startAfter: todayStart.toISOString(),
        startBefore: nextMonthEnd.toISOString(),
      };
    }
    return {};
  }, [time]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEventsPage({
        sport,
        level: levels.join(","),
        search: searchQuery,
        sort,
        page,
        pageSize: 12,
        ...timeBounds,
      });

      setEvents(data.results);
      const nextPageCount = Math.max(1, Math.ceil(data.count / 12));
      setPageCount(nextPageCount);
      if (page > nextPageCount) setPage(nextPageCount);
      setLog(`Loaded ${data.results.length} events.`);
    } catch (e: any) {
      setLog(e.message);
    } finally {
      setLoading(false);
    }
  }, [levels, page, searchQuery, sort, sport, timeBounds]);

  function changeSearch(value: string) {
    setPage(1);
    setSearch(value);
  }

  function changeSport(value: string) {
    setPage(1);
    setSport(value);
  }

  function changeTime(value: string) {
    setPage(1);
    setTime(value);
  }

  function changeSort(value: string) {
    setPage(1);
    setSort(value);
  }

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
      <DiscoverMain
        events={events}
        onCardClick={openEventPage}
        search={search}
        onSearch={changeSearch}
        sport={sport}
        onSportChange={changeSport}
        levels={levels}
        onLevelChange={toggleLevel}
        time={time}
        onTimeChange={changeTime}
        sort={sort}
        onSortChange={changeSort}
        sports={sports}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
