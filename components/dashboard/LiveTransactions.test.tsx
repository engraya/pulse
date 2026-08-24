import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { LiveTransactions } from "./LiveTransactions";
import type { Provider, Transaction, TxnStatus } from "@/lib/data/types";

const base = 1_700_000_000_000;

function make(n: number, over: (i: number) => Partial<Transaction> = () => ({})): Transaction[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    createdAt: base - i * 1000,
    routeId: "lag-abj",
    amountKobo: 1_000_000 + i,
    provider: "paystack" as Provider,
    channel: "card" as const,
    status: "success" as TxnStatus,
    seats: 1,
    ...over(i),
  }));
}

describe("LiveTransactions", () => {
  it("renders the table headers and the first page of rows", () => {
    render(<LiveTransactions transactions={make(40)} />);
    expect(screen.getByRole("columnheader", { name: "Route" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Amount" })).toBeInTheDocument();
    // 15 per page by default (desktop table rows)
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(16); // 15 + header
    expect(screen.getByText(/Showing 1–15 of 40/)).toBeInTheDocument();
  });

  it("pages forward and back", async () => {
    render(<LiveTransactions transactions={make(40)} />);
    expect(screen.getByText(/Page 1 \/ 3/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText(/Showing 16–30 of 40/)).toBeInTheDocument();
    expect(screen.getByText(/Page 2 \/ 3/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Prev/ }));
    expect(screen.getByText(/Showing 1–15 of 40/)).toBeInTheDocument();
  });

  it("disables Prev on the first page and Next on the last", async () => {
    render(<LiveTransactions transactions={make(20)} />);
    expect(screen.getByRole("button", { name: /Prev/ })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
  });

  it("filters by status and resets to page 1", async () => {
    // 30 success + 10 failed
    const txns = make(40, (i) => (i >= 30 ? { status: "failed" as TxnStatus } : {}));
    render(<LiveTransactions transactions={txns} />);
    await userEvent.click(screen.getByRole("button", { name: /Next/ })); // go to page 2
    await userEvent.selectOptions(screen.getByLabelText("Status"), "failed");
    expect(screen.getByText(/Showing 1–10 of 10/)).toBeInTheDocument();
    expect(screen.getByText(/Page 1 \/ 1/)).toBeInTheDocument();
  });

  it("filters by provider", async () => {
    const txns = make(40, (i) => (i < 12 ? { provider: "monnify" as Provider } : {}));
    render(<LiveTransactions transactions={txns} />);
    await userEvent.selectOptions(screen.getByLabelText("Provider"), "Monnify");
    expect(screen.getByText(/of 12/)).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    render(<LiveTransactions transactions={make(5)} />);
    await userEvent.selectOptions(screen.getByLabelText("Status"), "refunded");
    expect(screen.getAllByText(/No transactions match/).length).toBeGreaterThan(0);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<LiveTransactions transactions={make(20)} />);
    expect(await axe(container, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
