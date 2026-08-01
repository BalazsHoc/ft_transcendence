import { useEffect, useMemo, useRef, useState } from "react";
import { getEvents, joinEvent, leaveEvent } from "../api/eventsApi";
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

const SPORT_COLORS: Record<string, string> = {
  swimming: "#0ea5a5",
  tennis: "#6366f1",
  running: "#f59e0b",
  cycling: "#10b981",
  yoga: "#8b5cf6",
};
const DEFAULT_SPORT_COLOR = "#475569";

function sportColor(sport: string) {
  return SPORT_COLORS[(sport || "").toLowerCase()] || DEFAULT_SPORT_COLOR;
}

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

function isToday(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function MapPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const sports = useSports();
  const [focusPoint, setFocusPoint] = useState<GeoSuggestion | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [sportFilter, setSportFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [status, setStatus] = useState("Loading map...");
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
    if (levelFilter) list = list.filter((event) => event.level === levelFilter);
    if (todayOnly) list = list.filter((event) => isToday(event.start_at));

    if (focusPoint) {
      list = list
        .map((event) => ({ event, distance: distanceKm(focusPoint, event) }))
        .filter((item) => item.distance <= 20)
        .sort((a, b) => a.distance - b.distance)
        .map((item) => item.event);
    }

    return list;
  }, [events, sportFilter, levelFilter, todayOnly, focusPoint]);

  useEffect(() => {
    if (visibleEvents.length === 0) {
      setSelectedEventId(null);
      return;
    }
    if (!selectedEventId || !visibleEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(visibleEvents[0].id);
    }
  }, [visibleEvents, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId],
  );

  useEffect(() => {
    if (!mapRef.current || !layerRef.current || !window.L) return;

    const map = mapRef.current;
    const layer = layerRef.current;
    layer.clearLayers();

    const bounds: [number, number][] = [];

    visibleEvents.forEach((event: EventItem) => {
      const isSelected = event.id === selectedEventId;
      const color = sportColor(event.sport);
      const icon = window.L.divIcon({
        className: isSelected ? "eventMarkerSelected" : "eventMarker",
        html: `<span style="background:${color}"></span>`,
        iconSize: isSelected ? [34, 34] : [26, 26],
        iconAnchor: isSelected ? [17, 34] : [13, 26],
        popupAnchor: [0, -26],
      });

      const marker = window.L.marker([event.latitude, event.longitude], { icon }).addTo(layer);
      marker.on("click", () => {
        setSelectedEventId(event.id);
        map.setView([event.latitude, event.longitude], Math.max(map.getZoom(), 14));
      });
      bounds.push([event.latitude, event.longitude]);
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
      map.setView([focusPoint.latitude, focusPoint.longitude], 13);
      bounds.push([focusPoint.latitude, focusPoint.longitude]);
    }

    if (userLocation) {
      window.L
        .circleMarker([userLocation.latitude, userLocation.longitude], {
          radius: 8,
          color: "#ffffff",
          fillColor: "#2563eb",
          fillOpacity: 1,
          weight: 3,
        })
        .addTo(layer);
    }

    if (!focusPoint && bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else if (!focusPoint && bounds.length > 1) {
      map.fitBounds(bounds as any, { padding: [60, 60] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleEvents, selectedEventId, focusPoint, userLocation, mapTheme]);

  async function handleJoin(id: string) {
    setActionBusy(true);
    try {
      await joinEvent(id);
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

  return (
    <div className="mapPage map-page-full">
      <div ref={mapContainerRef} className="mapCanvas" />

      <div className="panelOverlay">
        <MapEventPanel
          event={selectedEvent}
          busy={actionBusy}
          onJoin={handleJoin}
          onLeave={handleLeave}
        />
      </div>

      <div className="topBarOverlay">
        <MapFilterBar
          sport={sportFilter}
          onSportChange={setSportFilter}
          level={levelFilter}
          onLevelChange={setLevelFilter}
          todayOnly={todayOnly}
          onToggleToday={() => setTodayOnly((value) => !value)}
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
      </div>

      {status && <p className="mapStatus">{status}</p>}
    </div>
  );
}
