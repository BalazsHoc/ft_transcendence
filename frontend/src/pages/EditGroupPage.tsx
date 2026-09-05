import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { GroupForm } from "../components/groups/GroupForm";
import type { GroupItem, GroupPayload } from "../types/api";
import { getGroup, updateGroup } from "../api/groupsApi";
import Button from "../components/shared/Button";
import { useNotification } from "../components/shared/NotificationProvider";

export function EditGroupPage() {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const notify = useNotification();

  useEffect(() => {
    if (!groupId) return;
    setError(null);
    setGroup(null);
    getGroup(groupId)
      .then(setGroup)
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : String(loadError)),
      );
  }, [groupId]);

  async function submit(payload: GroupPayload) {
    if (!groupId) return;
    const updated = await updateGroup(groupId, payload);
    try {
      notify(`${t("editGroup.submit")}: ${payload.name}`, "success");
    } catch {}
    navigate(`/groups/${updated.id}`);
  }

  function cancel() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(groupId ? `/groups/${groupId}` : "/groups");
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--surface-border)] pb-6">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-3xl font-bold text-[var(--text)] md:text-4xl">
            {t("editGroup.title")}
          </h1>
          <p className="max-w-xl text-sm text-[var(--muted)] md:text-base">
            {t("editGroup.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={16} aria-hidden="true" />}
          onClick={cancel}
        >
          {t("groupsTest.cancel")}
        </Button>
      </header>

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : group ? (
        <GroupForm initialGroup={group} onSubmit={submit} onCancel={cancel} />
      ) : (
        <p className="text-[var(--muted)]">{t("editGroup.loading")}</p>
      )}
    </main>
  );
}
