import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getEvents } from "../api/eventsApi";
import { getMapStyle, MapStyleResponse } from "../api/geoApi";
import { GeoSuggestion, EventItem } from "../types/api";
import { LocationAutocomplete } from "../components/geo/LocationAutocomplete";
import eventStyles from "../components/events/EventCard.module.css";
import styles from "./MapPage.module.css";

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

export function MapPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [focusPoint, setFocusPoint] = useState<GeoSuggestion | null>(null);
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

  useEffect(() => {
    getEvents()
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setStatus("");
      })
      .catch((error: any) => setStatus(error.message));
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
          zoomControl: true,
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
    if (!focusPoint) return events;
    return events
      .map((event: EventItem) => ({
        event,
        distance: distanceKm(focusPoint, event),
      }))
      .filter((item: { event: EventItem; distance: number }) => item.distance <= 20)
      .sort(
        (
          a: { event: EventItem; distance: number },
          b: { event: EventItem; distance: number },
        ) => a.distance - b.distance,
      )
      .map((item: { event: EventItem; distance: number }) => item.event);
  }, [events, focusPoint]);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current || !window.L) return;

    const map = mapRef.current;
    const layer = layerRef.current;
    layer.clearLayers();

    const bounds: [number, number][] = [];
    const eventIcon = window.L.divIcon({
      className: styles.eventMarker,
      html: '<span></span>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -26],
    });

    visibleEvents.forEach((event: EventItem) => {
      const marker = window.L
        .marker([event.latitude, event.longitude], { icon: eventIcon })
        .addTo(layer);
      marker.bindPopup(
        `<strong>${event.title}</strong><br/>${event.location_name}<br/>${new Date(event.start_at).toLocaleString()}`,
      );
      marker.on("click", () => map.setView([event.latitude, event.longitude], 14));
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

    if (!focusPoint && bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else if (!focusPoint && bounds.length > 1) {
      map.fitBounds(bounds as any, { padding: [40, 40] });
    }
  }, [focusPoint, visibleEvents, mapTheme]);

  return (
    <div className={'${styles.mapPage}'}>
      <section className={`card ${styles.mapControls}`}>
        <h1>{t("map.title")}</h1>
        <p>{t("map.subtitle")}</p>
        <LocationAutocomplete
          label={t("map.search")}
          placeholder={t("map.searchPlaceholder")}
          onSelect={(suggestion) => setFocusPoint(suggestion)}
        />
        <div className="row">
          <button type="button" onClick={() => setFocusPoint(null)}>
            {t("map.reset")}
          </button>
        </div>
        {focusPoint && (
          <p className={styles.mapFocus}>
            {t("map.focusedOn")} {focusPoint.label}
          </p>
        )}
      </section>

      <div className={`two-column ${styles.mapLayout}`}>
        <section className={`card ${styles.mapCanvasCard}`}>
          <div ref={mapContainerRef} className={styles.mapCanvas} />
          {status && <p className={styles.mapStatus}>{status}</p>}
        </section>

        <aside className={styles.sidebarList}>
          <h2>{t("map.eventsNear", { count: visibleEvents.length })}</h2>
          {visibleEvents.length === 0 ? (
            <p>{t("map.noEvents")}</p>
          ) : (
            visibleEvents.map((event: EventItem) => (
              <article key={event.id} className={`${eventStyles.eventCard} ${eventStyles.compact} p-4 rounded-lg border border-[var(--card-border)]`}>
                <h3>
                  <Link to={`/events/${event.id}`}>{event.title}</Link>
                </h3>
                <p className={eventStyles.eventLocation}>{event.location_name}</p>
                {event.location_address && event.location_address !== event.location_name && (
                  <p className={eventStyles.eventAddress}>{event.location_address}</p>
                )}
                <p>{new Date(event.start_at).toLocaleString()}</p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    mapRef.current?.setView([event.latitude, event.longitude], 14)
                  }
                >
                  {t("map.focusEvent")}
                </button>
              </article>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
