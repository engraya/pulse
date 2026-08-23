import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { RouteBars } from "./RouteBars";
import type { RouteRollup } from "@/lib/data/types";

const rows: RouteRollup[] = [
  { routeId: "lag-abj", name: "Lagos → Abuja", bookings: 100, revenueKobo: 5_000_000 },
  { routeId: "lag-ibd", name: "Lagos → Ibadan", bookings: 50, revenueKobo: 2_000_000 },
];

describe("RouteBars", () => {
  it("renders a button per route", () => {
    render(<RouteBars rows={rows} activeRouteId={null} onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /Lagos → Abuja/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lagos → Ibadan/ })).toBeInTheDocument();
  });

  it("selects a route on click", async () => {
    const onSelect = vi.fn();
    render(<RouteBars rows={rows} activeRouteId={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /Lagos → Abuja/ }));
    expect(onSelect).toHaveBeenCalledWith("lag-abj");
  });

  it("clears the filter when the active route is clicked again", async () => {
    const onSelect = vi.fn();
    render(<RouteBars rows={rows} activeRouteId="lag-abj" onSelect={onSelect} />);
    const active = screen.getByRole("button", { name: /Lagos → Abuja/ });
    expect(active).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(active);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("shows an empty state when there are no rows", () => {
    render(<RouteBars rows={[]} activeRouteId={null} onSelect={() => {}} />);
    expect(screen.getByText(/no bookings/i)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<RouteBars rows={rows} activeRouteId="lag-abj" onSelect={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
