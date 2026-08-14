import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { GroupMembership } from "../../types/api";
import { DEFAULT_AVATAR_SRC, resolveMediaUrl } from "../../utils/media";

type GroupMembersListProps = {
  memberships: GroupMembership[];
  currentUserId?: string;
};

const ROLE_ORDER: Record<GroupMembership["role"], number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

function memberName(membership: GroupMembership) {
  return (
    [membership.user.first_name, membership.user.last_name]
      .filter(Boolean)
      .join(" ") || membership.user.username
  );
}

function roleLabel(
  role: GroupMembership["role"],
  t: (key: string) => string,
) {
  if (role === "owner") return t("groups.owner");
  if (role === "admin") return t("groups.roleAdmin");
  return t("groups.roleMember");
}

export function GroupMembersList({
  memberships,
  currentUserId,
}: GroupMembersListProps) {
  const { t } = useTranslation();
  const ordered = [...memberships].sort((left, right) => {
    const roleDelta = ROLE_ORDER[left.role] - ROLE_ORDER[right.role];
    if (roleDelta !== 0) return roleDelta;
    return left.joined_at.localeCompare(right.joined_at);
  });

  return (
    <section
      id="group-members-list"
      className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 shadow-sm md:p-6"
    >
      <h2 className="mb-4 font-display text-xl font-semibold text-[var(--text)]">
        {t("club.stats.activeMembers")}
      </h2>
      {ordered.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{t("groups.membersEmpty")}</p>
      ) : (
        <ul className="divide-y divide-[var(--surface-border)]">
          {ordered.map((membership) => {
            const name = memberName(membership);
            const to =
              currentUserId && membership.user.id === currentUserId
                ? "/profile"
                : `/users/${membership.user.id}`;
            return (
              <li key={membership.id}>
                <Link
                  to={to}
                  className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-[var(--bg)]"
                >
                  <img
                    src={resolveMediaUrl(membership.user.avatar, DEFAULT_AVATAR_SRC)}
                    alt={name}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                    onError={(event: { currentTarget: HTMLImageElement }) => {
                      event.currentTarget.src = DEFAULT_AVATAR_SRC;
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--text)]">{name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {roleLabel(membership.role, t)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
