"use client";

import { KpiTile, StatGrid } from "@engraya/sonar";
import { formatKobo, formatKoboCompact, formatNumber, formatPercent } from "@/lib/format";
import type { DailyKpi } from "@/lib/data/aggregate";
import type { Kpis } from "@/lib/data/types";

/**
 * The five headline KPIs, rendered with Sonar's KpiTile + StatGrid. Pulse owns
 * the domain math (kobo, seat-fill, refund rate); Sonar owns the presentation
 * (delta badge, sparkline, responsive grid).
 */
export function KpiCards({ kpis, daily }: { kpis: Kpis; daily: DailyKpi[] }) {
  return (
    <StatGrid min={2} sm={3} lg={5}>
      <KpiTile
        label="Gross revenue"
        value={formatKoboCompact(kpis.grossRevenueKobo.value)}
        delta={kpis.grossRevenueKobo.delta}
        sparkline={daily.map((d) => d.revenueKobo)}
      />
      <KpiTile
        label="Bookings"
        value={formatNumber(kpis.bookings.value)}
        delta={kpis.bookings.delta}
        sparkline={daily.map((d) => d.bookings)}
        sparklineColor="#8b5cf6"
      />
      <KpiTile
        label="Avg fare"
        value={formatKobo(kpis.avgFareKobo.value)}
        delta={kpis.avgFareKobo.delta}
        sparkline={daily.map((d) => d.avgFareKobo)}
        sparklineColor="#0ea5e9"
      />
      <KpiTile
        label="Seat fill"
        value={formatPercent(kpis.seatFillRate.value)}
        delta={kpis.seatFillRate.delta}
        sparkline={daily.map((d) => d.seatFillRate)}
        sparklineColor="#22c55e"
      />
      <KpiTile
        label="Refund rate"
        value={formatPercent(kpis.refundRate.value)}
        delta={kpis.refundRate.delta}
        invertDelta
        sparkline={daily.map((d) => d.refundRate)}
        sparklineColor="#f43f5e"
      />
    </StatGrid>
  );
}
