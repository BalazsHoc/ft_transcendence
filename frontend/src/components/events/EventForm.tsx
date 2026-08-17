import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { EventItem } from "../../types/api";
import type { EventPayload } from "../../api/eventsApi";
import { rememberSearch } from "../../api/geoApi";
import { getStreetName, LocationAutocomplete } from "../geo/LocationAutocomplete";
import { getDefaultEventImage, resolveMediaUrl } from "../../utils/media";
import { useSports } from "../../hooks/useSports";
import { PROFILE_LANGUAGE_CODES } from "../../data/profileLanguages";
import Button from "../shared/Button";

const LEVEL_OPTIONS = ["all", "beginner", "intermediate", "advanced"] as const;

function toLocalInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function defaultDateTime(offsetMinutes: number) {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() + offsetMinutes);
  return toLocalInputValue(date.toISOString());
}

function compactStreetName(value?: string) {
  if (!value) return "";
  const compact = value.split(",")[0]?.trim() || value.trim();
  return compact.replace(/\s+\d+[A-Za-z]?(?:[-/]\d+[A-Za-z]?)?$/i, "").trim() || compact;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--control-border)] bg-[var(--control-bg)] px-3 py-2.5 text-[var(--control-text)] outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const labelClass = "grid gap-1.5 text-sm font-medium text-[var(--text)]";

