import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Search, SlidersHorizontal, Users } from "lucide-react";

import { createGroup, getGroups } from "../api/groupsApi";
import type { GroupItem, GroupPayload } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import { useSports } from "../hooks/useSports";
import { CuratedGroupCard } from "../components/discover/CuratedGroupCard";
import Button from "../components/shared/Button";
import { PageHeading } from "../components/shared/PageHeading";
import { DEFAULT_GROUP_IMAGE_SRC } from "../utils/media";

const LEVEL_CODES = new Set(["beginner", "intermediate", "advanced", "all"]);
type GroupLevel = GroupItem["levels"][number];
const GROUP_LEVEL_OPTIONS: { value: GroupLevel; labelKey: string }[] = [
  { value: "beginner", labelKey: "discover.beginner" },
  { value: "intermediate", labelKey: "discover.intermediate" },
  { value: "advanced", labelKey: "discover.advanced" },
  { value: "all", labelKey: "discover.allLevels" },
];

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
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSport, setGroupSport] = useState("");
  const [groupLevels, setGroupLevels] = useState<GroupLevel[]>([]);
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
      setGroups(await getGroups({ sport: groupSport }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("groupsTest.loadError"));
    } finally {
      setLoading(false);
    }
  }, [groupSport, t]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  function toggleGroupLevel(value: GroupLevel) {
    setGroupLevels((current) =>
      current.includes(value)
        ? current.filter((level) => level !== value)
        : [...current, value],
    );
  }

  const filteredGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();

    return groups.filter((group) => {
      if (
        query &&
        ![
          group.name,
          group.description,
          group.location_name,
          group.location_address,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))
      ) {
        return false;
      }

      if (
        groupLevels.length > 0 &&
        !groupLevels.some((level) => group.levels.includes(level))
      ) {
        return false;
      }

      return true;
    });
  }, [groupLevels, groupSearch, groups]);

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
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:py-10">
      <PageHeading
        icon={Users}
        title={t("groupsTest.title")}
        description={t("groupsTest.description")}
        actions={
          user ? (
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
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-3 shadow-sm md:p-4">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">{t("groupsTest.searchGroups")}</span>
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="search"
            value={groupSearch}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setGroupSearch(event.target.value)}
            placeholder={t("groupsTest.searchGroups")}
            className="pl-10"
          />
        </label>

        <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
          <SlidersHorizontal size={17} aria-hidden="true" />
          <span className="hidden sm:inline">{t("discover.filters")}</span>
        </div>

        <label className="min-w-[150px] flex-1 sm:flex-none">
          <span className="sr-only">{t("discover.sport")}</span>
          <select
            value={groupSport}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setGroupSport(event.target.value)}
          >
            <option value="">{t("discover.all")}</option>
            {sports.map((sportOption) => (
              <option key={sportOption.code} value={sportOption.code}>
                {t(`sports.${sportOption.code}`)}
              </option>
            ))}
          </select>
        </label>

        <details className="events-level-filter relative min-w-[180px] flex-1 sm:flex-none">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--control-border)] bg-[var(--control-bg)] px-3 py-[10px] text-sm text-[var(--control-text)]">
            <span className="truncate">
              {groupLevels.length
                ? t("discover.levelSelected", { count: groupLevels.length })
                : t("discover.level")}
            </span>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div className="absolute right-0 z-30 mt-2 w-56 space-y-1 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-2 shadow-lg">
            {GROUP_LEVEL_OPTIONS.map((option) => {
              const active = groupLevels.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-border)]"
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleGroupLevel(option.value)}
                    className="h-4 w-4 shrink-0"
                  />
                  <span>{t(option.labelKey)}</span>
                </label>
              );
            })}
          </div>
        </details>
      </div>

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
      ) : filteredGroups.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-[var(--surface-border)] px-6 py-16 text-center text-[var(--muted)]">
          {groups.length === 0 ? t("groupsTest.empty") : t("groupsTest.noResults")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <CuratedGroupCard
            variant="featured"
            className="min-h-[380px] sm:col-span-2 md:min-h-[420px]"
            image={filteredGroups[0].cover_image || DEFAULT_GROUP_IMAGE_SRC}
            title={filteredGroups[0].name}
            description={filteredGroups[0].description}
            categoryLabel={t(`sports.${filteredGroups[0].sport}`)}
            levelLabel={
              filteredGroups[0].levels[0]
                ? t(`discover.${filteredGroups[0].levels[0]}`)
                : undefined
            }
            memberCount={filteredGroups[0].member_count}
            timeLabel={filteredGroups[0].location_name || undefined}
            detailsTo={`/groups/${filteredGroups[0].id}`}
          />

          {filteredGroups.slice(1).map((group) => (
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
      )}
    </main>
  );
}
