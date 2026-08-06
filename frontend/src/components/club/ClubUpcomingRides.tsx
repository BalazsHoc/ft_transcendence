import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { ClubRideRow, type ClubRideItem } from "./ClubRideRow";

type ClubUpcomingRidesProps = {
  rides: ClubRideItem[];
  onRsvp?: (ride: ClubRideItem) => void;
  loading?: boolean;
  title?: string;
  rsvpBusyId?: string | null;
  rsvpError?: string | null;
  rsvpInfo?: string | null;
  rsvpNeedsAuth?: boolean;
  headerAction?: ReactNode;
};

export function ClubUpcomingRides({
  rides,
  onRsvp,
  loading = false,
  title,
  rsvpBusyId = null,
  rsvpError = null,
  rsvpInfo = null,
  rsvpNeedsAuth = false,
  headerAction,
}: ClubUpcomingRidesProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-sm md:p-8">
      <div className="mb-2 flex items-center justify-between gap-4 border-b border-[var(--surface-border)] pb-4">
        <h2 className="font-display text-xl font-semibold text-[var(--text)]">
          {title || t("club.rides.title")}
        </h2>
        <div className="flex items-center gap-3">
          {headerAction}
          <Link
            to="/discover"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            {t("club.rides.seeAll")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {rsvpNeedsAuth ? (
        <p role="alert" className="mb-3 text-sm text-[var(--text)]">
          {t("club.rides.signInRequired")}{" "}
          <Link
            to="/login"
            className="font-medium text-[var(--text)] underline underline-offset-2 hover:opacity-80"
          >
            {t("nav.login")}
          </Link>
          {" · "}
          <Link
            to="/register"
            className="font-medium text-[var(--text)] underline underline-offset-2 hover:opacity-80"
          >
            {t("nav.register")}
          </Link>
        </p>
      ) : rsvpError ? (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {rsvpError}
        </p>
      ) : rsvpInfo ? (
        <p role="status" className="mb-3 text-sm text-[var(--text)]">
          {rsvpInfo}
        </p>
      ) : null}

      {loading ? (
        <p className="py-6 text-sm text-[var(--muted)]">{t("club.rides.loading")}</p>
      ) : rides.length === 0 ? (
        <p className="py-6 text-sm text-[var(--muted)]">{t("club.rides.empty")}</p>
      ) : (
        <div>
          {rides.map((ride) => (
            <ClubRideRow
              key={ride.id}
              ride={ride}
              onRsvp={onRsvp}
              rsvpBusy={rsvpBusyId === ride.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