export function EventForm({
  initialEvent,
  onSubmit,
  onCancel,
}: {
  initialEvent?: EventItem;
  onSubmit: (payload: EventPayload, imageFile?: File | null) => Promise<void>;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const sports = useSports();

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [sport, setSport] = useState(initialEvent?.sport || "");
  const [level, setLevel] = useState(initialEvent?.level || "all");
  const [visibility, setVisibility] = useState<"public" | "private">(
    initialEvent?.visibility || "public",
  );
  const [locationName, setLocationName] = useState(initialEvent?.location_name || "");
  const [locationAddress, setLocationAddress] = useState(
    initialEvent?.location_address || "",
  );
  const [latitude, setLatitude] = useState<number | null>(
    Number.isFinite(initialEvent?.latitude) ? initialEvent?.latitude ?? null : null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    Number.isFinite(initialEvent?.longitude) ? initialEvent?.longitude ?? null : null,
  );
  const [startAt, setStartAt] = useState(
    () => toLocalInputValue(initialEvent?.start_at) || defaultDateTime(15),
  );
  const [endAt, setEndAt] = useState(
    () => toLocalInputValue(initialEvent?.end_at) || defaultDateTime(135),
  );
  const [maxSlots, setMaxSlots] = useState(String(initialEvent?.max_slots || 10));
  const [language, setLanguage] = useState(initialEvent?.languages?.[0] || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(
    resolveMediaUrl(initialEvent?.image, getDefaultEventImage(initialEvent?.sport)),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(resolveMediaUrl(initialEvent?.image, getDefaultEventImage(sport)));
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile, initialEvent?.image, sport]);

  function clearLocationSelection() {
    setLocationName("");
    setLocationAddress("");
    setLatitude(null);
    setLongitude(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedLocationName = locationName.trim();
    const normalizedLocationAddress = locationAddress.trim();
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const slots = Number(maxSlots);

    if (!normalizedTitle || !sport || !normalizedLocationAddress || !language) {
      setSubmitError(t("createEvent.required"));
      return;
    }
    if (
      latitude === null ||
      longitude === null ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setSubmitError(t("createEvent.locationRequired"));
      return;
    }
    if (Number.isNaN(startDate.getTime()) || startDate.getTime() < Date.now()) {
      setSubmitError(t("createEvent.futureDate"));
      return;
    }
    if (Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setSubmitError(t("createEvent.endAfterStart"));
      return;
    }
    if (!Number.isInteger(slots) || slots < 1) {
      setSubmitError(t("createEvent.maxSlotsRequired"));
      return;
    }

    const payload: EventPayload = {
      title: normalizedTitle,
      description: normalizedDescription,
      sport,
      level,
      languages: [language],
      location_name: normalizedLocationName || normalizedLocationAddress,
      location_address: normalizedLocationAddress,
      latitude,
      longitude,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      max_slots: slots,
      visibility,
      imageFile,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload, imageFile);

      if (normalizedLocationName && normalizedLocationAddress) {
        await rememberSearch({
          query: normalizedLocationName,
          suggestion: {
            id: `${normalizedLocationName}-${normalizedLocationAddress}`,
            label: normalizedLocationName,
            address: normalizedLocationAddress,
            latitude,
            longitude,
            source: "manual",
            raw: {},
          },
        }).catch(() => void 0);
      }
    } catch (error) {
      setSubmitError(errorMessage(error, t("createEvent.submitError")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm md:grid-cols-2 md:p-6"
    >
      <label className={`${labelClass} md:col-span-2`}>
        <span>{t("event.title")} *</span>
        <input
          className={fieldClass}
          value={title}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
          required
          minLength={2}
          autoComplete="off"
        />
      </label>

      <label className={`${labelClass} md:col-span-2`}>
        <span>{t("event.description")}</span>
        <textarea
          className={fieldClass}
          value={description}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(event.target.value)
          }
          rows={4}
        />
      </label>

      <label className={labelClass}>
        <span>{t("event.sport")} *</span>
        <select
          className={fieldClass}
          value={sport}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setSport(event.target.value)}
          required
        >
          <option value="" disabled>
            {t("event.selectSport")}
          </option>
          {sports.map((sportOption) => (
            <option key={sportOption.code} value={sportOption.code}>
              {t(`sports.${sportOption.code}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span>{t("event.level")}</span>
        <select
          className={fieldClass}
          value={level}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setLevel(event.target.value)}
        >
          {LEVEL_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`discover.${option}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={`${labelClass} md:col-span-2`}>
        <span>{t("event.image")}</span>
        <input
          className={fieldClass}
          type="file"
          accept="image/*"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setImageFile(event.target.files?.[0] || null)
          }
        />
      </label>

      <img
        src={imagePreview}
        alt={t("event.imagePreview")}
        className="h-48 w-full rounded-2xl object-cover md:col-span-2"
        onError={(event: { currentTarget: HTMLImageElement }) => {
          event.currentTarget.src = getDefaultEventImage(sport);
        }}
      />

      <div className="md:col-span-2">
        <LocationAutocomplete
          label={`${t("event.address")} *`}
          placeholder={t("event.searchAddress")}
          initialQuery={
            initialEvent
              ? compactStreetName(locationName || locationAddress)
              : ""
          }
          required
          onQueryChange={() => {
            if (latitude !== null || longitude !== null || locationAddress) {
              clearLocationSelection();
            }
          }}
          onSelect={(suggestion) => {
            setLocationName(getStreetName(suggestion));
            setLocationAddress(suggestion.address || suggestion.label);
            setLatitude(suggestion.latitude);
            setLongitude(suggestion.longitude);
          }}
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("createEvent.locationHint")}</p>
      </div>

      <label className={labelClass}>
        <span>{t("event.start")} *</span>
        <input
          className={fieldClass}
          type="datetime-local"
          value={startAt}
          min={initialEvent ? undefined : defaultDateTime(0)}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setStartAt(event.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        <span>{t("event.end")} *</span>
        <input
          className={fieldClass}
          type="datetime-local"
          value={endAt}
          min={startAt || undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setEndAt(event.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        <span>{t("event.maxSlots")} *</span>
        <input
          className={fieldClass}
          type="number"
          min="1"
          step="1"
          value={maxSlots}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setMaxSlots(event.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        <span>{t("event.language")} *</span>
        <select
          className={fieldClass}
          value={language}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setLanguage(event.target.value)}
          required
        >
          <option value="" disabled>
            {t("event.selectLanguage")}
          </option>
          {PROFILE_LANGUAGE_CODES.map((code) => (
            <option key={code} value={code}>
              {t(`languageNames.${code}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span>{t("event.visibility")}</span>
        <select
          className={fieldClass}
          value={visibility}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setVisibility(event.target.value as "public" | "private")
          }
        >
          <option value="public">{t("event.public")}</option>
          <option value="private">{t("event.private")}</option>
        </select>
      </label>

      {submitError ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 md:col-span-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            {t("createEvent.cancel")}
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || !sport || sports.length === 0}
        >
          {submitting
            ? t("createEvent.submitting")
            : initialEvent
              ? t("editEvent.submit")
              : t("createEvent.submit")}
        </Button>
      </div>
    </form>
  );
}
