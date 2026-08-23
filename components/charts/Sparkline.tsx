import { useMemo } from "react";
import { linearScale, buildLinePath, buildAreaPath, type Point } from "@/lib/charts/scale";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Accessible summary; the sparkline itself is decorative otherwise. */
  ariaLabel?: string;
}

export function Sparkline({
  values,
  width = 96,
  height = 28,
  color = "var(--fathom-primary)",
  ariaLabel,
}: SparklineProps) {
  const { line, area } = useMemo(() => {
    if (values.length < 2) return { line: "", area: "" };
    const max = Math.max(...values);
    const min = Math.min(...values);
    const x = linearScale([0, values.length - 1], [1, width - 1]);
    const y = linearScale([min, max], [height - 2, 2]);
    const pts: Point[] = values.map((v, i) => ({ x: x(i), y: y(v) }));
    return { line: buildLinePath(pts), area: buildAreaPath(pts, height) };
  }, [values, width, height]);

  if (!line) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={ariaLabel ? "img" : "presentation"}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <path d={area} fill={color} opacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
