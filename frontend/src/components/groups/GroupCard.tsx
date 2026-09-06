import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { GroupItem } from "../../types/api";
import { getDefaultGroupImage, resolveMediaUrl } from "../../utils/media";

type GroupCardProps = {
  group: GroupItem;
};

export function GroupCard({ group }: GroupCardProps) {
  const { t } = useTranslation();
  const fallbackImage = getDefaultGroupImage(group.sport);
  const coverSrc = resolveMediaUrl(group.cover_image, fallbackImage);

  return (
    /* group card: hide overflow, round corners, look and color of border , theme background, light shadow */
    <article className="overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] shadow-sm">
      <img
        src={coverSrc}
        alt={group.name}
        /* Cover image: fixed height, full width, crop to fill without stretching */
        className="h-40 w-full object-cover"
        onError={(event: { currentTarget: HTMLImageElement }) => {
          event.currentTarget.src = fallbackImage;
        }}
      />
      {/* Content block: vertical gap between children, padding inside */}
      <div className="space-y-3 p-5">
        <div>
          {/* Title: larger text, semi-bold, theme text color */}
          <h2 className="text-xl font-semibold text-[var(--text)]">{group.name}</h2>
          {/* Meta line: small muted(gray) text (sport + levels) */}
          <p className="text-sm text-[var(--muted)]">
            {t(`sports.${group.sport}`)} · {group.levels.map((level) => t(`discover.${level}`)).join(", ")}
          </p>
        </div>
        {/* Description: small body text in theme color */}
        {group.description && <p className="text-sm text-[var(--text)]">{group.description}</p>}
        {/* Member count: small muted(gray) text */}
        <p className="text-sm text-[var(--muted)]">
          {group.member_count} {t("groups.members")}
        </p>
        <Link
          to={`/groups/${group.id}`}
          /* Button: inline flex, theme radius/colors, horizontal+vertical padding, small medium text */
          className="inline-flex rounded-[var(--radius-button)] bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--button-text)]"
        >
          {t("groups.details")}
        </Link>
      </div>
    </article>
  );
}
