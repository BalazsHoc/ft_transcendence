import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ClubStatCard, CLUB_STAT_ICONS } from "./ClubStatCard";
import {
  DEFAULT_AVATAR_SRC,
  resolveMediaUrl,
} from "../../utils/media";

type ClubStatsRowProps = {
  members: string;
  /** Middle tile — real field (kind/sport). Replaces fake club score when used for groups. */
  middleValue: string;
  middleLabel: string;
  /** Legacy club third tile */
  established?: string;
  /** Group owner avatar third tile. When `to` is provided, the whole tile links to the profile. */
  owner?: {
    name: string;
    avatarUrl?: string | null;
    /** Profile route for the owner. */
    to?: string | null;
  };
  onMembersClick?: () => void;
  membersExpanded?: boolean;
  membersListId?: string;
};

export function ClubStatsRow({
  members,
  middleValue,
  middleLabel,
  established,
  owner,
  onMembersClick,
  membersExpanded = false,
  membersListId,
}: ClubStatsRowProps) {
  const { t } = useTranslation();
  const ownerTileClassName =
    "flex items-center gap-4 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm transition-colors hover:bg-[var(--bg)]";
  const ownerTileContent = owner ? (
    <>
      <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[var(--bg)]">
        <img
          src={resolveMediaUrl(owner.avatarUrl, DEFAULT_AVATAR_SRC)}
          alt={owner.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-bold text-[var(--text)]">
          {owner.name}
        </p>
        <p className="text-xs font-medium text-[var(--muted)]">
          {t("groups.owner")}
        </p>
      </div>
    </>
  ) : null;

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-3">
      <ClubStatCard
        icon={CLUB_STAT_ICONS.members}
        value={members}
        label={t("club.stats.activeMembers")}
        onClick={onMembersClick}
        expanded={membersExpanded}
        controlsId={membersListId}
      />
      <ClubStatCard
        icon={CLUB_STAT_ICONS.score}
        value={middleValue}
        label={middleLabel}
      />
      {owner ? (
        owner.to ? (
          <Link to={owner.to} className={ownerTileClassName} aria-label={owner.name}>
            {ownerTileContent}
          </Link>
        ) : (
          <div className={ownerTileClassName}>{ownerTileContent}</div>
        )
      ) : (
        <ClubStatCard
          icon={CLUB_STAT_ICONS.established}
          value={established || "—"}
          label={t("club.stats.established")}
        />
      )}
    </section>
  );
}
