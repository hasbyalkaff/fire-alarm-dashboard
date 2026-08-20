# Fire Alarm Monitoring Dashboard

A real-time, read-only web dashboard for monitoring fire alarm control panels, zones,
and devices. Built per `docs/PRD_Fire_Alarm_Monitoring_Dashboard.md`,
`docs/Technical_Architecture.md`, `docs/Design_System_Fire_Alarm_Dashboard.md`, and
`docs/UI_Specification_Fire_Alarm_Dashboard.md`.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
TanStack Query / Virtual · Recharts · Zustand · jose · Server-Sent Events.

## Getting started

```bash
npm run dev     # http://localhost:3000
npm run build   # production build (Next standalone)
npm start       # run the production server
```

### Demo accounts

All seeded users share the password `password123`:

| Username  | Role           | Can reach                              |
|-----------|----------------|----------------------------------------|
| `admin`   | Administrator  | Everything, incl. Users administration |
| `officer` | Safety Officer | All monitoring, reports, history       |
| `viewer`  | Viewer         | All monitoring and history (no reports/admin) |

## What is implemented

- **Auth**: jose-signed `HttpOnly` session cookie, `proxy.ts` optimistic redirect,
  authoritative `verifySession()` + `requireRole()` in the DAL, RBAC (401/403).
- **Live data (SSE)**: one `EventSource` mounted in the shell; auto-reconnect with a
  Reconnecting banner and REST resync; live counters, alarm toast, a live active-alarm
  badge, and a severity-tiered audible alarm (Web Audio, no asset): critical loops an
  evacuation siren until an operator hits Silence, high/medium/low are one-shot tones.
  Persisted mute, optional spoken zone announcement, and an "Enable sound" prompt when
  the browser autoplay policy is blocking audio.
- **Screens**: Login, Dashboard Summary, Panels + Panel detail, Zones + Zone detail,
  Devices + Device detail (register mapping, history), Alarms, Event History, Reports
  (stats + PDF/CSV export), Admin → Users, plus 403 / 404.
- **Scale**: server-side pagination on every list; row virtualization above 500 rows
  (TanStack Virtual); URL-synced filters/pagination.
- **Design system**: reserved status colors (green/red/amber/grey) always paired with a
  distinct icon shape + text label; blue reserved for interactive; IBM Plex; light/dark
  themes; WCAG-minded focus, live regions, reduced motion.

## Important: mock upstream (out of scope per PRD)

The upstream **Modbus Feeder Service** and shared PostgreSQL are explicitly out of scope.
To make the dashboard runnable end-to-end without hardware or a database, this build
includes a **drop-in mock** behind the same contracts:

- `lib/mock/store.ts` — in-memory domain data (panels/zones/devices/events), seeded
  deterministically. Replace with a read-only Postgres reader (`dashboard_ro`).
- `lib/realtime/feeder.ts` — a mock feeder that mutates the store and publishes the same
  SSE events a real feeder would (`alarm.created`, `alarm.restored`,
  `device.status_changed`, `panel.status_changed`, `summary.updated`). Booted once from
  `instrumentation.ts`. Replace with a PostgreSQL `LISTEN/NOTIFY` subscriber.
- The DAL (`lib/dal.ts`) is the seam: swap its data source and nothing else changes.

Other pragmatic substitutions (documented inline), to be swapped before production:

- **Password hashing** uses Node `scrypt` instead of Argon2id (no native build needed).
- **PDF export** returns a print-optimized HTML document (browser print-to-PDF) instead
  of Puppeteer/PDFKit. CSV export is fully implemented and streamed.
- **Icons** use `lucide-react` (the design system named Phosphor/Tabler; one family, easy
  to swap).

Set `SESSION_SECRET` in the environment for any non-local use.
