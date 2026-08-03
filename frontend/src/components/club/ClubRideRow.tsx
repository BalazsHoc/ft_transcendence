import { useState } from "react";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../shared/Button";
import { Badge } from "../shared/Badge";
import { ConfirmDialog } from "../shared/ConfirmDialog";

export type ClubRideItem = {
  id: string;
  title: string;
  day: string;
  month: string;
  timeLabel: string;
  intensityLabel: string;
  eventId?: string;
  userStatus?: "attending" | "waiting" | null;
};

type ClubRideRowProps = {
  ride: ClubRideItem;
  onRsvp?: (ride: ClubRideItem) => void;
  rsvpDisabled?: boolean;
  rsvpBusy?: boolean;
};

export function ClubRideRow({
  ride,
  onRsvp,
  rsvpDisabled,
  rsvpBusy,
}: ClubRideRowProps) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isGoing = ride.userStatus === "attending";
  const isWaiting = ride.userStatus === "waiting";
  const alreadyJoined = isGoing || isWaiting;

  let label = t("club.rides.join");
  if (rsvpBusy) {
    label = alreadyJoined
      ? t("club.rides.leaving")
      : t("club.rides.joining");
  } else if (alreadyJoined) {
    label = t("club.rides.leave");
  }

  function handleClick() {
    if (!onRsvp || rsvpDisabled || rsvpBusy) return;
    if (alreadyJoined) {
      setConfirmOpen(true);
      return;
    }
    onRsvp(ride);
  }

  function handleConfirmLeave() {
    setConfirmOpen(false);
    onRsvp?.(ride);
  }

  return (
    <>
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
              {isGoing ? (
                <Badge variant="solid" className="!normal-case">
                  {t("club.rides.statusGoing")}
                </Badge>
              ) : null}
              {isWaiting ? (
                <Badge variant="solid" className="!normal-case">
                  {t("club.rides.statusWaiting")}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <Button
          variant={alreadyJoined ? "outline" : "primary"}
          size="sm"
          disabled={rsvpDisabled || rsvpBusy}
          onClick={handleClick}
          className={`self-start sm:self-center ${
            alreadyJoined
              ? "!border-[var(--surface-border)] !text-[var(--text)]"
              : ""
          }`}
        >
          {label}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t("club.rides.leaveConfirmTitle")}
        message={t("club.rides.leaveConfirm", { title: ride.title })}
        confirmLabel={t("club.rides.leave")}
        onConfirm={handleConfirmLeave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
