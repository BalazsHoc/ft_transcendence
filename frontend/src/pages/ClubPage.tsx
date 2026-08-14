import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClubHero } from "../components/club/ClubHero";
import { ClubStatsRow } from "../components/club/ClubStatsRow";
import { ClubUpcomingRides } from "../components/club/ClubUpcomingRides";
import { ClubRecruitingCard } from "../components/club/ClubRecruitingCard";
import { ClubMemberSpotlight } from "../components/club/ClubMemberSpotlight";
import type { ClubRideItem } from "../components/club/ClubRideRow";
import { getEvents, joinEvent, leaveEvent } from "../api/eventsApi";
import type { EventItem } from "../types/api";

const CLUB_COVER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCbMLzUVMOMVMTUBqU1-xVD6P2sVjNJu0bMBC8EIy1RHadDJE-eAyf7AAzymMVE64Q8e6IHRIH0E64jAktZGuEatxJvrhLL08ran7rMWx4Za-EOhX1YCwJWcSU-dTUmATtZp41n78M9iXl3TCcpLdJuZ0IK88klsJFvVGHMLPwfDKrPKvn7_1xnQ58mZk50c4M8KzbyjWFI9XykOWZytmpu8FXeBfTHW6InEg76Rr4eYfag7TWlgHHJEAxGPMyBBjCqjPFcOKRD2Ps";

const SPOTLIGHT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBnZQtORqlXC8gwYnoldnFaUcO0JM-Lv4mA19Q-k9j2GoOPQOTydYVk46pLB-vW0o-0WrAMsAZg7YCcdbHbe6E6P5IUsVapaCcbBBtw-qzrPe_ZAQTdZsHk-vHGGjS-JhlGrdZUqrgs5r440b2GV9cZE-KD6VM2FsaXjnXM4FKGdPjtXldzeK6XJWRd70ZKF8qMMItyFfNxJfOGbQCLlxDH-qD5uVjnhSzZR6YUVmKJEKthkHzKlv6MGLty_Y3z22LVSTCb-pML5is";

function levelLabel(level: EventItem["level"], t: (key: string) => string) {
  const key = `discover.${level}` as const;
  const translated = t(key);
  return translated === key ? level : translated;
}

function eventToRide(
  event: EventItem,
  locale: string,
  t: (key: string) => string,
): ClubRideItem {
  const start = new Date(event.start_at);
  return {
    id: event.id,
    eventId: event.id,
    title: event.title,
    day: start.toLocaleDateString(locale, { day: "numeric" }),
    month: start.toLocaleDateString(locale, { month: "short" }),
    timeLabel: start.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    intensityLabel: levelLabel(event.level, t),
  };
}

export function ClubPage() {
  const { t, i18n } = useTranslation();
  const ridesRef = useRef<HTMLDivElement | null>(null);
  const [rides, setRides] = useState<ClubRideItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fallbackRides: ClubRideItem[] = [
      {
        id: "fake-1",
        title: t("club.rides.demoOneTitle"),
        day: "12",
        month: t("club.rides.demoOneMonth"),
        timeLabel: t("club.rides.demoOneTime"),
        intensityLabel: t("club.rides.demoOneIntensity"),
      },
      {
        id: "fake-2",
        title: t("club.rides.demoTwoTitle"),
        day: "15",
        month: t("club.rides.demoTwoMonth"),
        timeLabel: t("club.rides.demoTwoTime"),
        intensityLabel: t("club.rides.demoTwoIntensity"),
      },
    ];

    async function load() {
      setLoading(true);
      try {
        const data = await getEvents({ sport: "cycling" });
        const list = Array.isArray(data) ? data : [];
        const mapped = list
          .slice(0, 4)
          .map((event) => eventToRide(event, i18n.language, t));
        if (!cancelled) {
          setRides(mapped.length > 0 ? mapped : fallbackRides);
        }
      } catch {
        if (!cancelled) setRides(fallbackRides);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [i18n.language, t]);

  function scrollToRides() {
    ridesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleRsvp(ride: ClubRideItem) {
    if (!ride.eventId) return;
    try {
      if (ride.userStatus === "attending" || ride.userStatus === "waiting") {
        await leaveEvent(ride.eventId);
      } else {
        await joinEvent(ride.eventId);
      }
    } catch {
      // Auth or capacity errors — quiet for MVP
    }
  }

  return (
    <div className="club-page">
      <ClubHero
        coverImage={CLUB_COVER_IMAGE}
        name={t("club.hero.name")}
        description={t("club.hero.description")}
        sportLabel={t("club.hero.sport")}
        cityLabel={t("club.hero.city")}
        onViewSchedule={scrollToRides}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-8">
        <ClubStatsRow
          members={t("club.stats.membersValue")}
          middleValue={t("club.stats.scoreValue")}
          middleLabel={t("club.stats.clubScore")}
          established={t("club.stats.establishedValue")}
        />

        <div
          ref={ridesRef}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          <div className="lg:col-span-8">
            <ClubUpcomingRides
              rides={rides}
              loading={loading}
              onRsvp={handleRsvp}
            />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4">
            <ClubRecruitingCard />
            <ClubMemberSpotlight
              name={t("club.spotlight.name")}
              subtitle={t("club.spotlight.subtitle")}
              quote={t("club.spotlight.quote")}
              avatarUrl={SPOTLIGHT_AVATAR}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
