"use client";

import { clsx } from "clsx";
import { formatKoboCompact, formatNumber } from "@/lib/format";
import type { RouteRollup } from "@/lib/data/types";

interface RouteBarsProps {
  rows: RouteRollup[];
  activeRouteId: string | null;
  onSelect: (routeId: string | null) => void;
  max?: number;
}

/**
 * Horizontal bars for bookings/revenue by route. Each bar is a real button:
 * clicking cross-filters the whole dashboard to that route (click again to clear).
 * Built with DOM elements rather than SVG so labels are natively selectable and
 * the control semantics (aria-pressed) come for free.
 */
export function RouteBars({ rows, activeRouteId, onSelect, max = 8 }: RouteBarsProps) {
  const shown = rows.slice(0, max);
  const peak = Math.max(1, ...shown.map((r) => r.revenueKobo));

  if (shown.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No bookings in this window.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {shown.map((r) => {
        const isActive = activeRouteId === r.routeId;
        const width = `${Math.max(3, (r.revenueKobo / peak) * 100)}%`;
        return (
          <li key={r.routeId}>
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(isActive ? null : r.routeId)}
              className={clsx(
                "group grid w-full grid-cols-[9rem_1fr_auto] items-center gap-3 rounded-fathom px-2 py-1.5 text-left transition-colors",
                "hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fathom-ring)]",
                isActive && "bg-bg"
              )}
            >
              <span className="truncate text-xs font-medium text-fg">{r.name}</span>
              <span className="h-3 overflow-hidden rounded-full bg-border/60">
                <span
                  className={clsx(
                    "block h-full rounded-full transition-[width] duration-500",
                    isActive ? "bg-primary" : "bg-primary/70 group-hover:bg-primary"
                  )}
                  style={{ width }}
                />
              </span>
              <span className="tabular-nums text-xs text-muted">
                {formatKoboCompact(r.revenueKobo)} · {formatNumber(r.bookings)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
