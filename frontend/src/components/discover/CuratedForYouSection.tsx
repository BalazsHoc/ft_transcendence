import { useTranslation } from "react-i18next";
import { CuratedEventCard } from "./CuratedEventCard";
import { FeaturedEventCard } from "./FeaturedEventCard";
import { DEFAULT_EVENT_IMAGE_SRC } from "../../utils/media";

export function CuratedForYouSection() {
  const { t } = useTranslation();

  const curatedEvents = [
    {
      id: "morning-flow",
      image: DEFAULT_EVENT_IMAGE_SRC,
      title: t("discover.curatedEventOneTitle"),
      categoryLabel: t("discover.yoga"),
      timeLabel: t("discover.curatedEventOneTime"),
    },
    {
      id: "strength-conditioning",
      image: DEFAULT_EVENT_IMAGE_SRC,
      title: t("discover.curatedEventTwoTitle"),
      categoryLabel: t("discover.strength"),
      timeLabel: t("discover.curatedEventTwoTime"),
    },
  ];

  return (
    <section className="curated-for-you">
      <h2 className="curated-for-you__title">{t("discover.curatedForYou")}</h2>

      <div className="curated-for-you__grid">
        <FeaturedEventCard
          image={DEFAULT_EVENT_IMAGE_SRC}
          title={t("discover.featuredEventTitle")}
          description={t("discover.featuredEventDescription")}
          levelLabel={t("discover.intermediate")}
          memberCount={128}
        />

        <div className="curated-for-you__side">
          {curatedEvents.map((event) => (
            <CuratedEventCard
              key={event.id}
              image={event.image}
              title={event.title}
              categoryLabel={event.categoryLabel}
              timeLabel={event.timeLabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
