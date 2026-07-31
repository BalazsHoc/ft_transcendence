import { useTranslation } from "react-i18next";
import { ClubStatCard, CLUB_STAT_ICONS } from "./ClubStatCard";

type ClubStatsRowProps = {
  members: string;
  score: string;
  established: string;
};

export function ClubStatsRow({ members, score, established }: ClubStatsRowProps) {
  const { t } = useTranslation();

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-3">
      <ClubStatCard
        icon={CLUB_STAT_ICONS.members}
        value={members}
        label={t("club.stats.activeMembers")}
      />
      <ClubStatCard
        icon={CLUB_STAT_ICONS.score}
        value={score}
        label={t("club.stats.clubScore")}
      />
      <ClubStatCard
        icon={CLUB_STAT_ICONS.established}
        value={established}
        label={t("club.stats.established")}
      />
    </section>
  );
}
