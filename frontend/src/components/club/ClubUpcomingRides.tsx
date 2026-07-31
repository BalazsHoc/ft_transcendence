import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ClubRideRow, type ClubRideItem } from "./ClubRideRow";

type ClubUpcomingRidesProps = {
  rides: ClubRideItem[];
  onRsvp?: (ride: ClubRideItem) => void;
  loading?: boolean;
};

export function ClubUpcomingRides({
  rides,
  onRsvp,
  loading = false,
}: ClubUpcomingRidesProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-sm md:p-8">
      <div className="mb-2 flex items-center justify-between gap-4 border-b border-[var(--surface-border)] pb-4">
        <h2 className="font-display text-xl font-semibold text-[var(--text)]">
          {t("club.rides.title")}
        </h2>
        <Link
          to="/discover"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
        >
          {t("club.rides.seeAll")}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <p className="py-6 text-sm text-[var(--muted)]">{t("club.rides.loading")}</p>
      ) : rides.length === 0 ? (
        <p className="py-6 text-sm text-[var(--muted)]">{t("club.rides.empty")}</p>
      ) : (
        <div>
          {rides.map((ride) => (
            <ClubRideRow key={ride.id} ride={ride} onRsvp={onRsvp} />
          ))}
        </div>
      )}
    </section>
  );
}
