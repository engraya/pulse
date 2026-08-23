"use client";

import { useMemo, useState } from "react";
import { computeArcs, arcPath } from "@/lib/charts/scale";
import { formatKobo, formatPercent, formatNumber } from "@/lib/format";
import { PROVIDER_COLOR } from "@/lib/charts/palette";
import { PROVIDER_LABEL, type ProviderSlice } from "@/lib/data/types";
import { VisuallyHidden } from "./VisuallyHidden";

const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER = 92;
const INNER = 60;

export function DonutChart({ slices }: { slices: ProviderSlice[] }) {
  const [active, setActive] = useState<number | null>(null);
  const arcs = useMemo(() => computeArcs(slices.map((s) => s.revenueKobo)), [slices]);
  const total = slices.reduce((s, x) => s + x.revenueKobo, 0);
  const focus = active !== null ? slices[active] : undefined;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-44 w-44 shrink-0"
        role="img"
        aria-label={`Revenue share by payment provider. ${slices
          .map((s) => `${PROVIDER_LABEL[s.provider]} ${formatPercent(s.pct)}`)
          .join(", ")}.`}
      >
        {arcs.map((arc, i) => {
          const slice = slices[i]!;
          const dimmed = active !== null && active !== i;
          return (
            <path
              key={slice.provider}
              d={arcPath(CX, CY, INNER, OUTER, arc.startAngle, arc.endAngle)}
              fill={PROVIDER_COLOR[slice.provider]}
              opacity={dimmed ? 0.35 : 1}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              style={{ transition: "opacity 120ms" }}
            />
          );
        })}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--fathom-fg)">
          {focus ? PROVIDER_LABEL[focus.provider] : "Total"}
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontSize={12} fill="var(--fathom-fg-muted)">
          {focus ? formatPercent(focus.pct) : formatKobo(total)}
        </text>
      </svg>

      <ul className="w-full space-y-2">
        {slices.map((s, i) => (
          <li
            key={s.provider}
            className="flex items-center justify-between gap-3 text-sm"
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
          >
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PROVIDER_COLOR[s.provider] }} />
              <span className="text-fg">{PROVIDER_LABEL[s.provider]}</span>
            </span>
            <span className="tabular-nums text-muted">
              {formatPercent(s.pct)} · {formatNumber(s.count)}
            </span>
          </li>
        ))}
      </ul>

      <VisuallyHidden>
        <table>
          <caption>Revenue share by payment provider</caption>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Revenue</th>
              <th>Share</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((s) => (
              <tr key={s.provider}>
                <td>{PROVIDER_LABEL[s.provider]}</td>
                <td>{formatKobo(s.revenueKobo)}</td>
                <td>{formatPercent(s.pct)}</td>
                <td>{formatNumber(s.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </div>
  );
}
