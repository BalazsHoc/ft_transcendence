import { useTranslation } from "react-i18next";
import {
  DEFAULT_AVATAR_SRC,
  resolveMediaUrl,
} from "../../utils/media";

type ClubMemberSpotlightProps = {
  name: string;
  subtitle: string;
  quote: string;
  avatarUrl?: string;
};

export function ClubMemberSpotlight({
  name,
  subtitle,
  quote,
  avatarUrl,
}: ClubMemberSpotlightProps) {
  const { t } = useTranslation();
  const src = resolveMediaUrl(avatarUrl, DEFAULT_AVATAR_SRC);

  return (
    <section className="rounded-3xl border border-[var(--surface-border)] bg-[var(--bg)] p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        {t("club.spotlight.title")}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <img
          src={src}
          alt={name}
          className="h-11 w-11 rounded-full border border-[var(--surface-border)] object-cover"
          onError={(e: any) => {
            e.currentTarget.src = DEFAULT_AVATAR_SRC;
          }}
        />
        <div>
          <p className="font-medium text-[var(--text)]">{name}</p>
          <p className="text-xs text-[var(--muted)]">{subtitle}</p>
        </div>
      </div>

      <p className="mt-4 border-l-2 border-[var(--surface-border)] pl-4 text-sm leading-relaxed text-[var(--muted)]">
        {quote}
      </p>
    </section>
  );
}
