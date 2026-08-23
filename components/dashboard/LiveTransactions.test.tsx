import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { LiveTransactions } from "./LiveTransactions";
import type { Transaction } from "@/lib/data/types";

const txns: Transaction[] = [
  {
    id: "a",
    createdAt: 1_700_000_000_000,
    routeId: "lag-abj",
    amountKobo: 1_800_000,
    provider: "paystack",
    channel: "card",
    status: "success",
    seats: 1,
  },
];

describe("LiveTransactions", () => {
  it("renders the column headers and a polite live region", () => {
    render(<LiveTransactions transactions={txns} />);
    expect(screen.getByText("Route")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    const log = screen.getByRole("log", { name: /live transactions/i });
    expect(log).toHaveAttribute("aria-live", "polite");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<LiveTransactions transactions={txns} />);
    expect(await axe(container, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
