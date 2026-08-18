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
    <article className="overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] shadow-sm">
      <img
        src={coverSrc}
        alt={group.name}
        className="h-40 w-full object-cover"
        onError={(event: { currentTarget: HTMLImageElement }) => {
          event.currentTarget.src = fallbackImage;
        }}
      />
      <div className="space-y-3 p-5">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">{group.name}</h2>
          <p className="text-sm text-[var(--muted)]">
            {t(`sports.${group.sport}`)} · {group.levels.map((level) => t(`discover.${level}`)).join(", ")}
          </p>
        </div>
        {group.description && <p className="text-sm text-[var(--text)]">{group.description}</p>}
        <p className="text-sm text-[var(--muted)]">
          {group.member_count} {t("groups.members")}
        </p>
        <Link
          to={`/groups/${group.id}`}
          className="inline-flex rounded-[var(--radius-button)] bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--button-text)]"
        >
          {t("groups.details")}
        </Link>
      </div>
    </article>
  );
}
