import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { AreaChart } from "./AreaChart";
import type { TimeBucket } from "@/lib/data/types";

const DAY = 86_400_000;
const start = Math.floor(1_700_000_000_000 / DAY) * DAY;
const data: TimeBucket[] = Array.from({ length: 14 }, (_, i) => ({
  t: start + i * DAY,
  revenueKobo: 1_000_000 + i * 100_000,
  bookings: 10 + i,
}));

describe("AreaChart", () => {
  it("renders an accessible image summarising the total", () => {
    render(<AreaChart data={data} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("aria-label")).toMatch(/gross revenue over 14 days/i);
  });

  it("provides the underlying data as a table for assistive tech", () => {
    render(<AreaChart data={data} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    // 14 data rows + 1 header row
    expect(screen.getAllByRole("row")).toHaveLength(15);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<AreaChart data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
