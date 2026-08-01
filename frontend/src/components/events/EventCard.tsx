import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

import { EventItem } from "../../types/api";
import { DEFAULT_EVENT_IMAGE_SRC, resolveMediaUrl } from "../../utils/media";

import { Badge } from "../shared/Badge";
import Button from "../shared/Button";

import styles from "./EventCard.module.css";

type ImageErrorEvent = {
  currentTarget: HTMLImageElement;
};

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

	const startDate = new Date(event.start_at);
	const endDate = new Date(event.end_at);

	return (
		<article
			className={`${styles.eventCard} mb-10 overflow-hidden rounded-[var(--radius-card)] border border-[var(--surface-border)] bg-[var(--surface)] shadow-[0_4px_14px_var(--surface-shadow)] transition-shadow duration-200 hover:shadow-[0_10px_28px_var(--surface-shadow)]`}
		>
			<div className="relative">
				<Link
					to={`/events/${event.id}`}
					className="block overflow-hidden"
					aria-label={event.title}
				>
					<img
						className={styles.image}
						src={resolveMediaUrl(event.image, DEFAULT_EVENT_IMAGE_SRC)}
						alt={event.title}
						onError={(eventNode: ImageErrorEvent) => {
							eventNode.currentTarget.src = DEFAULT_EVENT_IMAGE_SRC;
						}}
					/>
				<div className="absolute left-3 top-3">
					<Badge
						variant={
							event.user_status?.status === "attending"
								? "green"
								: "default"
						}
					>
						{event.user_status?.status === "attending"
							? t("event.attending")
							: t("event.notJoined")}
					</Badge>
				</div>
				</Link>
			</div>

			<div className="p-4">
				<div className="mb-3 flex items-start justify-between gap-3">
					<h3 className="m-0 min-w-0 flex-1 text-lg font-semibold text-[var(--text)] text-3xl">
						<Link to={`/events/${event.id}`}>{event.title}</Link>
					</h3>

					<div
						className={`${styles.badges} flex shrink-0 flex-wrap justify-end gap-2`}
					>
						<Badge variant="solid">{event.sport}</Badge>
						<Badge variant="default">{event.level}</Badge>
					</div>
				</div>

				<div className="space-y-2">
					<p className="m-0 flex items-start gap-1">
						<MapPin size={15}/>
						<span>{event.location_name}</span>
					</p>

					{/* {event.location_address &&
						event.location_address !== event.location_name && (
							<p className={`${styles.eventAddress} m-0`}>
								{event.location_address}
							</p>
						)} */}

					<p className="text-right m-0">
						{startDate.toLocaleString()} – {endDate.toLocaleString()}
					</p>

					{/* <p className="m-0">
						<Badge className="children:uppercase" variant={event.user_status?.status === "attending" ? "green" : "solid"}>
							{event.user_status?.status === "attending" ? t("event.attending") : t("event.notJoined")}
						</Badge>
					</p> */}

					<p className="text-right m-0">
						{t("event.slots")}: {event.attending_count}/{event.max_slots}
						<span className="mx-1 text-[var(--muted)]">·</span>
						{t("event.waiting")}: {event.waiting_count}
					</p>

				</div>

				<div className="row mt-4">
					{onJoin && (
						<Button
							variant="primary"
							size="md"
							onClick={() => onJoin(event.id)}
						>
							{t("common.join")}
						</Button>
					)}

					{onLeave && (
						<Button
							variant="secondary"
							size="md"
							onClick={() => onLeave(event.id)}
						>
							{t("common.leave")}
						</Button>
					)}

					<Link
						className="button secondary"
						to={`/events/${event.id}/edit`}
					>
						{t("common.edit")}
					</Link>

					{onDelete && (
						<Button
							variant="danger"
							size="md"
							onClick={() => onDelete(event.id)}
						>
							{t("common.delete")}
						</Button>
					)}
				</div>
			</div>
		</article>
	);
}
