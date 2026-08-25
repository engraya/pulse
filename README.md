# Pulse

A real-time **transport & payments analytics dashboard** for an intercity bus operator — gross revenue, bookings, refund rate, seat-fill and payment-provider mix, updating live. Built to demonstrate data-dense UI engineering: **hand-built, accessible SVG charts** (no charting library), client-side aggregation over ~10k transactions, and URL-synced cross-filtering.

[![CI](https://github.com/engraya/pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/engraya/pulse/actions/workflows/ci.yml)

> Part of my portfolio's flagship set, and the reference app for my own libraries: the charts, KPI tiles and filters come from my dashboard kit [`@engraya/sonar`](https://github.com/engraya/sonar), themed by my design system [`@engraya/fathom-ui`](https://www.npmjs.com/package/@engraya/fathom-ui) — one theming contract across all three.

## Why this exists

Most "dashboard" portfolio projects drop in Recharts and call it done. Pulse deliberately doesn't. The charts are drawn from scratch with SVG and a small, unit-tested scale/geometry layer, which means:

- **Every chart is accessible.** Each one exposes an `aria-label` summary and a visually-hidden data table, so a screen-reader user gets the same information as a sighted one. Enforced with `jest-axe` in CI.
- **The bundle stays small** and there's no black box — the coordinate math, tick selection and path building are all tested in isolation.
- **Interactions are first-class.** Hover a point on the revenue chart for a tooltip; click a route bar to cross-filter the entire dashboard (state lives in the URL, so views are shareable).

The domain — intercity transport payments across Paystack / Monnify / Nomba — mirrors production payments work I've done, rather than an abstract "sales" demo.

## Features

- **Five headline KPIs** (revenue, bookings, avg fare, seat-fill, refund rate), each with a sparkline and a period-over-period delta.
- **Revenue-over-time area chart** with an interactive hover guide and tooltip.
- **Payment-provider donut** showing revenue share, with hover-to-focus.
- **Top-routes bar chart** where each bar is a real button that cross-filters the dashboard.
- **Live transactions table** streaming new payments in real time, with **filtering** (status, provider) and **pagination** — and a fully responsive layout (a real `<table>` on desktop, a stacked list on mobile).
- **Date-range presets and a route filter** synced to the URL.
- **Responsive across screens** — no horizontal scroll from mobile to widescreen.
- **Light / dark theme** driven entirely by Fathom UI's CSS-variable tokens.
- **Reduced-motion aware** and keyboard-operable throughout.

## Architecture

| Concern | Approach |
| --- | --- |
| Data | Deterministic synthetic generator (seeded PRNG) behind Next.js route handlers — `/api/transactions` (historical window) and `/api/live` (the burst since your last poll). Money is in **kobo** end-to-end; Naira formatting happens only at the display edge. |
| Aggregation | Pure functions in `lib/data/aggregate.ts` (KPIs with deltas, daily buckets, route rollups, provider split) — filtered and recomputed on the client so cross-filtering is instant. |
| Charts | `lib/charts/scale.ts` holds the geometry (linear scales, nice ticks, line/area/arc path builders); the components in `components/charts/` are thin SVG renderers over it. |
| Data fetching | `@tanstack/react-query` for the historical load; a polling effect accumulates the live feed. |
| State | Filters (`days`, `route`) live in the URL via `history.replaceState`. |
| UI | Charts / KPI tiles / filters from `@engraya/sonar`; `@engraya/fathom-ui` for Badge / Switch. Tailwind maps onto the shared design tokens. |

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript (strict, `noUncheckedIndexedAccess`) · Tailwind CSS · TanStack Query · Sonar (dashboard kit) · Fathom UI (design system) · Vitest + Testing Library + jest-axe · Playwright.

> **Note:** during local development this branch links Sonar via `file:../sonar`. Once `@engraya/sonar` is published to npm, switch the dependency with `npm install @engraya/sonar@^0.2.0` so the app builds on CI/Vercel from the registry.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

No environment variables are required — the dataset is generated on the fly.

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run test        # Vitest unit + component + a11y tests
npm run test:coverage
npm run e2e         # Playwright smoke (builds + starts, then drives a browser)
```

## Testing & accessibility

- **59 unit/component tests.** The aggregation math and chart geometry are the most heavily covered — deltas, refund-rate denominators, seat-fill clamping, day-bucketing, tick selection, arc sweeps — plus the transactions table's filtering and pagination.
- **Automated a11y.** Every chart component asserts `toHaveNoViolations()` via `jest-axe`.
- **E2E smoke.** Playwright verifies the dashboard loads with data, cross-filtering updates the URL, and range presets work.

## Deployment

Deploys to Vercel with zero configuration. The API routes are marked dynamic; there is no database to provision.

## License

MIT © Ahmad Yakubu Ahmad
