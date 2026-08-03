import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Button from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-md rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className="font-display text-xl font-semibold text-[var(--text)]"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="mt-3 text-sm text-[var(--muted)]"
        >
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel || t("common.cancel")}
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            {confirmLabel || t("club.rides.leave")}
          </Button>
        </div>
      </div>
    </div>
  );
}
