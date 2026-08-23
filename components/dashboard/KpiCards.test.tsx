import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { KpiCards } from "./KpiCards";
import type { Kpis } from "@/lib/data/types";
import type { DailyKpi } from "@/lib/data/aggregate";

const kpis: Kpis = {
  grossRevenueKobo: { value: 5_000_000, delta: 0.12 },
  bookings: { value: 320, delta: -0.05 },
  refundRate: { value: 0.03, delta: 0.5 },
  seatFillRate: { value: 0.62, delta: null },
  avgFareKobo: { value: 150_000, delta: 0 },
};

const daily: DailyKpi[] = Array.from({ length: 10 }, (_, i) => ({
  t: i,
  revenueKobo: i * 1000,
  bookings: i,
  refundRate: 0.02,
  seatFillRate: 0.5,
  avgFareKobo: 1000,
}));

describe("KpiCards", () => {
  it("renders all five KPIs", () => {
    render(<KpiCards kpis={kpis} daily={daily} />);
    expect(screen.getByText("Gross revenue")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.getByText("Seat fill")).toBeInTheDocument();
    expect(screen.getByText("Refund rate")).toBeInTheDocument();
    expect(screen.getByText("Avg fare")).toBeInTheDocument();
  });

  it("shows signed deltas and an em dash when there is no comparison", () => {
    render(<KpiCards kpis={kpis} daily={daily} />);
    expect(screen.getByText(/\+12\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/−5\.0%/)).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument(); // seat fill has null delta
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<KpiCards kpis={kpis} daily={daily} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
