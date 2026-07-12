import { useTranslation } from "react-i18next";
import { MapPin, Pencil } from "lucide-react";
import { User } from "../../types/api";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../../utils/media";
import { VIENNA_SKYLINE_IMAGE } from "../shared/backgroundImages";
import Button from "../shared/Button";

type ProfileHeroProps = {
  user: User | null;
  onEditClick: () => void;
};

export function ProfileHero({ user, onEditClick }: ProfileHeroProps) {
  const { t } = useTranslation();
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : null;
  const tags = user?.interests?.length ? user.interests : [];

  return (
    <div>
      <div className="relative h-[260px] w-full overflow-hidden rounded-b-3xl bg-[var(--surface-border)]">
        <img
          src={VIENNA_SKYLINE_IMAGE}
          alt="Cover"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-20 flex max-w-6xl flex-col items-start gap-8 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)]/95 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl md:flex-row md:items-center">
        <img
          src={resolveMediaUrl(user?.avatar, DEFAULT_AVATAR_SRC)}
          alt={`${user?.username || "User"} avatar`}
          className="h-32 w-32 shrink-0 rounded-full border-4 border-[var(--surface)] object-cover shadow-lg"
          onError={(e: any) => {
            e.currentTarget.src = DEFAULT_AVATAR_SRC;
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-[var(--text)]">
                {user?.username || t("profile.guest")}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-[var(--muted)]">
                <MapPin size={18} />
                {user?.district || t("profile.noDistrict")}
                {memberSince && <> • {t("profile.memberSince", { year: memberSince })}</>}
              </p>
            </div>

            {user && (
              <Button variant="primary" icon={<Pencil size={16} />} onClick={onEditClick}>
                {t("profile.editProfile")}
              </Button>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--bg)] px-3 py-1 text-xs font-medium text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
