import { useTranslation } from "react-i18next";

import Button from "./Button";

type PaginationControlsProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function PaginationControls({
  page,
  pageCount,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) {
  const { t } = useTranslation();

  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex items-center justify-center gap-3 pt-2"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {t("pagination.previous")}
      </Button>
      <span className="min-w-24 text-center text-sm text-[var(--muted)]">
        {t("pagination.pageOf", { page, pages: pageCount })}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        {t("pagination.next")}
      </Button>
    </nav>
  );
}
