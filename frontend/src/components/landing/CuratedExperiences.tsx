import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

import { getEvents } from "../../api/eventsApi";
import { getGroups } from "../../api/groupsApi";
import type { EventItem, GroupItem } from "../../types/api";
import { EventCard } from "../events/EventCard";
import { CuratedGroupCard } from "../discover/CuratedGroupCard";
import { DEFAULT_GROUP_IMAGE_SRC } from "../../utils/media";

const PREVIEW_COUNT = 3;

export function CuratedExperiences() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents((Array.isArray(data) ? data : []).slice(0, PREVIEW_COUNT));
        }
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });

    getGroups()
      .then((data) => {
        if (!cancelled) {
          setGroups((Array.isArray(data) ? data : []).slice(0, PREVIEW_COUNT));
        }
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGroups(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="curated-experiences"
      className="scroll-mt-24 bg-[var(--bg)] py-20"
    >
      <div className="mx-auto max-w-6xl space-y-14 px-5">
        <div className="text-center">
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-[var(--text)] md:text-5xl">
            {t("landing.curated.title")}
          </h2>
          <p className="text-lg text-[var(--muted)]">
            {t("landing.curated.subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <h3 className="font-display text-2xl font-semibold text-[var(--text)]">
              {t("landing.curated.events")}
            </h3>
            <Link
              to="/discover"
              className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              {t("landing.curated.seeAll")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {loadingEvents ? (
            <p className="text-sm text-[var(--muted)]">{t("landing.curated.loading")}</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{t("landing.curated.eventsEmpty")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div key={event.id} className="[&>article]:mb-0">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <h3 className="font-display text-2xl font-semibold text-[var(--text)]">
              {t("landing.curated.groups")}
            </h3>
            <Link
              to="/groups"
              className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              {t("landing.curated.seeAll")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {loadingGroups ? (
            <p className="text-sm text-[var(--muted)]">{t("landing.curated.loading")}</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{t("landing.curated.groupsEmpty")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <CuratedGroupCard
                  key={group.id}
                  variant="compact"
                  className="min-h-[260px]"
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
        </div>
      </div>
    </section>
  );
}
