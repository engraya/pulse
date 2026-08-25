"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTransactions, fetchLive } from "@/lib/data/api";
import {
  filterTransactions,
  computeKpis,
  revenueSeries,
  bookingsByRoute,
  providerSplit,
  dailyKpis,
} from "@/lib/data/aggregate";
import { rangeForDays, previousRange, isRangeDays, type RangeDays } from "@/lib/filters";
import type { Transaction } from "@/lib/data/types";
import { FilterBar } from "./FilterBar";
import { KpiCards } from "./KpiCards";
import { LiveTransactions } from "./LiveTransactions";
import { LiveBadge } from "./LiveBadge";
import { Panel, AreaChart, DonutChart, BarChart } from "@engraya/sonar";
import { PROVIDER_LABEL } from "@/lib/data/types";
import { PROVIDER_COLOR } from "@/lib/charts/palette";
import { formatKobo, formatKoboCompact } from "@/lib/format";

const MAX_LIVE = 3000;

export function Dashboard() {
  const [days, setDays] = useState<RangeDays>(30);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [liveTxns, setLiveTxns] = useState<Transaction[]>([]);
  const sinceRef = useRef<number>(0);

  // Hydrate filters from the URL once on mount, then keep the URL in sync.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = Number(params.get("days"));
    if (isRangeDays(d)) setDays(d);
    const r = params.get("route");
    if (r) setRouteId(r);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    if (routeId) params.set("route", routeId);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [days, routeId]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["transactions", days],
    queryFn: () => fetchTransactions(days),
  });

  // Poll the live endpoint while enabled, accumulating the burst of new txns.
  useEffect(() => {
    if (!live || !data) return;
    sinceRef.current = data.to;
    let cancelled = false;
    const id = setInterval(async () => {
      try {
        const res = await fetchLive(sinceRef.current);
        if (cancelled) return;
        sinceRef.current = res.now;
        if (res.transactions.length) {
          setLiveTxns((prev) => {
            const next = prev.concat(res.transactions);
            return next.length > MAX_LIVE ? next.slice(next.length - MAX_LIVE) : next;
          });
        }
      } catch {
        /* transient poll failure — try again next tick */
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [live, data]);

  const view = useMemo(() => {
    if (!data) return null;
    const all = liveTxns.length ? data.transactions.concat(liveTxns) : data.transactions;
    const now = liveTxns.length ? Math.max(data.to, liveTxns[liveTxns.length - 1]!.createdAt) : data.to;
    const range = rangeForDays(days, now);
    const prev = previousRange(range);

    const current = filterTransactions(all, { range, routeId });
    const previous = filterTransactions(all, { range: prev, routeId });
    // Route bars ignore the active route so you can still switch between routes.
    const allRoutesInRange = filterTransactions(all, { range, routeId: null });

    const series = revenueSeries(current, range);
    const providers = providerSplit(current);
    const routeRows = bookingsByRoute(allRoutesInRange);

    return {
      kpis: computeKpis(current, previous, range, routeId),
      daily: dailyKpis(current, range, routeId),
      // Shaped for Sonar's generic chart props.
      area: series.map((b) => ({ x: new Date(b.t), y: b.revenueKobo })),
      donut: providers.map((s) => ({
        label: PROVIDER_LABEL[s.provider],
        value: s.revenueKobo,
        color: PROVIDER_COLOR[s.provider],
      })),
      routes: routeRows.map((r) => ({ id: r.routeId, label: r.name, value: r.revenueKobo })),
      feed: [...current].sort((a, b) => b.createdAt - a.createdAt),
    };
  }, [data, liveTxns, days, routeId]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-fg sm:text-2xl">Pulse</h1>
            <LiveBadge active={live && !!data} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Intercity transport &amp; payments analytics — revenue, bookings and provider mix in real time.
          </p>
        </div>
      </header>

      {isLoading ? (
        <LoadingState />
      ) : isError || !data || !view ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="space-y-4">
          <FilterBar
            days={days}
            onDaysChange={setDays}
            routeId={routeId}
            onRouteChange={setRouteId}
            routes={data.routes}
            live={live}
            onLiveChange={setLive}
          />

          <KpiCards kpis={view.kpis} daily={view.daily} />

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              title="Gross revenue"
              subtitle="Successful payments per day"
              className="lg:col-span-2"
            >
              <AreaChart
                data={view.area}
                valueFormat={formatKoboCompact}
                xLabel="Date"
                yLabel="Revenue"
                caption="Daily gross revenue"
              />
            </Panel>

            <Panel title="Payment provider mix" subtitle="Share of successful revenue">
              <DonutChart data={view.donut} valueFormat={formatKobo} caption="Revenue share by payment provider" />
            </Panel>

            <Panel
              title="Top routes"
              subtitle="Click a route to filter the dashboard"
              className="lg:col-span-3"
            >
              <BarChart
                data={view.routes}
                activeId={routeId}
                onSelect={setRouteId}
                valueFormat={formatKoboCompact}
                emptyMessage="No bookings in this window."
              />
            </Panel>

            <Panel
              title="Live transactions"
              subtitle={`${view.feed.length.toLocaleString()} in range`}
              className="lg:col-span-3"
            >
              <LiveTransactions transactions={view.feed} />
            </Panel>
          </div>
        </div>
      )}
    </main>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-9 w-full max-w-md animate-pulse rounded-fathom bg-surface" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-fathom bg-surface" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-fathom bg-surface lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-fathom bg-surface" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-fathom border border-border bg-surface p-8 text-center">
      <p className="text-sm text-fg">Couldn&apos;t load analytics data.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-fathom bg-primary px-4 py-2 text-sm font-medium text-[var(--fathom-primary-fg)]"
      >
        Retry
      </button>
    </div>
  );
}
