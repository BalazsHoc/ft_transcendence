import { ArrowLeft, ArrowRight, ExternalLink, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EventItem } from "../../types/api";
import { DEFAULT_AVATAR_SRC, getDefaultEventImage, resolveMediaUrl } from "../../utils/media";
import Button from "../shared/Button";
import styles from "./MapEventPanel.module.css";

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatTimeRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${start.toLocaleTimeString([], opts)} - ${end.toLocaleTimeString([], opts)}`;
}

type Props = {
  event: EventItem | null;
  events: EventItem[];
  selectedIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  busy?: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
};

export function MapEventPanel({
  event,
  events,
  selectedIndex,
  onPrevious,
  onNext,
  busy,
  onJoin,
  onLeave,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!event) {
    return (
      <section className={styles.panel}>
        <div className={styles.emptyState}>
          <MapPin size={22} />
          <p>{t("map.selectEvent")}</p>
        </div>
      </section>
    );
  }

  const isAttending = event.user_status?.status === "attending";
  const isWaiting = event.user_status?.status === "waiting";
  const spotsLeft = Math.max(event.max_slots - event.attending_count, 0);
  const fallbackImage = getDefaultEventImage(event.sport);

  return (
    <section className={styles.panel}>
      <div className={styles.imageWrap}>
        <img
          className={styles.image}
          src={resolveMediaUrl(event.image, fallbackImage)}
          alt={event.title}
          onError={(node: any) => {
            node.currentTarget.src = fallbackImage;
          }}
        />
        <span className={styles.categoryBadge}>{capitalize(event.sport)}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{event.title}</h2>
          {events.length > 1 && (
            <div className={styles.switcher} aria-label={t("map.eventSwitcher")}>
              <span className={styles.switcherCount}>
                {selectedIndex + 1} / {events.length}
              </span>
              <Button
                variant="outline"
                size="xs"
                iconOnly
                icon={<ArrowLeft size={14} />}
                aria-label={t("pagination.previous")}
                disabled={selectedIndex <= 0}
                onClick={onPrevious}
              />
              <Button
                variant="outline"
                size="xs"
                iconOnly
                icon={<ArrowRight size={14} />}
                aria-label={t("pagination.next")}
                disabled={selectedIndex >= events.length - 1}
                onClick={onNext}
              />
            </div>
          )}
        </div>
        <p className={styles.location}>
          <MapPin size={15} />
          <span>{event.location_address || event.location_name}</span>
        </p>

        <div className={styles.statGrid}>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>{t("map.statTime")}</span>
            <span className={styles.statValue}>
              {formatTimeRange(event.start_at, event.end_at)}
            </span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>{t("map.statLevel")}</span>
            <span className={styles.statValue}>{capitalize(event.level)}</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>{t("map.statSport")}</span>
            <span className={styles.statValue}>{capitalize(event.sport)}</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>{t("map.statSpots")}</span>
            <span className={styles.statValue}>
              {t("map.spotsAvailable", { count: spotsLeft, max: event.max_slots })}
            </span>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>{t("map.aboutSession")}</h3>
        <p className={styles.description}>{event.description}</p>

        <div className={styles.coachRow}>
          <img
            className={styles.coachAvatar}
            src={resolveMediaUrl(event.creator?.avatar, DEFAULT_AVATAR_SRC)}
            alt={event.creator?.username}
          />
          <div>
            <span className={styles.coachLabel}>{t("map.leadCoach")}</span>
            <span className={styles.coachName}>
              {event.creator?.first_name
                ? `${event.creator.first_name} ${event.creator.last_name || ""}`.trim()
                : event.creator?.username}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          variant="secondary"
          size="md"
          className={styles.detailsButton}
          icon={<ExternalLink size={16} />}
          onClick={() => navigate(`/events/${event.id}`)}
        >
          {t("map.viewDetails")}
        </Button>

        {isAttending || isWaiting ? (
          <Button
            variant="outline"
            size="lg"
            className={styles.reserveButton}
            disabled={busy}
            onClick={() => onLeave(event.id)}
          >
            {isWaiting ? t("map.waiting") : t("map.joined")} · {t("map.leaveSpot")}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className={styles.reserveButton}
            disabled={busy || spotsLeft <= 0}
            onClick={() => onJoin(event.id)}
          >
            {t("map.reserveSpot")}
          </Button>
        )}
      </div>
    </section>
  );
}
