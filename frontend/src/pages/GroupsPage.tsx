import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Search, SlidersHorizontal, Users } from "lucide-react";

import { createGroup, getGroupsPage } from "../api/groupsApi";
import type { GroupItem, GroupPayload } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import { useSports } from "../hooks/useSports";
import { CuratedGroupCard } from "../components/discover/CuratedGroupCard";
import Button from "../components/shared/Button";
import { PageHeading } from "../components/shared/PageHeading";
import { PaginationControls } from "../components/shared/PaginationControls";
import { getDefaultGroupImage } from "../utils/media";

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
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
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
      const data = await getGroupsPage({
        sport: groupSport,
        level: groupLevels.join(","),
        search: groupSearch.trim(),
        page,
        pageSize: 12,
      });
      setGroups(data.results);
      const nextPageCount = Math.max(1, Math.ceil(data.count / 12));
      setPageCount(nextPageCount);
      if (page > nextPageCount) setPage(nextPageCount);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("groupsTest.loadError"));
    } finally {
      setLoading(false);
    }
  }, [groupLevels, groupSearch, groupSport, page, t]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  function toggleGroupLevel(value: GroupLevel) {
    setPage(1);
    setGroupLevels((current) =>
      current.includes(value)
        ? current.filter((level) => level !== value)
        : [...current, value],
    );
  }

  function changeGroupSearch(value: string) {
    setPage(1);
    setGroupSearch(value);
  }

  function changeGroupSport(value: string) {
    setPage(1);
    setGroupSport(value);
  }

  const hasGroupFilters = Boolean(
    groupSearch.trim() || groupSport || groupLevels.length,
  );

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
            onChange={(event: ChangeEvent<HTMLInputElement>) => changeGroupSearch(event.target.value)}
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
            onChange={(event: ChangeEvent<HTMLSelectElement>) => changeGroupSport(event.target.value)}
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
          autoComplete="off"
          className="grid grid-cols-1 gap-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm md:grid-cols-2 md:p-6"
        >
          <label className="md:col-span-2" htmlFor="create-group-name">
            <span>{t("groupsTest.name")} *</span>
            <input
              id="create-group-name"
              name="name"
              type="text"
              autoComplete="off"
              value={form.name}
              onChange={updateForm}
              required
              minLength={2}
            />
          </label>
          <label className="md:col-span-2" htmlFor="create-group-description">
            {t("groupsTest.descriptionLabel")}
            <textarea
              id="create-group-description"
              name="description"
              autoComplete="off"
              value={form.description}
              onChange={updateForm}
            />
          </label>
          <label htmlFor="create-group-cover">
            {t("groups.image")}
            <input
              id="create-group-cover"
              name="coverImage"
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCoverImageFile(event.target.files?.[0] || null)}
            />
          </label>
          <label htmlFor="create-group-sport">
            <span>{t("groupsTest.sport")} *</span>
            <select
              id="create-group-sport"
              name="sport"
              autoComplete="off"
              value={form.sport}
              onChange={updateForm}
              required
            >
              <option value="" disabled>{t("groupsTest.selectSport")}</option>
              {sports.map((sportOption) => (
                <option key={sportOption.code} value={sportOption.code}>
                  {t(`sports.${sportOption.code}`)}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="create-group-levels">
            <span>{t("groupsTest.levels")} *</span>
            <input
              id="create-group-levels"
              name="levels"
              type="text"
              autoComplete="off"
              value={form.levels}
              onChange={updateForm}
              required
            />
          </label>
          <label htmlFor="create-group-max-members">
            {t("groupsTest.maxMembers")}
            <input
              id="create-group-max-members"
              name="maxMembers"
              type="number"
              min="0"
              autoComplete="off"
              value={form.maxMembers}
              onChange={updateForm}
            />
          </label>
          <label htmlFor="create-group-location">
            {t("groupsTest.location")}
            <input
              id="create-group-location"
              name="locationName"
              type="text"
              autoComplete="off"
              value={form.locationName}
              onChange={updateForm}
            />
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
          {hasGroupFilters ? t("groupsTest.noResults") : t("groupsTest.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <CuratedGroupCard
            variant="featured"
            className="min-h-[380px] sm:col-span-2 md:min-h-[420px]"
            image={groups[0].cover_image || getDefaultGroupImage(groups[0].sport)}
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

          {groups.slice(1).map((group) => (
            <CuratedGroupCard
              key={group.id}
              variant="compact"
              className="min-h-[260px] sm:min-h-[280px]"
              image={group.cover_image || getDefaultGroupImage(group.sport)}
              title={group.name}
              categoryLabel={t(`sports.${group.sport}`)}
              memberCount={group.member_count}
              timeLabel={group.location_name || undefined}
              detailsTo={`/groups/${group.id}`}
            />
          ))}
        </div>
      )}
      <PaginationControls
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        disabled={loading}
      />
    </main>
  );
}
