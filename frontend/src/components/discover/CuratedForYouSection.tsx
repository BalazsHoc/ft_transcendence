import { useTranslation } from "react-i18next";
import { CuratedEventCard } from "./CuratedEventCard";
import { FeaturedEventCard } from "./FeaturedEventCard";

const FEATURED_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDmj0MpYVy6qJULbayBJZHM2_kmzuFIqhYwGEvDwQoyZKtpyzVslCdg_qRVURfpdCrMxZMflWQh-y8qvcanTpdUn4rGV9DOdV0O6cT3OKsdMcyQWgHSYiPMhM0r8VqIpq1_hgzcAFUrzus3ic09kEXUXDdSxkm_gMAvYk0ePhfaPXL4pz3O0AU-5kuBv7q7I6xM_-tV3VdNBQ2SZVmfc5uR1tnKPLVQ7zCsbKDAPfTjeoXZy6qsK2CpAMO75M-s11PxwMTbvCxU-fc";

export function CuratedForYouSection() {
  const { t } = useTranslation();

  const curatedEvents = [
    {
      id: "morning-flow",
      image: "https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg",
      title: t("discover.curatedEventOneTitle"),
      categoryLabel: t("discover.yoga"),
      timeLabel: t("discover.curatedEventOneTime"),
    },
    {
      id: "strength-conditioning",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAWiXzlxBg5UVhX1jwi8Oo-229AaR5i-vGHDCcXT6oToxQXvuthslKxJUiSBnJBqg39nsKLlTHHTO5bqBE0cu6G4AjM9rVCxhmO-90qKQWGhJuWe1BZxjT1dODPDwMKK72Yrh4AmQ4JkUFtzwZV7ELpQ8QgBFhFKU1EkA1uDL5UhKBk0_aIQ-nKdKpdWRpF5PqlkUMod-kQWnjC-WN2o9BqOlUrcf-q8B2fZEaSvbioHp4-iGfSsI9guy6g9VIUyot1EJKfBPhafiQ",
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
          image={FEATURED_IMAGE}
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
