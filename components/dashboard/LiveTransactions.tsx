"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@engraya/fathom-ui";
import { format } from "date-fns";
import { formatKobo } from "@/lib/format";
import { PROVIDER_LABEL, type Transaction, type TxnStatus } from "@/lib/data/types";
import { routeById } from "@/lib/data/routes";

const STATUS_VARIANT: Record<TxnStatus, "success" | "warning" | "danger"> = {
  success: "success",
  refunded: "warning",
  failed: "danger",
};

const ROW_H = 44;

export function LiveTransactions({ transactions }: { transactions: Transaction[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 10,
  });

  return (
    <div>
      <div className="grid grid-cols-[5rem_1fr_6rem_5rem_7rem] gap-3 border-b border-border px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
        <span>Time</span>
        <span>Route</span>
        <span>Provider</span>
        <span>Status</span>
        <span className="text-right">Amount</span>
      </div>
      <div
        ref={parentRef}
        className="h-[360px] overflow-auto"
        role="log"
        aria-label="Live transactions feed"
        aria-live="polite"
      >
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((item) => {
            const t = transactions[item.index]!;
            return (
              <div
                key={t.id}
                className="grid grid-cols-[5rem_1fr_6rem_5rem_7rem] items-center gap-3 border-b border-border/60 px-3 text-sm"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: ROW_H,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <span className="tabular-nums text-xs text-muted">{format(new Date(t.createdAt), "HH:mm:ss")}</span>
                <span className="truncate text-fg">{routeById(t.routeId)?.name ?? t.routeId}</span>
                <span className="text-xs text-muted">{PROVIDER_LABEL[t.provider]}</span>
                <span>
                  <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
                </span>
                <span className="text-right tabular-nums text-fg">{formatKobo(t.amountKobo)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
