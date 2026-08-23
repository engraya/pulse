import { NextResponse } from "next/server";
import { generateTransactions } from "@/lib/data/generator";
import { ROUTES } from "@/lib/data/routes";

const DAY = 86_400_000;

// Synthetic historical dataset. Deterministic per (seed, window) so repeated
// requests are stable, but the window ends at "now" so the latest day is partial
// ("today so far"), which reads as live data. In a real app this would query a
// warehouse; the shape of the response is the contract the client codes against.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const days = clamp(Number(url.searchParams.get("days")) || 60, 7, 120);
  const to = Date.now();
  const from = to - days * DAY;
  const transactions = generateTransactions({
    seed: 1337,
    from,
    to,
    baseDailyVolume: 180,
  });
  return NextResponse.json({ generatedAt: to, from, to, routes: ROUTES, transactions });
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
