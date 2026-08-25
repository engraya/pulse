"use client";

import { Switch } from "@engraya/fathom-ui";
import { SegmentedControl } from "@engraya/sonar";
import { RANGE_PRESETS, type RangeDays } from "@/lib/filters";
import { useTheme } from "@/lib/useTheme";
import type { Route } from "@/lib/data/types";

interface FilterBarProps {
  days: RangeDays;
  onDaysChange: (days: RangeDays) => void;
  routeId: string | null;
  onRouteChange: (routeId: string | null) => void;
  routes: Route[];
  live: boolean;
  onLiveChange: (live: boolean) => void;
}

export function FilterBar({
  days,
  onDaysChange,
  routeId,
  onRouteChange,
  routes,
  live,
  onLiveChange,
}: FilterBarProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Range presets (Sonar SegmentedControl) */}
      <SegmentedControl
        ariaLabel="Date range"
        value={String(days)}
        onChange={(v) => onDaysChange(Number(v) as RangeDays)}
        options={RANGE_PRESETS.map((p) => ({ label: p.label, value: String(p.days) }))}
      />

      {/* Route filter */}
      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="sr-only sm:not-sr-only">Route</span>
        <select
          value={routeId ?? ""}
          onChange={(e) => onRouteChange(e.target.value || null)}
          className="rounded-fathom border border-border bg-surface px-3 py-1.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fathom-ring)]"
        >
          <option value="">All routes</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      <div className="ms-auto flex items-center gap-4">
        {/* Live toggle */}
        <div className="flex items-center gap-2">
          <span id="live-label" className="text-sm text-muted">
            Live
          </span>
          <Switch aria-labelledby="live-label" checked={live} onCheckedChange={onLiveChange} />
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggle}
          className="rounded-fathom border border-border bg-surface px-2.5 py-1.5 text-sm text-fg hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fathom-ring)]"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </div>
  );
}
