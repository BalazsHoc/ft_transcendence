import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { GroupItem, GroupPayload } from "../../types/api";
import { getDefaultGroupImage, resolveMediaUrl } from "../../utils/media";
import { useSports } from "../../hooks/useSports";
import Button from "../shared/Button";

const LEVEL_CODES = new Set(["beginner", "intermediate", "advanced", "all"]);

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--control-border)] bg-[var(--control-bg)] px-3 py-2.5 text-[var(--control-text)] outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const labelClass = "grid gap-1.5 text-sm font-medium text-[var(--text)]";

export function GroupForm({
  initialGroup,
  onSubmit,
  onCancel,
}: {
  initialGroup?: GroupItem;
  onSubmit: (payload: GroupPayload) => Promise<void>;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const sports = useSports();
  const isEditing = Boolean(initialGroup);

  const [name, setName] = useState(initialGroup?.name || "");
  const [description, setDescription] = useState(initialGroup?.description || "");
  const [sport, setSport] = useState(initialGroup?.sport || "");
  const [levels, setLevels] = useState(
    initialGroup?.levels?.join(", ") || "beginner",
  );
  const [maxMembers, setMaxMembers] = useState(
    String(initialGroup?.max_members ?? 0),
  );
  const [locationName, setLocationName] = useState(initialGroup?.location_name || "");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(
    resolveMediaUrl(
      initialGroup?.cover_image,
      getDefaultGroupImage(initialGroup?.sport),
    ),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!coverImageFile) {
      setCoverPreview(
        resolveMediaUrl(
          initialGroup?.cover_image,
          getDefaultGroupImage(sport),
        ),
      );
      return;
    }

    const previewUrl = URL.createObjectURL(coverImageFile);
    setCoverPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverImageFile, initialGroup?.cover_image, sport]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const parsedLevels = levels
      .split(",")
      .map((level) => level.trim())
      .filter(Boolean) as GroupPayload["levels"];
    const maxMembersValue = Number(maxMembers);

    if (name.trim().length < 2 || !sport || parsedLevels.length === 0) {
      setSubmitError(t("groupsTest.required"));
      return;
    }
    if (
      parsedLevels.some((level) => !LEVEL_CODES.has(level)) ||
      new Set(parsedLevels).size !== parsedLevels.length
    ) {
      setSubmitError(t("groupsTest.invalidLevels"));
      return;
    }
    if (!Number.isInteger(maxMembersValue) || maxMembersValue < 0) {
      setSubmitError(t("groupsTest.invalidMaxMembers"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        sport,
        levels: parsedLevels,
        max_members: maxMembersValue,
        location_name: locationName.trim(),
        coverImageFile,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : isEditing
            ? t("editGroup.submitError")
            : t("groupsTest.createError"),
      );
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
        <span>{t("groupsTest.name")} *</span>
        <input
          className={fieldClass}
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
          required
          minLength={2}
        />
      </label>

      <label className={`${labelClass} md:col-span-2`}>
        {t("groupsTest.descriptionLabel")}
        <textarea
          className={fieldClass}
          value={description}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(event.target.value)
          }
        />
      </label>

      <div className="md:col-span-2">
        <p className="text-sm font-medium text-[var(--text)]">{t("groups.image")}</p>
        <img
          src={coverPreview}
          alt=""
          className="mt-2 h-40 w-full rounded-2xl object-cover"
        />
        <input
          type="file"
          accept="image/*"
          className="mt-2 block w-full text-sm"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setCoverImageFile(event.target.files?.[0] || null)
          }
        />
      </div>

      <label className={labelClass}>
        <span>{t("groupsTest.sport")} *</span>
        <select
          className={fieldClass}
          value={sport}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setSport(event.target.value)}
          required
        >
          <option value="" disabled>
            {t("groupsTest.selectSport")}
          </option>
          {sports.map((sportOption) => (
            <option key={sportOption.code} value={sportOption.code}>
              {t(`sports.${sportOption.code}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span>{t("groupsTest.levels")} *</span>
        <input
          className={fieldClass}
          value={levels}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setLevels(event.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        {t("groupsTest.maxMembers")}
        <input
          className={fieldClass}
          type="number"
          min="0"
          value={maxMembers}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setMaxMembers(event.target.value)
          }
        />
      </label>

      <label className={labelClass}>
        {t("groupsTest.location")}
        <input
          className={fieldClass}
          value={locationName}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setLocationName(event.target.value)
          }
        />
      </label>

      {submitError ? (
        <p role="alert" className="text-sm text-red-600 md:col-span-2">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3 md:col-span-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            {t("groupsTest.cancel")}
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || !sport || sports.length === 0}
        >
          {submitting
            ? isEditing
              ? t("editGroup.submitting")
              : t("groupsTest.creating")
            : isEditing
              ? t("editGroup.submit")
              : t("groupsTest.submit")}
        </Button>
      </div>
    </form>
  );
}
