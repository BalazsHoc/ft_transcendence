import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CuratedGroupCard } from "./CuratedGroupCard";
import { getGroups } from "../../api/groupsApi";
import type { GroupItem } from "../../types/api";
import { DEFAULT_GROUP_IMAGE_SRC } from "../../utils/media";

export function CuratedForYouSection() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getGroups()
      .then((data) => {
        if (!cancelled) setGroups(Array.isArray(data) ? data : []);
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

  if (loading) {
    return (
      <section className="curated-for-you">
        <h2 className="curated-for-you__title">{t("discover.curatedForYou")}</h2>
        <p className="text-sm text-[var(--muted)]">{t("groups.loading")}</p>
      </section>
    );
  }

  if (groups.length === 0) {
    return (
      <section className="curated-for-you">
        <h2 className="curated-for-you__title">{t("discover.curatedForYou")}</h2>
        <p className="text-sm text-[var(--muted)]">{t("groupsTest.empty")}</p>
      </section>
    );
  }

  const [featured, ...rest] = groups;
  const sideGroups = rest.slice(0, 2);
  const featuredLevel = featured.levels[0];
  const featuredLevelLabel = featuredLevel
    ? t(`discover.${featuredLevel}`)
    : undefined;

  return (
    <section className="curated-for-you">
      <h2 className="curated-for-you__title">{t("discover.curatedForYou")}</h2>

      <div className="curated-for-you__grid">
        <CuratedGroupCard
          variant="featured"
          image={featured.cover_image || DEFAULT_GROUP_IMAGE_SRC}
          title={featured.name}
          description={featured.description}
          categoryLabel={t(`sports.${featured.sport}`)}
          levelLabel={featuredLevelLabel}
          memberCount={featured.member_count}
          detailsTo={`/groups/${featured.id}`}
        />

        {sideGroups.length > 0 ? (
          <div className="curated-for-you__side">
            {sideGroups.map((group) => (
              <CuratedGroupCard
                key={group.id}
                variant="compact"
                image={group.cover_image || DEFAULT_GROUP_IMAGE_SRC}
                title={group.name}
                categoryLabel={t(`sports.${group.sport}`)}
                timeLabel={
                  group.location_name ||
                  group.levels.map((level) => t(`discover.${level}`)).join(", ")
                }
                detailsTo={`/groups/${group.id}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
