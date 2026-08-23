import { clsx } from "clsx";

export function LiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "bg-success/15 text-success" : "bg-border/50 text-muted"
      )}
    >
      <span
        className={clsx(
          "inline-block h-2 w-2 rounded-full",
          active ? "animate-pulse bg-success" : "bg-muted"
        )}
        aria-hidden
      />
      {active ? "Live" : "Paused"}
    </span>
  );
}
