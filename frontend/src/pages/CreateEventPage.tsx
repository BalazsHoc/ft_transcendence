import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EventForm } from "../components/events/EventForm";
import { createEvent, createGroupEvent, EventPayload } from "../api/eventsApi";
import { getGroup } from "../api/groupsApi";
import type { GroupItem } from "../types/api";
import { ApiLog } from "../components/shared/ApiLog";

export function CreateEventPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("groupId");
  const [group, setGroup] = useState<GroupItem | null>(null);
  const [log, setLog] = useState("");

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setLog("");
      return;
    }

    let cancelled = false;
    getGroup(groupId)
      .then((loadedGroup) => {
        if (!cancelled) setGroup(loadedGroup);
      })
      .catch((error) => {
        if (!cancelled) {
          setLog(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  async function submit(payload: EventPayload) {
    try {
      const event = groupId
        ? await createGroupEvent(groupId, payload)
        : await createEvent(payload);
      navigate(`/events/${event.id}`);
    } catch (error) {
      setLog(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <>
      <h1>
        {group
          ? t("createEvent.groupTitle", { name: group.name })
          : t("createEvent.title")}
      </h1>
      <EventForm onSubmit={submit} />
      <ApiLog log={log} />
    </>
  );
}
