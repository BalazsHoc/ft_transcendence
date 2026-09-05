import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getEvents, joinEvent, leaveEvent } from "../api/eventsApi";
import { useNotification } from "../components/shared/NotificationProvider";
import { getMapStyle, MapStyleResponse } from "../api/geoApi";
import { GeoSuggestion, EventItem } from "../types/api";
import { MapEventPanel } from "../components/map/MapEventPanel";
import { MapFilterBar } from "../components/map/MapFilterBar";
import { MapZoomControls } from "../components/map/MapZoomControls";
import { useSports } from "../hooks/useSports";
// Map page layout classes (.mapPage, .mapCanvas, .eventMarker, ...) now
// live in styles/global.css — see the "MAP PAGE" section there.

declare global {
  interface Window {
    L: any;
  }
}

let leafletLoader: Promise<void> | null = null;

const FALLBACK_MAP_STYLE: MapStyleResponse = {
  provider: "carto",
  styles: {
    light: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
};

const INDIVIDUAL_EVENT_COLOR = "#2563eb";
const GROUP_EVENT_COLOR = "#c026d3";
const USER_LOCATION_COLOR = "#16a34a";

function getCurrentMapTheme() {
  return document.body.classList.contains("dark") ? "dark" : "light";
}

function ensureLeaflet() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.L) return Promise.resolve();
  if (leafletLoader) return leafletLoader;

  leafletLoader = new Promise((resolve, reject) => {
    const existingCss = document.querySelector('link[data-leaflet="css"]');
    if (!existingCss) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet", "css");
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector('script[data-leaflet="js"]');
    if (existingScript && window.L) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.setAttribute("data-leaflet", "js");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet failed to load."));
    document.body.appendChild(script);
  });

  return leafletLoader;
}

