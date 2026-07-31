import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../shared/Button";
import { Badge } from "../shared/Badge";

export type ClubRideItem = {
  id: string;
  title: string;
  day: string;
  month: string;
  timeLabel: string;
  intensityLabel: string;
  eventId?: string;
};

type ClubRideRowProps = {
  ride: ClubRideItem;
  onRsvp?: (ride: ClubRideItem) => void;
  rsvpDisabled?: boolean;
};

export function ClubRideRow({ ride, onRsvp, rsvpDisabled }: ClubRideRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--surface-border)] py-5 last:border-b-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="w-14 shrink-0 text-left">
          <p className="font-display text-xl font-bold leading-none text-[var(--text)]">
            {ride.day}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-[var(--muted)]">
            {ride.month}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[var(--text)]">{ride.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-1">
              <Clock size={14} aria-hidden="true" />
              {ride.timeLabel}
            </span>
            <Badge className="!normal-case">{ride.intensityLabel}</Badge>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={rsvpDisabled}
        onClick={() => onRsvp?.(ride)}
        className="self-start sm:self-center"
      >
        {t("club.rides.rsvp")}
      </Button>
    </div>
  );
}
