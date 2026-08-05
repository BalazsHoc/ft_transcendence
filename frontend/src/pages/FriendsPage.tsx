import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Check, MessageCircle, Search, UserPlus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  acceptFriendRequest,
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  type FriendshipItem,
} from "../api/friendsApi";
import { searchUsers } from "../api/usersApi";
import type { FriendshipStatus, User } from "../types/api";
import { useAuth } from "../features/auth/AuthContext";
import Button from "../components/shared/Button";

const actionLinkClasses =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--button-text)]";

function profileLabel(user: User) {
  return (
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username
  );
}

export function FriendsPage() {
  const { t } = useTranslation();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [friends, setFriends] = useState<FriendshipItem[]>([]);
  const [incoming, setIncoming] = useState<FriendshipItem[]>([]);
  const [outgoing, setOutgoing] = useState<FriendshipItem[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<number | string | null>(null);
  const [error, setError] = useState("");

  async function loadData() {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const [friendData, incomingData, outgoingData] = await Promise.all([
        getFriends(),
        getIncomingFriendRequests(),
        getOutgoingFriendRequests(),
      ]);
      setFriends(friendData);
      setIncoming(incomingData);
      setOutgoing(outgoingData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("friends.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser) void loadData();
  }, [currentUser]);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError("");
    try {
      setResults(await searchUsers(trimmedQuery));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : t("friends.searchError"));
    } finally {
      setSearching(false);
    }
  }

  async function addFriend(target: User) {
    setBusyId(target.id);
    setError("");
    try {
      await sendFriendRequest(target.id);
      setResults((current) =>
        current.map((item) =>
          item.id === target.id
            ? { ...item, friendship_status: "outgoing_pending" as FriendshipStatus }
            : item,
        ),
      );
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("friends.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function answerRequest(request: FriendshipItem, action: "accept" | "reject") {
    setBusyId(request.id);
    setError("");
    try {
      if (action === "accept") await acceptFriendRequest(request.id);
      else await rejectFriendRequest(request.id);
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("friends.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function removeExistingFriend(friendship: FriendshipItem) {
    setBusyId(friendship.id);
    setError("");
    try {
      await removeFriend(friendship.id);
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("friends.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || (!currentUser && loading)) {
    return <main className="mx-auto max-w-6xl px-4 py-12">{t("friends.loading")}</main>;
  }

  if (!currentUser) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-[var(--text)]">{t("friends.title")}</h1>
        <p>{t("friends.signIn")}</p>
        <Link to="/login" className={actionLinkClasses}>{t("nav.login")}</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2 border-b border-[var(--surface-border)] pb-6">
        <h1 className="font-display text-3xl font-bold text-[var(--text)]">{t("friends.title")}</h1>
        <p className="text-[var(--muted)]">{t("friends.description")}</p>
      </header>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <form onSubmit={submitSearch} className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          placeholder={t("friends.searchPlaceholder")}
          aria-label={t("friends.searchPlaceholder")}
          className="min-w-[240px] flex-1"
        />
        <Button type="submit" variant="primary" icon={<Search size={16} />} disabled={searching}>
          {searching ? t("friends.searching") : t("friends.search")}
        </Button>
      </form>

      {results.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-[var(--text)]">{t("friends.searchResults")}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((result) => {
              const status = result.friendship_status || "none";
              return (
                <div key={result.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-4">
                  <Link to={`/users/${result.id}`} className="font-medium text-[var(--text)] underline-offset-2 hover:underline">
                    {profileLabel(result)}
                  </Link>
                  {status === "accepted" ? (
                    <Link to={`/chats?userId=${encodeURIComponent(result.id)}`} className={actionLinkClasses}>
                      <MessageCircle size={16} /> {t("friends.message")}
                    </Link>
                  ) : status === "outgoing_pending" ? (
                    <Button variant="outline" size="sm" disabled>{t("friends.requestSent")}</Button>
                  ) : status === "incoming_pending" ? (
                    <Link to="/friends" className={actionLinkClasses}>{t("friends.respond")}</Link>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<UserPlus size={16} />}
                      disabled={busyId === result.id}
                      onClick={() => void addFriend(result)}
                    >
                      {t("friends.add")}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-[var(--text)]">{t("friends.incoming")}</h2>
        {loading ? <p>{t("friends.loading")}</p> : incoming.length === 0 ? <p className="text-[var(--muted)]">{t("friends.noIncoming")}</p> : incoming.map((request) => (
          <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-4">
            <Link to={`/users/${request.friend.id}`} className="font-medium text-[var(--text)] underline-offset-2 hover:underline">
              {profileLabel(request.friend)}
            </Link>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={<Check size={16} />} disabled={busyId === request.id} onClick={() => void answerRequest(request, "accept")}>
                {t("friends.accept")}
              </Button>
              <Button variant="outline" size="sm" icon={<X size={16} />} disabled={busyId === request.id} onClick={() => void answerRequest(request, "reject")}>
                {t("friends.reject")}
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-[var(--text)]">{t("friends.list")}</h2>
        {loading ? <p>{t("friends.loading")}</p> : friends.length === 0 ? <p className="text-[var(--muted)]">{t("friends.noFriends")}</p> : friends.map((friendship) => (
          <div key={friendship.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-4">
            <Link to={`/users/${friendship.friend.id}`} className="font-medium text-[var(--text)] underline-offset-2 hover:underline">
              {profileLabel(friendship.friend)}
            </Link>
            <div className="flex flex-wrap gap-2">
              <Link to={`/chats?userId=${encodeURIComponent(friendship.friend.id)}`} className={actionLinkClasses}>
                <MessageCircle size={16} /> {t("friends.message")}
              </Link>
              <Button variant="outline" size="sm" disabled={busyId === friendship.id} onClick={() => void removeExistingFriend(friendship)}>
                {t("friends.remove")}
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-[var(--text)]">{t("friends.outgoing")}</h2>
        {loading ? <p>{t("friends.loading")}</p> : outgoing.length === 0 ? <p className="text-[var(--muted)]">{t("friends.noOutgoing")}</p> : outgoing.map((request) => (
          <div key={request.id} className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-4">
            <Link to={`/users/${request.friend.id}`} className="font-medium text-[var(--text)] underline-offset-2 hover:underline">
              {profileLabel(request.friend)}
            </Link>
            <span className="ml-3 text-sm text-[var(--muted)]">{t("friends.requestSent")}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
