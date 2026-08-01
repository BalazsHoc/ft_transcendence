import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getGroup } from "../api/groupsApi";
import type { GroupItem } from "../types/api";
import { resolveMediaUrl } from "../utils/media";

export function GroupDetailsPage() {
  const { groupId } = useParams();
  const { t } = useTranslation();
  const [group, setGroup] = useState<GroupItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    getGroup(groupId)
      .then(setGroup)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("groups.loadError"));
      });
  }, [groupId, t]);

  if (error) return <main className="mx-auto max-w-3xl px-4 py-8"><p role="alert">{error}</p></main>;
  if (!group) return <main className="mx-auto max-w-3xl px-4 py-8"><p>{t("groups.loading")}</p></main>;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link to="/groups" className="text-sm text-[var(--muted)]">{t("groups.back")}</Link>
      {group.cover_image && (
        <img
          src={resolveMediaUrl(group.cover_image, "")}
          alt={group.name}
          className="h-64 w-full rounded-2xl object-cover"
        />
      )}
      <section className="space-y-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">{group.name}</h1>
        <p>{group.description || t("groups.noDescription")}</p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div><dt>{t("event.sport")}</dt><dd>{t(`sports.${group.sport}`)}</dd></div>
          <div><dt>{t("groups.levels")}</dt><dd>{group.levels.map((level) => t(`discover.${level}`)).join(", ")}</dd></div>
          <div><dt>{t("groups.members")}</dt><dd>{group.member_count}</dd></div>
          <div><dt>{t("groups.location")}</dt><dd>{group.location_name || t("profile.notSet")}</dd></div>
        </dl>
      </section>
    </main>
  );
}
