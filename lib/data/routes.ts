import type { Route } from "./types";

// A fixed catalogue of intercity routes. Popularity weights bias the generator
// so the "bookings by route" chart has a realistic long-tail shape.
export const ROUTES: Route[] = [
  { id: "lag-abj", name: "Lagos → Abuja", origin: "Lagos", destination: "Abuja", capacityPerTrip: 45 },
  { id: "lag-ibd", name: "Lagos → Ibadan", origin: "Lagos", destination: "Ibadan", capacityPerTrip: 30 },
  { id: "lag-ben", name: "Lagos → Benin", origin: "Lagos", destination: "Benin", capacityPerTrip: 45 },
  { id: "abj-kad", name: "Abuja → Kaduna", origin: "Abuja", destination: "Kaduna", capacityPerTrip: 30 },
  { id: "abj-jos", name: "Abuja → Jos", origin: "Abuja", destination: "Jos", capacityPerTrip: 30 },
  { id: "lag-enu", name: "Lagos → Enugu", origin: "Lagos", destination: "Enugu", capacityPerTrip: 45 },
  { id: "ph-abj", name: "Port Harcourt → Abuja", origin: "Port Harcourt", destination: "Abuja", capacityPerTrip: 45 },
  { id: "kan-abj", name: "Kano → Abuja", origin: "Kano", destination: "Abuja", capacityPerTrip: 45 },
  { id: "lag-akr", name: "Lagos → Akure", origin: "Lagos", destination: "Akure", capacityPerTrip: 30 },
  { id: "ibd-abj", name: "Ibadan → Abuja", origin: "Ibadan", destination: "Abuja", capacityPerTrip: 30 },
];

/** Relative popularity per route (index-aligned with ROUTES). */
export const ROUTE_WEIGHTS: number[] = [10, 8, 5, 6, 3, 5, 4, 4, 2, 3];

/** Base fare in kobo per route (index-aligned with ROUTES). */
export const ROUTE_BASE_FARE_KOBO: number[] = [
  1_800_000, 650_000, 1_200_000, 700_000, 900_000, 1_500_000, 2_000_000,
  1_900_000, 800_000, 1_400_000,
];

export function routeById(id: string): Route | undefined {
  return ROUTES.find((r) => r.id === id);
}
