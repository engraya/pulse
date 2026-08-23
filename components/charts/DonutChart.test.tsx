import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { DonutChart } from "./DonutChart";
import type { ProviderSlice } from "@/lib/data/types";

const slices: ProviderSlice[] = [
  { provider: "paystack", count: 60, revenueKobo: 6_000_000, pct: 0.6 },
  { provider: "monnify", count: 24, revenueKobo: 3_000_000, pct: 0.3 },
  { provider: "nomba", count: 14, revenueKobo: 1_000_000, pct: 0.1 },
];

describe("DonutChart", () => {
  it("exposes an accessible summary of the split", () => {
    render(<DonutChart slices={slices} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("aria-label", expect.stringContaining("Paystack 60.0%"));
  });

  it("lists each provider with its share", () => {
    render(<DonutChart slices={slices} />);
    expect(screen.getAllByText("Monnify").length).toBeGreaterThan(0);
    // percentage appears in the legend
    expect(screen.getAllByText(/30\.0%/).length).toBeGreaterThan(0);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<DonutChart slices={slices} />);
    expect(await axe(container, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