function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const radius = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function getTimeBounds(time: string) {
  if (!time) return null;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const start = new Date(todayStart);
  const end = new Date(todayStart);

  if (time === "tomorrow") {
    start.setDate(start.getDate() + 1);
    end.setTime(start.getTime());
  } else if (time === "next7Days") {
    end.setDate(end.getDate() + 7);
  } else if (time === "nextMonth") {
    end.setMonth(end.getMonth() + 1, 0);
  }

  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function matchesTimeFilter(dateString: string, time: string) {
  const bounds = getTimeBounds(time);
  if (!bounds) return true;

  const date = new Date(dateString);
  return !Number.isNaN(date.getTime()) && date >= bounds.start && date <= bounds.end;
}

function markerKey(event: EventItem) {
  return `${event.latitude.toFixed(5)}:${event.longitude.toFixed(5)}`;
}

export function MapPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const sports = useSports();
  const [focusPoint, setFocusPoint] = useState<GeoSuggestion | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [sportFilter, setSportFilter] = useState("");
  const [levelFilters, setLevelFilters] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [status, setStatus] = useState("Loading map...");
  const notify = useNotification();
  const [mapStyle, setMapStyle] = useState<MapStyleResponse>(FALLBACK_MAP_STYLE);
  const [mapTheme, setMapTheme] = useState<"light" | "dark">(() =>
    typeof document === "undefined" ? "light" : getCurrentMapTheme(),
  );
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  async function loadEvents() {
    try {
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    getMapStyle()
      .then(setMapStyle)
      .catch(() => setMapStyle(FALLBACK_MAP_STYLE));
  }, []);

  useEffect(() => {
    const updateTheme = () => setMapTheme(getCurrentMapTheme());
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    ensureLeaflet()
      .then(() => {
        if (disposed || !mapContainerRef.current || !window.L) return;
        const map = window.L.map(mapContainerRef.current, {
          zoomControl: false,
        }).setView([48.2082, 16.3738], 12);

        mapRef.current = map;
        layerRef.current = window.L.layerGroup().addTo(map);
        setMapReady(true);
      })
      .catch((error) => setStatus(error.message));

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        layerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapContainerRef.current) return;

    const map = mapRef.current;
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapContainerRef.current);

    return () => resizeObserver.disconnect();
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.L) return;

    const selectedStyle = mapStyle.styles[mapTheme];
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = window.L
      .tileLayer(selectedStyle.url, {
        attribution: selectedStyle.attribution,
        maxZoom: 19,
        detectRetina: true,
      })
      .addTo(mapRef.current);
  }, [mapReady, mapStyle, mapTheme]);

  const visibleEvents = useMemo(() => {
    let list = events;

    if (sportFilter) list = list.filter((event) => event.sport === sportFilter);
    if (levelFilters.length > 0) {
      list = list.filter((event) => levelFilters.includes(event.level));
    }
    if (timeFilter) {
      list = list.filter((event) => matchesTimeFilter(event.start_at, timeFilter));
    }

    if (focusPoint) {
      list = list
        .map((event) => ({ event, distance: distanceKm(focusPoint, event) }))
        .filter((item) => item.distance <= 20)
        .sort((a, b) => a.distance - b.distance)
        .map((item) => item.event);
    }

    return list;
  }, [events, sportFilter, levelFilters, timeFilter, focusPoint]);

  const eventGroups = useMemo(() => {
    const groups = new Map<string, EventItem[]>();

    visibleEvents.forEach((event) => {
      const key = markerKey(event);
      const group = groups.get(key) || [];
      group.push(event);
      groups.set(key, group);
    });

    return Array.from(groups.values());
  }, [visibleEvents]);

  useEffect(() => {
    if (visibleEvents.length === 0) {
      setSelectedEventId(null);
      return;
    }
    if (!selectedEventId || !visibleEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(visibleEvents[0].id);
    }
  }, [visibleEvents, selectedEventId]);

  const selectedGroup = useMemo(() => {
    if (selectedEventId) {
      const matchingGroup = eventGroups.find((group) =>
        group.some((event) => event.id === selectedEventId),
      );
      if (matchingGroup) return matchingGroup;
    }

    return eventGroups[0] || [];
  }, [eventGroups, selectedEventId]);

  const selectedGroupIndex = Math.max(
    selectedGroup.findIndex((event) => event.id === selectedEventId),
    0,
  );
  const selectedEvent = selectedGroup[selectedGroupIndex] || null;

  useEffect(() => {
    if (!mapRef.current || !layerRef.current || !window.L) return;

    const map = mapRef.current;
    const layer = layerRef.current;
    layer.clearLayers();

    const eventBounds: [number, number][] = eventGroups.map((group) => [
      group[0].latitude,
      group[0].longitude,
    ]);

    if (focusPoint) {
      map.setView([focusPoint.latitude, focusPoint.longitude], 13);
    } else if (eventBounds.length === 1) {
      map.setView(eventBounds[0], 13);
    } else if (eventBounds.length > 1) {
      map.fitBounds(eventBounds as any, { padding: [60, 60] });
    }

    eventGroups.forEach((group: EventItem[]) => {
      const event = group.find((item) => item.id === selectedEventId) || group[0];
      const isSelected = group.some((item) => item.id === selectedEventId);
      const color = event.group ? GROUP_EVENT_COLOR : INDIVIDUAL_EVENT_COLOR;
      const icon = window.L.divIcon({
        className: isSelected ? "eventMarkerSelected" : "eventMarker",
        html: `<span style="background:${color}"></span>${
          group.length > 1
            ? `<strong class="eventMarkerCount">${group.length}</strong>`
            : ""
        }`,
        iconSize: isSelected ? [34, 34] : [26, 26],
        iconAnchor: isSelected ? [17, 34] : [13, 26],
        popupAnchor: [0, -26],
      });

      const marker = window.L.marker([event.latitude, event.longitude], { icon }).addTo(layer);
      marker.on("click", () => {
        setSelectedEventId(group[0].id);
        map.setView([event.latitude, event.longitude], Math.max(map.getZoom(), 14));
      });
    });

    if (focusPoint) {
      const focusMarker = window.L
        .circleMarker([focusPoint.latitude, focusPoint.longitude], {
          radius: 10,
          color: mapTheme === "dark" ? "#f8fafc" : "#0f172a",
          fillColor: mapTheme === "dark" ? "#14b8a6" : "#f59e0b",
          fillOpacity: 0.9,
          weight: 3,
        })
        .addTo(layer);
      focusMarker.bindPopup(`<strong>${focusPoint.label}</strong>`);
    }

    if (userLocation) {
      window.L
        .circleMarker([userLocation.latitude, userLocation.longitude], {
          radius: 8,
          color: "#ffffff",
          fillColor: USER_LOCATION_COLOR,
          fillOpacity: 1,
          weight: 3,
        })
        .addTo(layer);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventGroups, selectedEventId, focusPoint, userLocation, mapTheme]);

  async function handleJoin(id: string) {
    setActionBusy(true);
    try {
      await joinEvent(id);
      try { notify(t("joined"), "success"); } catch {}
      await loadEvents();
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setActionBusy(false);
    }
  }

  async function handleLeave(id: string) {
    setActionBusy(true);
    try {
      await leaveEvent(id);
      try { notify(t("left"), "success"); } catch {}
      await loadEvents();
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setActionBusy(false);
    }
  }

  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  function handleLocate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        mapRef.current?.setView([location.latitude, location.longitude], 14);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function toggleLevelFilter(value: string) {
    setLevelFilters((current) =>
      current.includes(value)
        ? current.filter((level) => level !== value)
        : [...current, value],
    );
  }

  function moveWithinSelectedGroup(direction: -1 | 1) {
    if (selectedGroup.length < 2) return;

    const nextIndex = selectedGroupIndex + direction;
    if (nextIndex < 0 || nextIndex >= selectedGroup.length) return;
    setSelectedEventId(selectedGroup[nextIndex].id);
  }

  return (
    <div className="mapPage map-page-full">
      <div ref={mapContainerRef} className="mapCanvas" />

      <div className="panelOverlay">
        <MapEventPanel
          event={selectedEvent}
          events={selectedGroup}
          selectedIndex={selectedGroupIndex}
          onPrevious={() => moveWithinSelectedGroup(-1)}
          onNext={() => moveWithinSelectedGroup(1)}
          busy={actionBusy}
          onJoin={handleJoin}
          onLeave={handleLeave}
        />
      </div>

      <div className="topBarOverlay">
        <MapFilterBar
          sport={sportFilter}
          onSportChange={setSportFilter}
          levels={levelFilters}
          onLevelChange={toggleLevelFilter}
          time={timeFilter}
          onTimeChange={setTimeFilter}
          onLocationSelect={setFocusPoint}
          sports={sports}
        />
      </div>

      <div className="zoomOverlay">
        <MapZoomControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocate={handleLocate}
          locating={locating}
        />
        <div className="mapLegend" aria-label={t("map.markerLegend")}>
          <span className="mapLegendItem">
            <span
              className="mapLegendDot"
              style={{ backgroundColor: INDIVIDUAL_EVENT_COLOR }}
              aria-hidden="true"
            />
            {t("map.individualEvent")}
          </span>
          <span className="mapLegendItem">
            <span
              className="mapLegendDot"
              style={{ backgroundColor: GROUP_EVENT_COLOR }}
              aria-hidden="true"
            />
            {t("map.groupEvent")}
          </span>
        </div>
      </div>

      {status && <p className="mapStatus">{status}</p>}
    </div>
  );
}
