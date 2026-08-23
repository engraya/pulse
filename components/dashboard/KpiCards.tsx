"use client";

import { Badge } from "@engraya/fathom-ui";
import { Sparkline } from "@/components/charts/Sparkline";
import { formatKobo, formatKoboCompact, formatNumber, formatPercent, formatDelta } from "@/lib/format";
import type { DailyKpi } from "@/lib/data/aggregate";
import type { Kpis, Metric } from "@/lib/data/types";

interface CardSpec {
  id: string;
  label: string;
  metric: Metric;
  display: string;
  series: number[];
  /** When true, a rising value is bad (e.g. refund rate). */
  invert?: boolean;
  color?: string;
}

function DeltaBadge({ metric, invert }: { metric: Metric; invert?: boolean }) {
  const { delta } = metric;
  if (delta === null) return <Badge variant="neutral">—</Badge>;
  const rising = delta > 0;
  const good = invert ? !rising : rising;
  const variant = delta === 0 ? "neutral" : good ? "success" : "danger";
  return (
    <Badge variant={variant}>
      {rising ? "▲" : delta < 0 ? "▼" : "•"} {formatDelta(delta)}
    </Badge>
  );
}

function KpiCard({ label, metric, display, series, invert, color }: CardSpec) {
  return (
    <div className="rounded-fathom border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <DeltaBadge metric={metric} invert={invert} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tabular-nums text-fg">{display}</p>
        <Sparkline values={series} color={color} ariaLabel={`${label} trend`} />
      </div>
      <p className="mt-1 text-xs text-muted">vs previous period</p>
    </div>
  );
}

export function KpiCards({ kpis, daily }: { kpis: Kpis; daily: DailyKpi[] }) {
  const cards: CardSpec[] = [
    {
      id: "revenue",
      label: "Gross revenue",
      metric: kpis.grossRevenueKobo,
      display: formatKoboCompact(kpis.grossRevenueKobo.value),
      series: daily.map((d) => d.revenueKobo),
    },
    {
      id: "bookings",
      label: "Bookings",
      metric: kpis.bookings,
      display: formatNumber(kpis.bookings.value),
      series: daily.map((d) => d.bookings),
      color: "#8b5cf6",
    },
    {
      id: "avg",
      label: "Avg fare",
      metric: kpis.avgFareKobo,
      display: formatKobo(kpis.avgFareKobo.value),
      series: daily.map((d) => d.avgFareKobo),
      color: "#0ea5e9",
    },
    {
      id: "seat",
      label: "Seat fill",
      metric: kpis.seatFillRate,
      display: formatPercent(kpis.seatFillRate.value),
      series: daily.map((d) => d.seatFillRate),
      color: "#22c55e",
    },
    {
      id: "refund",
      label: "Refund rate",
      metric: kpis.refundRate,
      display: formatPercent(kpis.refundRate.value),
      series: daily.map((d) => d.refundRate),
      invert: true,
      color: "#f43f5e",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <KpiCard key={c.id} {...c} />
      ))}
    </div>
  );
}
