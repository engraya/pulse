"use client";

import { useMemo, useState } from "react";
import { Badge } from "@engraya/fathom-ui";
import { format } from "date-fns";
import { formatKobo } from "@/lib/format";
import {
  PROVIDERS,
  PROVIDER_LABEL,
  type Provider,
  type Transaction,
  type TxnStatus,
} from "@/lib/data/types";
import { routeById } from "@/lib/data/routes";

const STATUS_VARIANT: Record<TxnStatus, "success" | "warning" | "danger"> = {
  success: "success",
  refunded: "warning",
  failed: "danger",
};

const STATUSES: TxnStatus[] = ["success", "failed", "refunded"];
const PAGE_SIZES = [10, 15, 25, 50];

const selectClass =
  "rounded-fathom border border-border bg-surface px-2 py-1 text-xs text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fathom-ring)]";

export function LiveTransactions({ transactions }: { transactions: Transaction[] }) {
  const [status, setStatus] = useState<TxnStatus | "all">("all");
  const [provider, setProvider] = useState<Provider | "all">("all");
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (status === "all" || t.status === status) &&
          (provider === "all" || t.provider === provider)
      ),
    [transactions, status, provider]
  );

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  // Any filter change returns to the first page.
  function reset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  const showing =
    total === 0
      ? "0 results"
      : `Showing ${start + 1}–${Math.min(start + pageSize, total)} of ${total.toLocaleString()}`;

  return (
    <div>
      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          Status
          <select
            className={selectClass}
            value={status}
            onChange={(e) => reset(setStatus)(e.target.value as TxnStatus | "all")}
          >
            <option value="all">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0]!.toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          Provider
          <select
            className={selectClass}
            value={provider}
            onChange={(e) => reset(setProvider)(e.target.value as Provider | "all")}
          >
            <option value="all">All</option>
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
        <span className="ms-auto text-xs text-muted" aria-live="polite">
          {showing}
        </span>
      </div>

      {/* Desktop: table */}
      <table className="hidden w-full table-fixed text-sm sm:table">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="w-16 py-2 font-medium">Time</th>
            <th className="py-2 font-medium">Route</th>
            <th className="w-24 py-2 font-medium">Provider</th>
            <th className="w-24 py-2 font-medium">Status</th>
            <th className="w-28 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody aria-live="polite">
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-border/60">
              <td className="py-2 tabular-nums text-xs text-muted">
                {format(new Date(t.createdAt), "HH:mm:ss")}
              </td>
              <td className="truncate py-2 pr-2 text-fg">{routeById(t.routeId)?.name ?? t.routeId}</td>
              <td className="py-2 text-xs text-muted">{PROVIDER_LABEL[t.provider]}</td>
              <td className="py-2">
                <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
              </td>
              <td className="py-2 text-right tabular-nums text-fg">{formatKobo(t.amountKobo)}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-sm text-muted">
                No transactions match these filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {/* Mobile: stacked list */}
      <ul className="divide-y divide-border/60 sm:hidden">
        {rows.map((t) => (
          <li key={t.id} className="py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-fg">
                {routeById(t.routeId)?.name ?? t.routeId}
              </span>
              <span className="shrink-0 tabular-nums text-fg">{formatKobo(t.amountKobo)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-xs text-muted">
                {format(new Date(t.createdAt), "HH:mm:ss")} · {PROVIDER_LABEL[t.provider]}
              </span>
              <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted">No transactions match these filters.</li>
        ) : null}
      </ul>

      {/* Pagination */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          Rows
          <select
            className={selectClass}
            value={pageSize}
            onChange={(e) => reset(setPageSize)(Number(e.target.value))}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <PageButton onClick={() => setPage(current - 1)} disabled={current <= 1}>
            ‹ Prev
          </PageButton>
          <span className="px-2 text-xs text-muted" aria-live="polite">
            Page {current} / {pageCount}
          </span>
          <PageButton onClick={() => setPage(current + 1)} disabled={current >= pageCount}>
            Next ›
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function PageButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-fathom border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fathom-ring)]"
    >
      {children}
    </button>
  );
}
