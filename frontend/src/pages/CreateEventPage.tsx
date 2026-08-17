import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "../components/events/EventForm";
import { createEvent, createGroupEvent, type EventPayload } from "../api/eventsApi";
import { getGroup } from "../api/groupsApi";
import type { GroupItem } from "../types/api";
import Button from "../components/shared/Button";

export function CreateEventPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("groupId");
  const [group, setGroup] = useState<GroupItem | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoadError(null);
    getGroup(groupId)
      .then((loadedGroup) => {
        if (!cancelled) {
          setGroup(loadedGroup);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  async function submit(payload: EventPayload) {
    const event = groupId
      ? await createGroupEvent(groupId, payload)
      : await createEvent(payload);
    navigate(`/events/${event.id}`);
  }

  function cancel() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(groupId ? `/groups/${groupId}` : "/discover");
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--surface-border)] pb-6">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-3xl font-bold text-[var(--text)] md:text-4xl">
            {group
              ? t("createEvent.groupTitle", { name: group.name })
              : t("createEvent.title")}
          </h1>
          <p className="max-w-xl text-sm text-[var(--muted)] md:text-base">
            {t("createEvent.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={16} aria-hidden="true" />}
          onClick={cancel}
        >
          {t("createEvent.cancel")}
        </Button>
      </header>

      {loadError ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <EventForm onSubmit={submit} onCancel={cancel} />
      )}
    </main>
  );
}
