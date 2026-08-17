import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getGroups } from "../../api/groupsApi";
import type { GroupItem } from "../../types/api";
import { CuratedGroupCard } from "../discover/CuratedGroupCard";
import { DEFAULT_GROUP_IMAGE_SRC } from "../../utils/media";

const MAX_GROUPS = 4;

export function HomeMyGroups() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getGroups()
      .then((data) => {
        if (cancelled) return;
        const mine = (Array.isArray(data) ? data : [])
          .filter((group) => Boolean(group.current_user_membership))
          .slice(0, MAX_GROUPS);
        setGroups(mine);
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-[var(--text)]">
          {t("home.groupsTitle")}
        </h2>
        <Link
          to="/groups"
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          {t("home.seeAllGroups")}
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-[var(--muted)]">{t("groupsTest.loading")}</p>
      )}

      {!loading && groups.length === 0 && (
        <p className="text-sm text-[var(--muted)]">{t("home.groupsEmpty")}</p>
      )}

      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {groups.map((group) => (
            <CuratedGroupCard
              key={group.id}
              variant="compact"
              image={group.cover_image || DEFAULT_GROUP_IMAGE_SRC}
              title={group.name}
              description={group.description}
              categoryLabel={t(`sports.${group.sport}`)}
              levelLabel={
                group.levels[0] ? t(`discover.${group.levels[0]}`) : undefined
              }
              memberCount={group.member_count}
              timeLabel={group.location_name || undefined}
              detailsTo={`/groups/${group.id}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
