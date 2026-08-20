import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { EventItem } from "../../types/api";
import { DEFAULT_AVATAR_SRC, getDefaultEventImage, resolveMediaUrl } from "../../utils/media";
import { Badge } from "../shared/Badge";
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

	const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
	});

	const shortTimeFormatter = new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});

	const sameDay = startDate.toDateString() === endDate.toDateString();

	const formattedDateTime = sameDay
		? `${shortDateFormatter.format(startDate)} • ${shortTimeFormatter.format(startDate)}–${shortTimeFormatter.format(endDate)}`
		: `${shortDateFormatter.format(startDate)} • ${shortTimeFormatter.format(startDate)} – ${shortDateFormatter.format(endDate)} • ${shortTimeFormatter.format(endDate)}`;

	const visibleParticipants = event.participants.slice(0, 4);
	const extraParticipantCount = Math.max(
		event.participants.length - visibleParticipants.length,
		0,
	);

	const fallbackImage = getDefaultEventImage(event.sport);

	return (
		<article
			className={`${styles.eventCard} relative mb-10 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all duration-200`}
		>
			<div
				className={styles.backgroundImage}
				style={{
					backgroundImage: `url('${resolveMediaUrl(
						event.image,
						fallbackImage,
					)}')`,
				}}
			/>

			<div className={styles.imageOverlay} />

			<div className={styles.content}>
				<div className={styles.topBadges}>
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

					{event.group ? (
						<Link
							to={`/groups/${event.group.id}`}
							className="inline-flex"
							aria-label={t("event.groupEvent")}
						>
							<Badge variant="yellow">
								{t("event.groupEvent")}: {event.group.name}
							</Badge>
						</Link>
					) : null}
				</div>

				<Link
					to={`/events/${event.id}`}
					className={styles.imageLink}
					aria-label={event.title}
				>
					<div aria-hidden="true" />
				</Link>

				<div className={styles.infoPanel}>
					<div className={`${styles.badges} flex shrink-0 flex-wrap justify-start gap-2`}>
						<Badge className="border-white/20 bg-white/10 text-white backdrop-blur-md">
							{t(`sports.${event.sport}`)}
						</Badge>

						<Badge className="border-white/20 bg-white/10 text-white backdrop-blur-md">
							{t(`discover.${event.level}`)}
						</Badge>
					</div>
					<div className={styles.titleRow}>
						<h3 className={styles.title}>
							<Link to={`/events/${event.id}`}>
								{event.title}
							</Link>
						</h3>
					</div>

					<div className={styles.details}>
						<p className={styles.eventLocation}>
							<MapPin
								size={15}
								className="mt-0.5 shrink-0"
							/>
							<span>{event.location_name}</span>
						</p>

						<p className={styles.eventDate}>
							{formattedDateTime}
						</p>

						<div className={styles.participantsRow}>
							<div className={styles.participants}>
								{event.participants.length > 0 ? (
									<>
										{visibleParticipants.map((participant) => (
											<img
												key={participant.id}
												src={resolveMediaUrl(
													participant.user.avatar,
													DEFAULT_AVATAR_SRC,
												)}
												alt={participant.user.username}
												className={styles.avatar}
												onError={(
													imgEvent: ImageErrorEvent,
												) => {
													imgEvent.currentTarget.src =
														DEFAULT_AVATAR_SRC;
												}}
											/>
										))}

										{extraParticipantCount > 0 && (
											<div className={styles.extraParticipants}>
												+{extraParticipantCount}
											</div>
										)}
									</>
								) : null}
							</div>

							<span className={styles.participantCount}>
								{event.participants.length}{" "}
								{t("event.participants")}
							</span>
						</div>
					</div>
				</div>
			</div>
		</article>
	);
}