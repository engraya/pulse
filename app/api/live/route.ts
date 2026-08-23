import { NextResponse } from "next/server";
import { generateLive } from "@/lib/data/generator";

// Emits the burst of transactions that "happened" since the client last polled.
// The client passes its last-seen timestamp; we synthesize plausible activity in
// (since, now]. Poll this on an interval to animate the dashboard in real time.
export const dynamic = "force-dynamic";

const MAX_LOOKBACK = 30_000;

export function GET(request: Request) {
  const url = new URL(request.url);
  const now = Date.now();
  const sinceParam = Number(url.searchParams.get("since"));
  const since =
    Number.isFinite(sinceParam) && sinceParam > now - MAX_LOOKBACK
      ? sinceParam
      : now - 4000;
  const transactions = generateLive(since, now, 40);
  return NextResponse.json({ now, transactions });
}
