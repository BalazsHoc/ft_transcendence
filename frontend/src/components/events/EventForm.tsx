import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EventItem } from "../../types/api";
import { EventPayload } from "../../api/eventsApi";
import { rememberSearch } from "../../api/geoApi";
import { LocationAutocomplete } from "../geo/LocationAutocomplete";
import styles from "../shared/FormCard.module.css";
import { DEFAULT_EVENT_IMAGE_SRC } from "../../utils/media";

function toLocalInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function shortStreetName(value?: string) {
  if (!value) return "";
  return value.split(",")[0]?.trim() || value.trim();
}

export function EventForm({
  initialEvent,
  onSubmit,
}: {
  initialEvent?: EventItem;
  onSubmit: (payload: EventPayload, imageFile?: File | null) => Promise<void>;
}) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(initialEvent?.title || "Football in Prater");
  const [description, setDescription] = useState(
    initialEvent?.description || "Casual test event.",
  );
  const [sport, setSport] = useState(initialEvent?.sport || "football");
  const [level, setLevel] = useState(initialEvent?.level || "all");
  const [locationName, setLocationName] = useState(
    initialEvent?.location_name || "Prater",
  );
  const [locationAddress, setLocationAddress] = useState(
    initialEvent?.location_address || "Prater, Vienna",
  );
  const [latitude, setLatitude] = useState(String(initialEvent?.latitude ?? 48.2167));
  const [longitude, setLongitude] = useState(String(initialEvent?.longitude ?? 16.395));
  const [startAt, setStartAt] = useState(
    toLocalInputValue(initialEvent?.start_at) || "2026-06-20T18:00",
  );
  const [endAt, setEndAt] = useState(
    toLocalInputValue(initialEvent?.end_at) || "2026-06-20T20:00",
  );
  const [maxSlots, setMaxSlots] = useState(String(initialEvent?.max_slots || 10));
  const [languages, setLanguages] = useState(
    (initialEvent?.languages || ["en", "de"]).join(","),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(
    initialEvent?.image || DEFAULT_EVENT_IMAGE_SRC,
  );

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(initialEvent?.image || DEFAULT_EVENT_IMAGE_SRC);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile, initialEvent?.image]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      title,
      description,
      sport,
      level,
      languages: languages
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      location_name: locationName,
      location_address: locationAddress,
      latitude: Number(latitude),
      longitude: Number(longitude),
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      max_slots: Number(maxSlots),
      imageFile,
    };

    await onSubmit(payload, imageFile);

    if (locationName.trim() && locationAddress.trim()) {
      await rememberSearch({
        query: locationName,
        suggestion: {
          id: `${locationName}-${locationAddress}`,
          label: locationName,
          address: locationAddress,
          latitude: Number(latitude),
          longitude: Number(longitude),
          source: "manual",
          raw: {},
        },
      }).catch(() => void 0);
    }
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <label>
        {t("event.title")}
        <input
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        />
      </label>

      <label>
        {t("event.description")}
        <textarea
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
        />
      </label>

      <label>
        {t("event.sport")}
        <input
          value={sport}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSport(e.target.value)}
        />
      </label>

      <label>
        Event image
        <input
          type="file"
          accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setImageFile(e.target.files?.[0] || null)
          }
        />
      </label>

      <img
        src={imagePreview}
        alt="Event preview"
        style={{
          width: "100%",
          maxHeight: "240px",
          objectFit: "cover",
          borderRadius: "12px",
        }}
        onError={(event) => {
          event.currentTarget.src = DEFAULT_EVENT_IMAGE_SRC;
        }}
      />

      <label>
        {t("event.level")}
        <select
          value={level}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setLevel(e.target.value)}
        >
          <option value="all">all</option>
          <option value="beginner">beginner</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
      </label>

      <LocationAutocomplete
        label={t("event.searchAddress")}
        initialQuery={initialEvent ? shortStreetName(locationAddress || locationName) : ""}
        onSelect={(suggestion) => {
          setLocationName(suggestion.label);
          setLocationAddress(suggestion.address);
          setLatitude(String(suggestion.latitude));
          setLongitude(String(suggestion.longitude));
        }}
      />

      <label>
        {t("event.address")}
        <input
          value={locationAddress}
          readOnly
          placeholder="Auto-filled from search"
        />
      </label>

      <div className={styles.formGrid}>
        <label>
          Latitude
          <input
            value={latitude}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setLatitude(e.target.value)
            }
          />
        </label>

        <label>
          Longitude
          <input
            value={longitude}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setLongitude(e.target.value)
            }
          />
        </label>
      </div>

      <div className={styles.formGrid}>
        <label>
          {t("event.start")}
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setStartAt(e.target.value)
            }
          />
        </label>

        <label>
          {t("event.end")}
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEndAt(e.target.value)
            }
          />
        </label>
      </div>

      <label>
        {t("event.maxSlots")}
        <input
          type="number"
          value={maxSlots}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setMaxSlots(e.target.value)
          }
        />
      </label>

      <label>
        Languages comma-separated
        <input
          value={languages}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setLanguages(e.target.value)
          }
        />
      </label>

      <button type="submit">
        {initialEvent ? t("editEvent.submit") : t("createEvent.submit")}
      </button>
    </form>
  );
}
