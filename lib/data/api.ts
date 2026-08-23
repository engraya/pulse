import type { Route, Transaction } from "./types";

export interface TransactionsResponse {
  generatedAt: number;
  from: number;
  to: number;
  routes: Route[];
  transactions: Transaction[];
}

export interface LiveResponse {
  now: number;
  transactions: Transaction[];
}

export async function fetchTransactions(days: number): Promise<TransactionsResponse> {
  const res = await fetch(`/api/transactions?days=${days}`);
  if (!res.ok) throw new Error(`Failed to load transactions (${res.status})`);
  return res.json();
}

export async function fetchLive(since: number): Promise<LiveResponse> {
  const res = await fetch(`/api/live?since=${since}`);
  if (!res.ok) throw new Error(`Failed to load live feed (${res.status})`);
  return res.json();
}
