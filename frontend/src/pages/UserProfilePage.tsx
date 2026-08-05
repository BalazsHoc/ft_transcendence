import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, MessageCircle, UserPlus, X } from "lucide-react";

import { getPublicUser } from "../api/usersApi";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
} from "../api/friendsApi";
import type { FriendshipStatus, User } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import { ProfileSideNav } from "../components/profile/ProfileSideNav";
import { ProfileHero } from "../components/profile/ProfileHero";
import { ProfileEditForm } from "../components/profile/ProfileEditForm";
import { ProfileScoreCard } from "../components/profile/ProfileScoreCard";
import { ProfileActivityTimeline } from "../components/profile/ProfileActivityTimeline";
import { ProfileAbout } from "../components/profile/ProfileAbout";
import { ProfileAchievements } from "../components/profile/ProfileAchievements";
import Button from "../components/shared/Button";

export function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: currentUser, refreshMe } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>("none");
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [friendshipBusy, setFriendshipBusy] = useState(false);
  const [friendshipError, setFriendshipError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    if (!userId) {
      setProfile(currentUser);
      setFriendshipStatus("none");
      setFriendshipId(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    getPublicUser(userId)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setFriendshipStatus(data.friendship_status || "none");
        setFriendshipId(data.friendship_id ?? null);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t("userProfile.loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, t, userId]);

  const isOwnProfile = Boolean(profile && currentUser && profile.id === currentUser.id);

  async function updateFriendship(action: "send" | "accept" | "reject") {
    if (!profile || friendshipBusy) return;
    setFriendshipBusy(true);
    setFriendshipError(null);
    try {
      if (action === "send") {
        const friendship = await sendFriendRequest(profile.id);
        setFriendshipId(friendship.id);
        setFriendshipStatus("outgoing_pending");
      } else if (friendshipId) {
        if (action === "accept") {
          await acceptFriendRequest(friendshipId);
          setFriendshipStatus("accepted");
        } else {
          await rejectFriendRequest(friendshipId);
          setFriendshipStatus("rejected");
        }
      }
    } catch (actionError) {
      setFriendshipError(
        actionError instanceof Error ? actionError.message : t("userProfile.friendshipError"),
      );
    } finally {
      setFriendshipBusy(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl px-4 py-12 text-[var(--muted)]">{t("userProfile.loading")}</main>;
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <p role="alert">{error || t("userProfile.notFound")}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>{t("userProfile.back")}</Button>
      </main>
    );
  }

  return (
    <div className="profile-page-full flex items-start">
      <ProfileSideNav />
      <div className="min-w-0 flex-1 pb-16">
        <ProfileHero
          user={profile}
          onEditClick={isOwnProfile ? () => setEditing(true) : undefined}
        />

        {!isOwnProfile && (
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 pt-5">
            {!currentUser ? (
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--button-bg)] px-5 py-2.5 text-sm font-medium text-[var(--button-text)]"
              >
                {t("userProfile.signInToConnect")}
              </Link>
            ) : friendshipStatus === "accepted" ? (
              <Link
                to={`/chats?userId=${encodeURIComponent(profile.id)}`}
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-bg)] px-5 py-2.5 text-sm font-medium text-[var(--button-text)]"
              >
                <MessageCircle size={16} aria-hidden="true" />
                {t("userProfile.message")}
              </Link>
            ) : friendshipStatus === "incoming_pending" ? (
              <>
                <Button
                  variant="primary"
                  icon={<Check size={16} aria-hidden="true" />}
                  disabled={friendshipBusy}
                  onClick={() => void updateFriendship("accept")}
                >
                  {t("userProfile.acceptRequest")}
                </Button>
                <Button
                  variant="outline"
                  icon={<X size={16} aria-hidden="true" />}
                  disabled={friendshipBusy}
                  onClick={() => void updateFriendship("reject")}
                >
                  {t("userProfile.rejectRequest")}
                </Button>
              </>
            ) : friendshipStatus === "outgoing_pending" ? (
              <Button variant="outline" disabled>{t("userProfile.requestSent")}</Button>
            ) : friendshipStatus === "blocked" ? (
              <Button variant="outline" disabled>{t("userProfile.blocked")}</Button>
            ) : (
              <Button
                variant="primary"
                icon={<UserPlus size={16} aria-hidden="true" />}
                disabled={friendshipBusy}
                onClick={() => void updateFriendship("send")}
              >
                {t("userProfile.addFriend")}
              </Button>
            )}
            {friendshipError && <p role="alert" className="text-sm text-red-600">{friendshipError}</p>}
          </div>
        )}

        {editing && isOwnProfile && (
          <ProfileEditForm
            user={currentUser}
            onSaved={async () => {
              await refreshMe();
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        )}

        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 px-4 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <ProfileScoreCard />
            <ProfileActivityTimeline />
          </div>
          <div className="space-y-6 lg:col-span-4">
            <ProfileAbout user={profile} />
            <ProfileAchievements />
          </div>
        </div>
      </div>
    </div>
  );
}
