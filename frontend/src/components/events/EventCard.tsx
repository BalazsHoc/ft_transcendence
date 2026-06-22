import { Link } from "react-router-dom";
import { EventItem } from "../../types/api";
import { useTranslation } from "react-i18next";
import styles from "./EventCard.module.css";
import { DEFAULT_EVENT_IMAGE_SRC } from "../../utils/media";

export function EventCard({
  event,
  onJoin,
  onLeave,
  onDelete,
}: {
  event: EventItem;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <article className={styles.eventCard}>
      <img
        className={styles.image}
        src={event.image || DEFAULT_EVENT_IMAGE_SRC}
        alt={event.title}
        onError={(eventNode) => {
          eventNode.currentTarget.src = DEFAULT_EVENT_IMAGE_SRC;
        }}
      />
      <h3>
        <Link to={`/events/${event.id}`}>{event.title}</Link>
      </h3>

      <p>
        {event.sport} / {event.level}
      </p>

      <p className={styles.eventLocation}>{event.location_name}</p>

      {event.location_address && event.location_address !== event.location_name && (
        <p className={styles.eventAddress}>{event.location_address}</p>
      )}

      <p>
        {new Date(event.start_at).toLocaleString()} -{" "}
        {new Date(event.end_at).toLocaleString()}
      </p>

      <p>
        Slots: {event.attending_count}/{event.max_slots}, waiting:{" "}
        {event.waiting_count}
      </p>

      <p>Status: {event.user_status?.status || "not joined"}</p>

      <div className="row">
        {onJoin && (
          <button onClick={() => onJoin(event.id)}>{t("common.join")}</button>
        )}

        {onLeave && (
          <button onClick={() => onLeave(event.id)}>{t("common.leave")}</button>
        )}

        <Link className="button secondary" to={`/events/${event.id}/edit`}>
          {t("common.edit")}
        </Link>

        {onDelete && (
          <button className="danger" onClick={() => onDelete(event.id)}>
            {t("common.delete")}
          </button>
        )}
      </div>
    </article>
  );
}
