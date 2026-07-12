import { CalendarDays } from "lucide-react";

export type ActivityItem = {
  id: string;
  title: string;
  time: string;
  description: string;
};

type ProfileActivityTimelineProps = {
  items?: ActivityItem[];
};

const DEFAULT_ITEMS: ActivityItem[] = [];

// No activity-feed endpoint exists yet, so this renders an empty-state by
// default. Pass `items` once the backend exposes a per-user activity log.
export function ProfileActivityTimeline({ items = DEFAULT_ITEMS }: ProfileActivityTimelineProps) {
  return (
    <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-8 shadow-sm">
      <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold text-[var(--text)]">
        <CalendarDays size={20} />
        Activity History
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No activity yet. Join an event to get started.</p>
      ) : (
        <div className="relative ml-4 space-y-8 border-l-2 border-[var(--surface-border)] pb-4">
          {items.map((item) => (
            <div key={item.id} className="relative pl-8">
              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-[var(--surface)] bg-[var(--text)]" />
              <div className="rounded-2xl border border-[var(--surface-border)] p-4 transition-shadow hover:shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <h4 className="font-medium text-[var(--text)]">{item.title}</h4>
                  <span className="shrink-0 text-xs text-[var(--muted)]">{item.time}</span>
                </div>
                <p className="text-sm text-[var(--muted)]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
