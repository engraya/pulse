import type { Provider } from "@/lib/data/types";

// Chart series colors chosen to stay legible on both light and dark surfaces.
export const PROVIDER_COLOR: Record<Provider, string> = {
  paystack: "#3b82f6", // blue
  monnify: "#14b8a6", // teal
  nomba: "#f59e0b", // amber
};

/** Ordered palette for generic categorical series (e.g. route bars). */
export const SERIES_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#f43f5e",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#a855f7",
  "#ef4444",
];
