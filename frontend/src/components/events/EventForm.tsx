import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EventItem } from "../../types/api";
import { EventPayload } from "../../api/eventsApi";

function toLocalInputValue(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
}

export function EventForm({
  initialEvent,
  onSubmit,
}: {
  initialEvent?: EventItem;
  onSubmit: (payload: EventPayload) => Promise<void>;
}) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(
    initialEvent?.title || "Football in Prater"
  );

  const [description, setDescription] = useState(
    initialEvent?.description || "Casual test event."
  );

  const [sport, setSport] = useState(initialEvent?.sport || "football");

  const [level, setLevel] = useState(initialEvent?.level || "all");

  const [locationName, setLocationName] = useState(
    initialEvent?.location_name || "Prater"
  );

  const [locationAddress, setLocationAddress] = useState(
    initialEvent?.location_address || "Prater, Vienna"
  );

  const [latitude, setLatitude] = useState(
    String(initialEvent?.latitude ?? 48.2167)
  );

  const [longitude, setLongitude] = useState(
    String(initialEvent?.longitude ?? 16.395)
  );

  const [startAt, setStartAt] = useState(
    toLocalInputValue(initialEvent?.start_at) || "2026-06-20T18:00"
  );

  const [endAt, setEndAt] = useState(
    toLocalInputValue(initialEvent?.end_at) || "2026-06-20T20:00"
  );

  const [maxSlots, setMaxSlots] = useState(
    String(initialEvent?.max_slots || 10)
  );

  const [languages, setLanguages] = useState(
    (initialEvent?.languages || ["en", "de"]).join(",")
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      title,
      description,
      sport,
      level,
      languages: languages
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      location_name: locationName,
      location_address: locationAddress,
      latitude: Number(latitude),
      longitude: Number(longitude),
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      max_slots: Number(maxSlots),
    });
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <label>
        {t("event.title")}
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label>
        {t("event.description")}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label>
        {t("event.sport")}
        <input value={sport} onChange={(e) => setSport(e.target.value)} />
      </label>

      <label>
        {t("event.level")}
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="all">all</option>
          <option value="beginner">beginner</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
      </label>

      <label>
        {t("event.location")}
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />
      </label>

      <label>
        Address
        <input
          value={locationAddress}
          onChange={(e) => setLocationAddress(e.target.value)}
        />
      </label>

      <div className="form-grid">
        <label>
          Latitude
          <input
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
        </label>

        <label>
          Longitude
          <input
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </label>
      </div>

      <div className="form-grid">
        <label>
          {t("event.start")}
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </label>

        <label>
          {t("event.end")}
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </label>
      </div>

      <label>
        {t("event.maxSlots")}
        <input
          type="number"
          value={maxSlots}
          onChange={(e) => setMaxSlots(e.target.value)}
        />
      </label>

      <label>
        Languages comma-separated
        <input
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
        />
      </label>

      <button type="submit">
        {initialEvent ? t("editEvent.submit") : t("createEvent.submit")}
      </button>
    </form>
  );
}
