import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { createGroup, getGroups } from "../api/groupsApi";
import type { GroupItem, GroupPayload } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import { useSports } from "../hooks/useSports";
import { CuratedGroupCard } from "../components/discover/CuratedGroupCard";
import Button from "../components/shared/Button";
import { DEFAULT_GROUP_IMAGE_SRC } from "../utils/media";

const LEVEL_CODES = new Set(["beginner", "intermediate", "advanced", "all"]);

type GroupFormState = {
  name: string;
  description: string;
  sport: string;
  levels: string;
  maxMembers: string;
  locationName: string;
};

const initialForm: GroupFormState = {
  name: "",
  description: "",
  sport: "",
  levels: "beginner",
  maxMembers: "0",
  locationName: "",
};

export function GroupsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const sports = useSports();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [form, setForm] = useState<GroupFormState>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroups(await getGroups());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("groupsTest.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  function updateForm(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const levels = form.levels
      .split(",")
      .map((level) => level.trim())
      .filter(Boolean) as GroupPayload["levels"];
    const maxMembers = Number(form.maxMembers);

    if (form.name.trim().length < 2 || !form.sport || levels.length === 0) {
      setError(t("groupsTest.required"));
      return;
    }
    if (levels.some((level) => !LEVEL_CODES.has(level)) || new Set(levels).size !== levels.length) {
      setError(t("groupsTest.invalidLevels"));
      return;
    }
    if (!Number.isInteger(maxMembers) || maxMembers < 0) {
      setError(t("groupsTest.invalidMaxMembers"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createGroup({
        name: form.name,
        description: form.description,
        sport: form.sport,
        levels,
        max_members: Number.isFinite(maxMembers) ? maxMembers : 0,
        location_name: form.locationName,
        coverImageFile,
      });
      setForm(initialForm);
      setCoverImageFile(null);
      setShowForm(false);
      await loadGroups();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("groupsTest.createError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--surface-border)] pb-6">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-3xl font-bold text-[var(--text)] md:text-4xl">
            {t("groupsTest.title")}
          </h1>
          <p className="max-w-xl text-sm text-[var(--muted)] md:text-base">
            {t("groupsTest.description")}
          </p>
        </div>
        {user && (
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setShowForm((visible) => !visible);
              setError(null);
            }}
          >
            {showForm ? t("groupsTest.cancel") : t("groupsTest.create")}
          </Button>
        )}
      </header>

      {user && showForm && (
        <form
          onSubmit={submitGroup}
          className="grid grid-cols-1 gap-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm md:grid-cols-2 md:p-6"
        >
          <label className="md:col-span-2">
            {t("groupsTest.name")}
            <input name="name" value={form.name} onChange={updateForm} required minLength={2} />
          </label>
          <label className="md:col-span-2">
            {t("groupsTest.descriptionLabel")}
            <textarea name="description" value={form.description} onChange={updateForm} />
          </label>
          <label>
            {t("groups.image")}
            <input
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCoverImageFile(event.target.files?.[0] || null)}
            />
          </label>
          <label>
            {t("groupsTest.sport")}
            <select name="sport" value={form.sport} onChange={updateForm} required>
              <option value="" disabled>{t("groupsTest.selectSport")}</option>
              {sports.map((sportOption) => (
                <option key={sportOption.code} value={sportOption.code}>
                  {t(`sports.${sportOption.code}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("groupsTest.levels")}
            <input name="levels" value={form.levels} onChange={updateForm} required />
          </label>
          <label>
            {t("groupsTest.maxMembers")}
            <input name="maxMembers" type="number" min="0" value={form.maxMembers} onChange={updateForm} />
          </label>
          <label>
            {t("groupsTest.location")}
            <input name="locationName" value={form.locationName} onChange={updateForm} />
          </label>
          <div className="flex flex-wrap justify-end gap-3 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setForm(initialForm);
                setCoverImageFile(null);
                setError(null);
              }}
              disabled={submitting}
            >
              {t("groupsTest.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !form.sport || sports.length === 0}
            >
              {submitting ? t("groupsTest.creating") : t("groupsTest.submit")}
            </Button>
          </div>
        </form>
      )}

      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p className="text-[var(--muted)]">{t("groupsTest.loading")}</p>
      ) : groups.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-[var(--surface-border)] px-6 py-16 text-center text-[var(--muted)]">
          {t("groupsTest.empty")}
        </p>
      ) : (
        <div className="space-y-5 md:space-y-6">
          <CuratedGroupCard
            variant="featured"
            className="min-h-[380px] md:min-h-[420px]"
            image={groups[0].cover_image || DEFAULT_GROUP_IMAGE_SRC}
            title={groups[0].name}
            description={groups[0].description}
            categoryLabel={t(`sports.${groups[0].sport}`)}
            levelLabel={
              groups[0].levels[0]
                ? t(`discover.${groups[0].levels[0]}`)
                : undefined
            }
            memberCount={groups[0].member_count}
            timeLabel={groups[0].location_name || undefined}
            detailsTo={`/groups/${groups[0].id}`}
          />

          {groups.length > 1 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
              {groups.slice(1).map((group) => (
                <CuratedGroupCard
                  key={group.id}
                  variant="compact"
                  className="min-h-[260px] sm:min-h-[280px]"
                  image={group.cover_image || DEFAULT_GROUP_IMAGE_SRC}
                  title={group.name}
                  categoryLabel={t(`sports.${group.sport}`)}
                  memberCount={group.member_count}
                  timeLabel={group.location_name || undefined}
                  detailsTo={`/groups/${group.id}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
