import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

import { EventItem } from "../../types/api";
import {
	DEFAULT_AVATAR_SRC,
	DEFAULT_EVENT_IMAGE_SRC,
	resolveMediaUrl,
} from "../../utils/media";

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
	const extraParticipantCount = Math.max(event.participants.length - visibleParticipants.length, 0);

	return (
		<article
			className={`${styles.eventCard} relative mb-10 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all duration-200`}
		>
			<div
				className="absolute inset-0 bg-cover bg-center"
				style={{
					backgroundImage: `url('${resolveMediaUrl(event.image, DEFAULT_EVENT_IMAGE_SRC)}')`,
				}}
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

			<div className="relative z-10 p-4">
				<Link
					to={`/events/${event.id}`}
					className="block overflow-hidden"
					aria-label={event.title}
				>
					<div className="mb-4 flex items-center justify-between gap-2">
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

					<div className="min-h-[180px]" aria-hidden="true" />
				</Link>

				<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-[18px]">
				<div className="mb-3 flex items-start justify-between gap-3">
					<h3 className="m-0 min-w-0 flex-1 text-lg font-semibold text-white">
						<Link to={`/events/${event.id}`}>{event.title}</Link>
					</h3>

					<div
						className={`${styles.badges} flex shrink-0 flex-wrap justify-end gap-2`}
					>
						<Badge className="border-white/20 bg-white/10 text-white backdrop-blur-md">
							{event.sport}
						</Badge>
						<Badge className="border-white/20 bg-white/10 text-white backdrop-blur-md">
							{event.level}
						</Badge>
					</div>
				</div>

				<div className="space-y-2">
					<p className="m-0 flex items-start gap-1 text-sm text-white/80">
						<MapPin size={15} />
						<span>{event.location_name}</span>
					</p>

					<p className="m-0 text-sm text-white/80">
						{formattedDateTime}
					</p>
					<div className="flex items-center justify-between gap-3 pt-2">
						<div className="flex items-center -space-x-2 min-w-[110px]">
							{event.participants.length > 0 ? (
								<>
									{visibleParticipants.map((participant) => (
										<img
											key={participant.id}
											src={resolveMediaUrl(participant.user.avatar, DEFAULT_AVATAR_SRC)}
											alt={participant.user.username}
											className="h-7 w-7 rounded-full border border-white/20 object-cover shadow-sm"
											onError={(imgEvent: ImageErrorEvent) => {
												imgEvent.currentTarget.src = DEFAULT_AVATAR_SRC;
											}}
										/>
									))}
									{extraParticipantCount > 0 && (
										<div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-slate-800 text-[10px] font-semibold text-white shadow-sm">
											+{extraParticipantCount}
										</div>
									)}
								</>
							) : null}
						</div>

						<span className="text-xs text-white/70">
							{event.participants.length} {t("event.participants")}
						</span>
					</div>
				</div>
				</div>
			</div>
		</article>
	);
}
