"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  linearScale,
  niceTicks,
  buildLinePath,
  buildAreaPath,
  type Point,
} from "@/lib/charts/scale";
import { formatKobo, formatKoboCompact, formatNumber } from "@/lib/format";
import type { TimeBucket } from "@/lib/data/types";
import { VisuallyHidden } from "./VisuallyHidden";

const W = 760;
const H = 280;
const M = { top: 12, right: 16, bottom: 26, left: 52 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;

export function AreaChart({ data }: { data: TimeBucket[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const model = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.revenueKobo));
    const ticks = niceTicks(0, max, 4);
    const tickMax = ticks.length ? Math.max(max, ticks[ticks.length - 1]!) : max;
    const x = linearScale([0, Math.max(1, data.length - 1)], [M.left, M.left + innerW]);
    const y = linearScale([0, tickMax], [M.top + innerH, M.top]);
    const points: Point[] = data.map((d, i) => ({ x: x(i), y: y(d.revenueKobo) }));
    const total = data.reduce((s, d) => s + d.revenueKobo, 0);
    return { x, y, points, ticks, line: buildLinePath(points), area: buildAreaPath(points, M.top + innerH), total };
  }, [data]);

  const total = model.total;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || data.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const xInView = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (xInView - M.left) / innerW;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
    setHover(idx);
  }

  const hoverBucket = hover !== null ? data[hover] : undefined;
  const hoverPoint = hover !== null ? model.points[hover] : undefined;

  // Show ~6 x-axis labels regardless of range length.
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "auto" }}
        role="img"
        aria-label={`Daily gross revenue over ${data.length} days, totalling ${formatKobo(total)}.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {/* gridlines + y labels */}
        {model.ticks.map((t) => {
          const yy = model.y(t);
          return (
            <g key={t}>
              <line x1={M.left} x2={M.left + innerW} y1={yy} y2={yy} stroke="var(--pulse-grid)" strokeWidth={1} />
              <text x={M.left - 8} y={yy} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--pulse-axis)">
                {formatKoboCompact(t)}
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.t} x={model.x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--pulse-axis)">
              {format(new Date(d.t), "d MMM")}
            </text>
          ) : null
        )}

        <path d={model.area} fill="var(--fathom-primary)" opacity={0.14} />
        <path d={model.line} fill="none" stroke="var(--fathom-primary)" strokeWidth={2} strokeLinejoin="round" />

        {/* hover guide */}
        {hoverPoint ? (
          <g>
            <line x1={hoverPoint.x} x2={hoverPoint.x} y1={M.top} y2={M.top + innerH} stroke="var(--pulse-axis)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r={4} fill="var(--fathom-primary)" stroke="var(--fathom-surface)" strokeWidth={2} />
          </g>
        ) : null}
      </svg>

      {hoverBucket && hoverPoint ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-fathom border border-border bg-surface px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(hoverPoint.x / W) * 100}%`, top: 0 }}
          role="status"
        >
          <div className="font-medium text-fg">{format(new Date(hoverBucket.t), "EEE, d MMM")}</div>
          <div className="text-muted">{formatKobo(hoverBucket.revenueKobo)}</div>
          <div className="text-muted">{formatNumber(hoverBucket.bookings)} bookings</div>
        </div>
      ) : null}

      {/* Accessible data table for screen readers. */}
      <VisuallyHidden>
        <table>
          <caption>Daily gross revenue and bookings</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Revenue</th>
              <th>Bookings</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.t}>
                <td>{format(new Date(d.t), "d MMM yyyy")}</td>
                <td>{formatKobo(d.revenueKobo)}</td>
                <td>{formatNumber(d.bookings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </div>
  );
}
