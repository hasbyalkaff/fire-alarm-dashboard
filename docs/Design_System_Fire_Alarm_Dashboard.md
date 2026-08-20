# Design System

## Fire Alarm Monitoring Dashboard

| Field | Value |
|---|---|
| **Document Owner** | UI/UX Design |
| **Version** | 1.1 |
| **Last Updated** | 2026-07-13 |
| **Status** | Draft for review · reconciled with shipped implementation (see §16) |
| **Source** | `docs/PRD_Fire_Alarm_Monitoring_Dashboard.md` (v1.2), `docs/Technical_Architecture.md` (v2.0) |
| **Implements on** | Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui + Radix, TanStack Query/Virtual, Recharts |

> This document defines the visual and interaction language for the dashboard only. It does not cover the upstream Modbus Feeder Service (out of scope). Every token below is written to be dropped into a Tailwind v4 `@theme` block and shadcn/ui theme.

---

## 1. Design North Star and Principles

The PRD sets the bar: *a security guard with no technical background must understand the screen in under 5 seconds.* This is a life-safety system, so the design is judged on clarity under stress, not on flourish. Six principles follow from that.

1. **Status is the interface.** Color, icon, and label together answer one question before anything else: *is everything normal, or does something need attention right now?* Everything else is secondary.
2. **Color means one thing, everywhere.** Green = Normal, Red = Alarm, Amber = Fault, Grey = Offline. These four colors are reserved. No decorative use of red, amber, or green anywhere in the product.
3. **Interactive is never a status.** Buttons, links, tabs, and focus rings use a distinct blue that is never used for status. A guard must never wonder whether a red thing is an alarm or a button.
4. **Never rely on color alone.** Every status carries a distinct icon shape and a text label, so the screen is fully readable by a colorblind user or on a washed-out monitor. This is a hard accessibility requirement, not a nicety (WCAG 1.4.1).
5. **Calm by default, loud only for real events.** The resting state is quiet and low-contrast. Motion, sound, and saturated color are budgeted and spent only when an actual alarm or fault arrives.
6. **Glanceable first, dense on demand.** The summary breathes and reads in one look; the monitoring tables are dense and efficient for technicians who drill in. Two densities, one system.

**Design read (for the record):** a trust-first operations console for mixed users (non-technical guards plus technical staff), in a calm control-room visual language, built on a Tailwind v4 + Radix token system with IBM Plex type, where the status color model is the core of the system rather than decoration.

**Design dials** (from the anti-slop discipline, calibrated for a regulated safety product):

| Dial | Value | Why |
|---|---|---|
| Design variance | **3 / 10** | Predictable, symmetric layouts aid fast scanning and muscle memory. Surprise is a defect here. |
| Motion intensity | **2 / 10** | Motion is reserved for attention (alarm arrival) and state change. It must never compete with an emergency. |
| Visual density | **6 / 10** | Summary is airy; monitoring tables are cockpit-dense for 20,000 devices. |

---

## 2. Design Direction

**Mood:** a modern network operations center. Cool neutral surfaces, confident structure, no ornament. The screen should feel like professional safety equipment: precise, legible, and honest about state. It should be equally comfortable on a wall-mounted monitor in a guard post at 3am (dark) and on an office laptop (light).

**What this is not:** not a consumer SaaS marketing look, not warm/editorial, not glassmorphism, not gradient-driven. Those defaults are explicitly rejected for this brief.

**Dual theme, first-class.** Guard stations and 24/7 monitoring favor dark mode to reduce eye strain; offices and reports favor light. Both are designed from the start, share one token contract, and must maintain identical hierarchy and contrast. The whole page is one theme at a time; sections never invert (PRD status colors are the only sanctioned color shift).

**Signature element:** the **Status Tile** and its resting-vs-active behavior. At rest it is a quiet bordered card with a small dot and a big tabular number. When its underlying count crosses into a problem state (first active alarm, a panel dropping offline) the tile adopts the status color as a left border and tinted background, and its number ticks with a single brief flash. That controlled transition, calm to loud and back, is the thing the product is remembered by, and it directly serves the 5-second North Star.

---

## 3. Color System

Color is the highest-stakes part of this system. It is organized in three layers: **status semantics** (the reserved four), **interactive/brand**, and **neutrals**. Then a **data-viz** palette for charts, kept clear of status meaning.

### 3.1 Status semantics (the reserved colors)

This is the single source of truth. Every status surface in the product derives from this table. Color is always paired with icon and label.

| State | Meaning | Icon (shape) | Light: text | Light: fill/icon | Light: tint bg | Dark: text/icon | Dark: tint bg | Sound |
|---|---|---|---|---|---|---|---|---|
| **Normal / Online** | All good | Check in circle | `#15803D` | `#16A34A` | `#ECFDF3` | `#34D399` | `rgba(52,211,153,.12)` | none |
| **Alarm** | Fire/emergency, act now | Filled warning triangle | `#B42318` | `#DC2626` | `#FEF3F2` | `#FF6B60` | `rgba(255,107,96,.14)` | looping siren (critical) · triple-beep (high) |
| **Fault** | Device/panel malfunction | Diamond with exclamation | `#B45309` | `#D97706` | `#FEF6E7` | `#FBBF24` | `rgba(251,191,36,.14)` | soft two-tone chirp |
| **Offline / Unknown** | No communication | Slashed circle / disconnected plug | `#475467` | `#64748B` | `#F1F5F9` | `#94A6C0` | `rgba(148,166,192,.14)` | none |

Rules:
- **Red is sacred.** Red appears only for active alarms. No error text, no destructive button, no chart series may be this red. Destructive confirmations use neutral-with-warning styling, not the alarm red, so red always means fire.
- **Icon shapes are as load-bearing as color.** The four silhouettes (circle-check, warning-triangle, alert-octagon/diamond, slashed-circle) must remain visually distinct at 16px and are used consistently in tiles, badges, table cells, and toasts. The shipped set uses alert-octagon for Fault; see §7.
- **Text-on-tint pairs are pre-approved.** Status chips use `text` on `tint bg` from the same row; these pairs are chosen to pass WCAG AA. Do not invent new combinations.
- **Solid alarm fill (white text) is a separate token.** Count badges (notification bell, sidebar Alarms count) and the Critical severity badge fill *solid* with white text. The bright dark-theme alarm hue `#FF6B60` fails AA under white (~2.8:1), so these surfaces use a dedicated `--status-alarm-solid` = `#DC2626` in **both** themes (white on `#DC2626` = 4.83:1). `--status-alarm-strong` (`#DC2626` light / `#FF6B60` dark) stays the bright attention hue for status *icons* and the *alarm ring*, where only 3:1 is required.

### 3.2 Severity (within alarms and events)

Severity refines an alarm; it does not introduce new hues. It reuses the status palette plus intensity and an always-present text tag.

| Severity | Visual | Text tag |
|---|---|---|
| **Critical** | Alarm red, solid fill badge (`--status-alarm-solid`, white text, AA in both themes) | `CRITICAL` |
| **High** | Alarm red, outline badge | `HIGH` |
| **Medium** | Fault amber badge | `MEDIUM` |
| **Low / Info** | Neutral slate badge | `LOW` |

Sort order in lists is severity desc, then time desc. The most severe/newest alarm is always visually heaviest.

### 3.3 Interactive / brand (blue, never a status)

A confident azure signals "system and interaction." It is the only color used for primary actions, links, active navigation, selected states, and focus rings.

| Token | Light | Dark | Use |
|---|---|---|---|
| `brand-50` | `#EAF2FE` | `rgba(46,119,230,.12)` | selected/hover backgrounds |
| `brand-400` | `#5B9BF0` | `#5B9BF0` | link on dark, focus ring on dark |
| `brand-600` | `#175CD3` | `#2E77E6` | primary button, active nav |
| `brand-700` | `#1149A6` | `#175CD3` | pressed/hover on primary |

`brand-600` with white text passes AA. Links use `brand-700` on light, `brand-400` on dark.

### 3.4 Neutrals (cool slate)

Neutrals carry structure and text. Cool slate reinforces the control-room read and stays clear of the warm-cream AI default.

**Light**
| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F7F8FA` | app background |
| `surface` | `#FFFFFF` | cards, tables, panels |
| `surface-muted` | `#F1F5F9` | table header, inset areas |
| `border` | `#E2E8F0` | default hairlines/dividers |
| `border-strong` | `#CBD5E1` | input borders, emphasis |
| `text-primary` | `#0F172A` | headings, key values (≈16:1) |
| `text-secondary` | `#475569` | body, labels (≈7.5:1) |
| `text-tertiary` | `#64748B` | captions, placeholders (≈4.6:1, AA) |
| `text-disabled` | `#94A3B8` | disabled only, never essential text |

**Dark**
| Token | Hex | Use |
|---|---|---|
| `canvas` | `#0B1220` | app background (off-black, never `#000`) |
| `surface` | `#111A2B` | cards, tables, panels |
| `surface-muted` | `#0F1826` | table header, inset areas |
| `surface-elevated` | `#1A2537` | popovers, modals |
| `border` | `#243149` | default hairlines |
| `border-strong` | `#33425C` | input borders, emphasis |
| `text-primary` | `#E9EEF6` | headings, key values |
| `text-secondary` | `#A5B2C6` | body, labels |
| `text-tertiary` | `#7A8AA3` | captions, placeholders |

### 3.5 Data visualization palette (reports and charts)

Charts must not borrow status meaning unless the series *is* a status. For categorical trend series (per-panel counts, per-zone comparisons, time-of-day distributions) use a status-free sequence:

`#175CD3` (blue) · `#7C5CFC` (violet) · `#0E9AA0` (teal) · `#C6529B` (magenta) · `#5B6B8C` (slate)

When a chart genuinely plots status counts (alarms vs faults over time), it *may* use the status colors, but only then, and it must also label each series in text. Follow the `dataviz` skill for gridlines, tabular-num axes, and light/dark legibility when building charts.

### 3.6 Semantic token contract

Components reference semantic tokens, not raw hex, so theming stays consistent:

```
--color-bg              → canvas
--color-surface         → surface
--color-surface-muted   → surface-muted
--color-border          → border
--color-fg              → text-primary
--color-fg-muted        → text-secondary
--color-fg-subtle       → text-tertiary
--color-accent          → brand-600
--color-accent-fg       → #FFFFFF
--color-focus           → brand-600 (light) / brand-400 (dark)
--status-normal / -alarm / -fault / -offline        → §3.1
--status-alarm-solid / --status-alarm-solid-fg       → solid alarm fill + text for count / Critical badges (§3.1)
```

**Validation and error text use the fault (amber) token, never the alarm red** (§3.1, "red is sacred"). Inline field errors, form-level errors, and the login error all render in `--status-fault-fg`; destructive confirmations use neutral-with-warning styling, not alarm red.

---

## 4. Typography

**Typefaces**
- **IBM Plex Sans** for all UI text and headings. Chosen because it was drawn for enterprise and technical interfaces, stays highly legible at small sizes, has real tabular figures for counters and tables, and reads as serious industrial equipment rather than consumer marketing. It carries personality without sacrificing the clarity a safety product needs.
- **IBM Plex Mono** for machine data: timestamps, device addresses, register maps (read-only display), IDs, and any aligned numeric column where digit alignment aids scanning. The subject is an industrial Modbus system; a mono face for register/address data is grounded in that world.
- **Fallback stack:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

Self-host both with `next/font` (no external `<link>` in production) and `font-display: swap`. Preload the Plex Sans weights used above the fold.

**Type scale** (16px root, ~1.2 ratio)

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 40 / 44 | 700 | summary counters, big status numbers |
| `h1` | 28 / 34 | 600 | page title |
| `h2` | 22 / 28 | 600 | section heading |
| `h3` | 18 / 26 | 600 | card/panel heading |
| `body` | 16 / 24 | 400 | reading text, detail views |
| `ui` | 14 / 20 | 400/500 | default table and control text |
| `caption` | 12 / 16 | 500 | labels, metadata, timestamps |
| `eyebrow` | 12 / 16 | 600, `+0.04em`, uppercase | sparse section labels only |

**Rules**
- **Tabular numerals everywhere numbers are compared or updated live:** `font-variant-numeric: tabular-nums` on all counters, table numeric columns, timestamps, and the alarm badge. Live-updating numbers must not shift width.
- Display and h1 get slight negative tracking (`-0.01em`) and `text-wrap: balance`.
- Weights are limited to 400 / 500 / 600 / 700. No ultra-thin, no black.
- Eyebrow labels are rationed: at most one per few sections, and never above every card. The content usually names itself.
- Use real ellipsis `…` and curly quotes; non-breaking spaces in units and shortcuts (`10&nbsp;MB`, `⌘&nbsp;K`).

---

## 5. Spacing System

A **4px base grid**. Padding, margins, and gaps are multiples of 4. A 2px sub-step (`0.5` in Tailwind) is permitted only for optical micro-adjustments (icon-to-label gaps, hairline insets, badge nudges), never for structural layout spacing, which stays on the 4px steps below.

| Token | px | Common use |
|---|---|---|
| `space-1` | 4 | icon-to-label gap |
| `space-2` | 8 | tight control padding |
| `space-3` | 12 | input padding, chip padding |
| `space-4` | 16 | default component padding, grid gap |
| `space-5` | 20 | card padding |
| `space-6` | 24 | section gap, page gutter (desktop) |
| `space-8` | 32 | between major blocks |
| `space-10` | 40 | comfortable row height |
| `space-12` | 48 | page section spacing |
| `space-16` | 64 | summary breathing room |

**Component sizing**
- Row height: dense table **40px**, comfortable **48px** (user-selectable density).
- Control height: **36px** (compact) / **40px** (default) / **44px** (touch). Selects, search, and date inputs default to 40px; the 36px compact height is reserved for dense secondary controls.
- **Minimum interactive target: 44 x 44px** on touch. Icon-only controls in the top bar and mobile nav enforce a 44px minimum hit area (`min-h-11 min-w-11`) regardless of glyph size; pointer surfaces keep a 24px minimum hit area with adequate spacing.
- Page gutter: 24px desktop, 16px tablet, 16px mobile.

---

## 6. Layout Rules

### 6.1 App shell

```
┌───────────────────────────────────────────────────────────────┐
│ TopBar: page context · SSE status · mute · notification bell · user │  56px
├──────────┬────────────────────────────────────────────────────┤
│          │                                                      │
│ Sidebar  │  Main content (max-w for reading, fluid for tables)  │
│ nav      │                                                      │
│ 248px    │                                                      │
│ (rail 64)│                                                      │
└──────────┴────────────────────────────────────────────────────┘
```

- **Sidebar:** 248px expanded, collapsible to a 64px icon rail. Nav items show icon + label; active item uses `brand-600` accent (left indicator + tinted bg). Role-gated items are hidden when not permitted (and still enforced server-side).
- **Top bar (56px, sticky):** left = current page title / breadcrumb; right = connection status pill, mute toggle, notification bell with alarm badge, user menu. The connection status and alarm badge live here so they are visible on every screen.
- **Main:** reading/detail views constrained to `max-w-[1200px]`; monitoring tables are full-width fluid.
- **Grid:** 12-column fluid, 24px gutter, on desktop. Summary tiles use `repeat(auto-fit, minmax(200px, 1fr))`.

### 6.2 Elevation and radius

**Radius (shape lock):** documented mixed system, followed everywhere.
- Inputs, buttons, cards, tiles, tables: **8px** (`radius-md`).
- Status chips and badges: **full pill** (999px) so a status object reads as distinct.
- Modals, drawers, popovers: **12px** (`radius-lg`).

**Elevation:** subtle, tinted to the surface. Prefer borders over shadows; reserve shadow for things that truly float.
- `e0` flat: 1px `border`.
- `e1` card: `0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.10)`.
- `e2` popover/dropdown; `e3` modal (larger, softer).
- Dark mode uses lighter surfaces + border for elevation, minimal shadow.
- Active alarm surfaces use a **colored ring** (`ring-2` in alarm red), not a heavier shadow, to signal urgency.

### 6.3 Density

Two densities toggled by the user, persisted in settings: **Comfortable** (48px rows, default) and **Compact** (40px rows) for technicians scanning thousands of devices. Density changes row height and vertical padding only; type size stays constant.

---

## 7. Iconography

- **Library:** a single consistent set, one family across the whole app, standardized `stroke-width` (1.75). Never hand-draw SVG icon paths. *Shipped:* `lucide-react` at `strokeWidth={1.75}`. A migration to Phosphor/Tabler is an option, not a requirement; the binding constraint is one family, one stroke weight.
- **Status icons are fixed** (see §3.1) and never substituted. The four shipped silhouettes are circle-check (Normal), warning-triangle (Alarm), alert-octagon (Fault), and slashed-circle (Offline), chosen to stay distinct at 16px and in grayscale (WCAG 1.4.1). The "diamond with exclamation" in §3.1 is the visual intent; alert-octagon is the closest distinct silhouette in the shipped set.
- Decorative icons get `aria-hidden="true"`; icon-only buttons get an `aria-label`.
- Device-type glyphs (smoke, heat, manual call point, bell, buzzer, I/O module) have a dedicated, consistent icon each, used in device lists and detail headers to speed recognition.

---

## 8. Motion

Motion budget is deliberately small (dial 2/10). Every animation must justify itself as attention, feedback, or state transition, never decoration.

| Moment | Motion | Reduced-motion fallback |
|---|---|---|
| Hover / press | 120ms `transform`/`opacity`, `-translate-y-[1px]` on press | instant |
| Panel/menu open | 200ms ease-out, opacity + small translate | instant appear |
| Counter change | 150ms tint flash on the tile, number swaps with tabular width | instant swap, bold once |
| **New alarm arrives** | toast slides in; alarm tile/badge pulses **twice then stops** | no pulse; tile jumps straight to bold alarm state |
| Panel goes offline | row highlight-fade over 1s | static highlighted row |
| Reconnecting | non-blocking banner slides down; indeterminate bar | static banner, no bar animation |

Rules: animate only `transform` and `opacity`; never `transition: all`; all motion above trivial honors `prefers-reduced-motion`; Standard easing `cubic-bezier(0.2, 0, 0, 1)`, max duration 300ms.

**Infinite loops are banned, with one bounded exception.** No **status surface** — tile, badge, icon, row, or counter — may ever pulse indefinitely; an infinitely pulsing alarm state becomes visual noise, is impossible to look away from, and stops meaning anything. The single exception is the **Silence control** (§9.4), which may pulse for as long as a critical siren is *audibly sounding*, because it is not a status surface at all:

- It is a **transient control**, not a state display — it does not exist in the resting UI.
- Its motion is **bounded by the siren it stops**, not by the alarm. Press it and both the sound and the motion end together, while every status surface (toast, badge, red counters) stays put.
- It is the **affordance the noise is asking you to find**. Motion here shortens the path from "something is screaming" to "here is the button", which is the one moment in this product where drawing the eye is the entire job.

It honors `prefers-reduced-motion` like everything else. Any future request for an infinite animation must clear the same three tests, or it is a status surface and the ban applies.

---

## 9. Component Library

Built on shadcn/ui + Radix primitives, restyled to these tokens (never shipped in default shadcn styling). Grouped by role.

### 9.1 Status primitives (the core)
- **StatusDot** — 8px dot in status color + `aria-label` with the status text. Used inline in tables and nav.
- **StatusBadge / Chip** — pill with icon + label + status tint bg. Sizes sm/md. This is the canonical status object.
- **SeverityBadge** — §3.2 variants.
- **StatusTile** — summary card: label, big `display` tabular number, StatusDot, delta/last-update line. Resting vs active behavior per §2. This is the signature component.

### 9.2 App shell
- **Sidebar / NavItem** (icon + label, active indicator, collapsible, role-aware).
- **TopBar** with ConnectionStatusPill, MuteToggle, NotificationBell (with count badge), UserMenu.
- **PageHeader** (title, optional actions, optional last-update stamp).
- **Breadcrumb** for drill-down (Summary → Panel → Zone → Device).

### 9.3 Data display
- **DataTable** — server-paginated, virtualized above 500 rows (TanStack Virtual). Numeric columns tabular. First column is a status column (icon + label). Row click navigates via real `<a>`/`<Link>`. Below `md` it collapses to a **status-led card list** (one card per row: status leads, primary label as title, remaining columns as labelled pairs) rather than a horizontally scrolling table (§11). Table markup carries `role="table"` around header + rows only; pagination sits outside it. *Planned (not yet shipped, §16):* click-to-sort headers, the density toggle (§6.3), and a sticky header on the virtualized body.
- **FilterBar** — status, type, zone, panel, date-range, text search. Filter state is reflected in the URL query.
- **Pagination** (page size 50 default, max 200) with total count.
- **DefinitionList / KeyValue** for device detail and register mapping (read-only).
- **Timeline** for event history (reverse-chronological, grouped by day, severity-tagged).
- **StatCard / Chart** (Recharts) for reports; data-viz palette from §3.5.

### 9.4 Feedback and realtime
- **AlarmToast** — non-blocking, top-right, identifies device/zone, severity-styled, `role="alert"` / `aria-live="assertive"`. Auto-dismiss for non-critical; critical persists until acknowledged-in-view.
- **Toast (standard)** — `aria-live="polite"` for routine confirmations.
- **ReconnectingBanner** — full-width, non-blocking, appears on SSE drop; shows retry state; clears on resync.
- **AlarmSound controller** — headless; synthesized with the Web Audio API (no binary asset). **Severity-tiered:** a *critical* alarm loops an evacuation siren (rising wails alternating with the ISO 8201 / NFPA 72 Temporal-3 pattern) until an operator silences it or all alarms restore; *high* is an urgent triple-beep; *medium/low* is a soft two-tone chirp. An optional spoken announcement names the zone between siren cycles. Always paired with a visible mute control in the top bar (state persisted, announced to screen readers). Full sound design in UI Spec §8.1.
- **SilenceButton** — appears in the top bar only while the critical siren is sounding. Stops the sound; the toast, badge, and red counters all persist, so silencing acknowledges the *noise*, never the *alarm*.
- **SoundBlockedButton** — "Enable sound" control shown while the browser autoplay policy is still blocking the `AudioContext`. Fails loud, not silent: an unattended wall display must never be quietly deaf.
- **NotificationBell + Badge** — active-alarm count; badge clears to zero when all alarms restore. The count badge fills with `--status-alarm-solid` + white text for AA in both themes (§3.1).
- **LiveRegion (counts)** — a visually hidden `aria-live="polite"` region mirrors the summary counts (active alarms, active faults, panels offline) so screen-reader users hear a change (a new fault, a panel dropping offline) even when no toast fires.

### 9.5 Forms and controls
- **Button** variants: primary (`brand-600`), secondary (outline), ghost, and *destructive* (neutral surface + warning icon, never alarm red). Labels are specific ("Generate Daily Report", not "Submit"). Text never wraps at desktop.
- **Input / Select / DateRangePicker / SearchField** — label above field, helper below, error below, focus-visible ring. Correct `type`, `inputmode`, `autocomplete`.
- **Toggle / Segmented control** (density, theme, mute defaults, alarm announcement).
- **Login form** — see §10.1.

### 9.6 Universal states
Every data surface ships four states, not just the success state:
- **Loading:** skeletons matching final layout (tile shapes, table rows), never a bare spinner.
- **Empty:** composed message with next action (for example, an all-clear alarm list shows "All Normal - 0 active alarms" in green, never a blank panel; PRD AC-B3).
- **Error:** inline, in the interface voice, with a fix ("Couldn't load devices. Retry.").
- **Stale/degraded:** when SSE is disconnected or feeder data is stale, surfaces show a subtle "data may be delayed" note tied to Last Update.

---

## 10. Page-by-Page UI Plan

### 10.1 Login `(auth)/login`
Single centered card on a calm neutral canvas (no marketing hero). Product name/logo, username, password, submit ("Sign In"), inline error region (`aria-live`), and a subtle system note. Password field `autocomplete="current-password"`; submit stays enabled until request starts, then shows a spinner. No theme inversion. This is the only ungated screen.

### 10.2 Dashboard Summary `(dashboard)/` — the 5-second screen
Top row of **StatusTiles**: Panels Online, Panels Offline, Active Alarms, Active Faults, Active Devices, plus a prominent **Last Update** stamp. The Active Alarms tile is the visual anchor: green "All Normal / 0" at rest, alarm-red and pulsing-once on the first active alarm. Below: a compact **Active Alarms** preview list (top 5, severity-sorted) and an optional zone/panel status overview grid. Everything updates live via SSE with the counter tint-flash. Server-rendered first paint (Server Component) for instant readability, then client counters subscribe.

### 10.3 Panel Monitoring `(dashboard)/panels`
Grid or table of panels: name, building/location, Online/Offline StatusBadge, Last Communication (relative + absolute on hover). Offline panels sort to top and are highlighted (offline tint + slashed-circle icon). Live flip on `panel.status_changed`. Click a panel → panel detail (its zones).

### 10.4 Zone Monitoring `(dashboard)/zones`
Zone cards/rows each showing exactly one status (Normal/Alarm/Fault/Offline) with the correct color + icon + label. Filter by panel. Alarm zones surface first with the alarm ring. Click a zone → its devices (drill-down).

### 10.5 Device Monitoring `(dashboard)/devices`
The dense workhorse. Virtualized DataTable at scale (up to ~20,000 devices, server pagination, virtualization > 500 rows). Columns: status (icon+label), device label, type (with glyph), zone, panel, location, severity, last update. FilterBar (status, type, zone/panel, search) with URL-synced state. Row → Device Detail.

### 10.6 Device Detail `(dashboard)/devices/[id]`
PageHeader with device label, type glyph, and current StatusBadge. Sections: **Device Information** (KeyValue), **Current Status** (large status + last communication), **Register Mapping** (read-only, IBM Plex Mono, clearly labeled as informational), and **Alarm History** (Timeline for this device). Plain-language labels lead; raw register numbers appear only in the register section.

### 10.7 Alarm Monitoring `(dashboard)/alarms`
Live list of active alarms, severity-then-time sorted, newest/most-severe heaviest. Each row: timestamp, panel, zone, device, severity badge, status. New alarms animate in at the top (`alarm.created`). Row → Device Detail. The list is the operational heart during an incident; it stays readable under a multi-zone alarm storm (UC-10) via virtualization and stable sort.

### 10.8 Event History `(dashboard)/events`
Reverse-chronological Timeline grouped by day, with the full FilterBar (date range, panel, zone, device, severity, event type). Defaults to the recent 30-90 day window for performance; older records reachable via explicit date range. Filter state in URL for shareable/deep-linked investigations.

### 10.9 Reports `(dashboard)/reports`
Report builder: type (Daily/Monthly), period picker, preview, and export to **PDF** and **CSV**. Statistics shown as StatCards + Recharts visuals using the data-viz palette. Role-gated (Administrator, Safety Officer). Generation shows progress and a clear success/download state.

### 10.10 Admin — Users `(dashboard)/admin/users`
Administrator only. User table (username, email, role, active, last login) with create/edit/deactivate. Standard forms per §9.5. Destructive actions (deactivate) use confirmation, never immediate.

---

## 11. Responsive Behavior

Desktop-first (the primary context is a fixed monitor or office laptop), but fully usable on tablet and phone for staff on the move. Breakpoints follow Tailwind defaults: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

| Surface | ≥ lg (desktop) | md (tablet) | < md (phone) |
|---|---|---|---|
| Sidebar | expanded 248px | icon rail 64px | off-canvas drawer (hamburger) |
| Summary tiles | 5-6 across | 2-3 across | stacked 1-2 across, Active Alarms first |
| Monitoring tables | full table | fewer columns, horizontal scroll region | **card list** (one card per device with status + key fields) |
| FilterBar | inline row | wrap to 2 rows | collapsed into a "Filters" sheet |
| TopBar | full | full | connection (icon-only) + bell + mute stay visible; title truncates |

Rules: alarm state and the notification badge are visible at every breakpoint; tables never force the whole page to scroll horizontally (scroll is contained to the table); layout uses Grid/Flex, never JS measurement; full-bleed areas respect `env(safe-area-inset-*)`; `min-h-[100dvh]` for full-height areas (never `h-screen`).

---

## 12. Accessibility Rules

Target: **WCAG 2.2 AA** across both themes, plus the Web Interface Guidelines. This is a safety system, so accessibility is a functional requirement.

**Color and status**
- Never convey status by color alone: color + distinct icon shape + text label, always (WCAG 1.4.1). The product must be fully operable in grayscale and for red-green colorblind users.
- All text meets AA contrast (4.5:1 body, 3:1 large ≥ 18px/24px bold). Status text-on-tint pairs in §3.1 are pre-checked; verify final tokens with a contrast tool before ship.
- **Solid status badges carry white text only on the `--status-alarm-solid` fill (`#DC2626`, 4.83:1 in both themes), never on the lighter dark-theme alarm hue** (`#FF6B60` fails at ~2.8:1). Do not desaturate the brand or status colors in dark mode below AA.
- **Validation and error text use fault amber, never alarm red** (§3.1, §15).

**Keyboard and focus**
- Every interactive element is reachable and operable by keyboard, in logical order.
- Visible `:focus-visible` ring (`brand` color) on all interactive elements; never remove outlines without replacement.
- Use `<button>` for actions and `<a>`/`<Link>` for navigation; no `<div onClick>`. Links support Cmd/Ctrl+click and middle-click.
- Skip-to-content link; headings follow a strict `h1`-`h6` hierarchy.

**Realtime, announcements, sound**
- New critical alarm toast: `role="alert"` / `aria-live="assertive"`. Routine updates: `aria-live="polite"`.
- Connection loss/restore and mute-state changes are announced to screen readers. Live summary counts are mirrored to a polite live region (§9.4) so count changes are announced even when no toast fires.
- Audible alarm always has a visible, reachable mute control; sound is never the only alarm signal (visual + text always accompany it). Persist mute preference.
- The critical siren always has a visible, reachable **Silence** control at a 44px target while it sounds, and silencing never removes a visual signal. Where the autoplay policy blocks audio, the blocked state is **surfaced as a control**, not swallowed.
- The spoken announcement adds to the visual signal, never replaces it, and is independently toggleable for shared or open-plan rooms.

**Forms**
- Every control has a `<label>` (or `aria-label`); label is clickable via `htmlFor`.
- Correct `type` / `inputmode` / `autocomplete`; `spellcheck=false` on username/codes; never `preventDefault` on paste.
- Errors inline next to the field, focus moves to the first error on submit, messages state the fix.

**Media, motion, i18n, platform**
- Images have `width`/`height` (no layout shift) and `alt` (or `alt=""` if decorative); decorative icons `aria-hidden`.
- Honor `prefers-reduced-motion` for all non-trivial motion (§8).
- Format all dates, times, and numbers with `Intl.DateTimeFormat` / `Intl.NumberFormat`; never hardcode formats (timestamps are everywhere in this product). Wrap identifiers/register tokens with `translate="no"`.
- Set `color-scheme` on `<html>` and a matching `<meta name="theme-color">` per theme; explicit `background-color`/`color` on native `<select>` for Windows dark mode. Theme is driven by `[data-theme]` set before first paint; bind Tailwind's `dark:` variant to that attribute (`@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`) so theme-dependent utilities follow the chosen theme, not the OS preference.
- Never disable zoom (`user-scalable=no` / `maximum-scale=1` are banned); `touch-action: manipulation`; `overscroll-behavior: contain` in drawers/modals.

---

## 13. Content and Voice

Plain language, second person, active voice, sentence case for body and Title Case for headings/buttons.

- Name things as users recognize them: "Smoke Detector - Warehouse A", never "register 40002" in primary views (PRD AC-U2). Raw register data lives only in the read-only register section, clearly labeled.
- Buttons say what they do: "Generate Daily Report", "Export CSV", "Sign In". Actions keep the same name through the flow ("Export" produces an "Exported" confirmation).
- Numerals for counts ("3 active alarms"). Tabular numerals for anything live or compared.
- Empty and error states give direction, not mood: "All Normal - 0 active alarms"; "Couldn't reach the server. Reconnecting…".
- No em-dashes in UI copy; use hyphens, commas, or restructure.

---

## 14. Implementation Tokens (Tailwind v4)

Drop-in starting point for `app/globals.css`. Semantic tokens map to the palettes above; components consume the semantic layer.

```css
@import "tailwindcss";

/* Bind the `dark:` variant to [data-theme], not the OS (theme is set before paint). */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme {
  /* neutrals - light */
  --color-canvas: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F1F5F9;
  --color-border: #E2E8F0;
  --color-border-strong: #CBD5E1;
  --color-fg: #0F172A;
  --color-fg-muted: #475569;
  --color-fg-subtle: #64748B;

  /* brand / interactive */
  --color-brand-50: #EAF2FE;
  --color-brand-400: #5B9BF0;
  --color-brand-600: #175CD3;
  --color-brand-700: #1149A6;

  /* status (fills) */
  --status-normal: #16A34A;
  --status-alarm: #DC2626;
  --status-fault: #D97706;
  --status-offline: #64748B;

  /* status text-on-light */
  --status-normal-fg: #15803D;
  --status-alarm-fg: #B42318;
  --status-fault-fg: #B45309;
  --status-offline-fg: #475467;

  /* status tint bg - light */
  --status-normal-bg: #ECFDF3;
  --status-alarm-bg: #FEF3F2;
  --status-fault-bg: #FEF6E7;
  --status-offline-bg: #F1F5F9;

  /* solid alarm fill for white-text count / Critical badges (AA in both themes) */
  --status-alarm-solid: #DC2626;
  --status-alarm-solid-fg: #FFFFFF;

  /* type */
  --font-sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* radius */
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;

  /* motion */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

:root { color-scheme: light; }

[data-theme="dark"] {
  color-scheme: dark;
  --color-canvas: #0B1220;
  --color-surface: #111A2B;
  --color-surface-muted: #0F1826;
  --color-border: #243149;
  --color-border-strong: #33425C;
  --color-fg: #E9EEF6;
  --color-fg-muted: #A5B2C6;
  --color-fg-subtle: #7A8AA3;

  --status-normal-fg: #34D399;
  --status-alarm-fg: #FF6B60;
  --status-fault-fg: #FBBF24;
  --status-offline-fg: #94A6C0;

  --status-normal-bg: rgba(52,211,153,.12);
  --status-alarm-bg: rgba(255,107,96,.14);
  --status-fault-bg: rgba(251,191,36,.14);
  --status-offline-bg: rgba(148,166,192,.14);

  /* darker fill so white badge text keeps AA on dark surfaces (coral fails at 2.8:1) */
  --status-alarm-solid: #DC2626;
  --status-alarm-solid-fg: #FFFFFF;

  --color-brand-600: #2E77E6;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

> The shipped `app/globals.css` additionally defines per-status `-icon` and `-strong` variants (bright attention hues for status icons and the alarm ring) alongside these tokens, and mirrors the full status set under `:root[data-theme="dark"]`.

---

## 15. Design Do / Don't (anti-slop guardrails)

**Do**
- Keep the resting screen calm; spend color, motion, and sound only on real events.
- Pair every status with icon + label; verify contrast in both themes.
- Use tabular numerals for all live/compared numbers.
- Reflect filter/tab/pagination state in the URL.
- Ship loading, empty, error, and stale states for every data surface.

**Don't**
- Use red, amber, or green for anything that is not a status.
- Use the alarm red for destructive buttons or error text.
- Rely on color alone, or on an infinitely pulsing alarm **status** animation (see §8 for the one bounded exception: the Silence control while a siren sounds).
- Put raw register/hex numbers in primary monitoring views.
- Reach for warm-cream + serif, gradient heroes, glassmorphism, or AI-purple accents; this is a control room, not a marketing page.
- Disable zoom, remove focus outlines, or hardcode date/number formats.

---

## 16. Changelog and Implementation Status

### v1.1 — 2026-07-13 (reconciliation with shipped build)

Following a design critique (`.impeccable/critique/2026-07-13T01-48-56Z__fire-alarm-dashboard-system.md`, scored 29/40), this spec was reconciled with the shipped implementation so it reads as the source of truth, not a wishlist. Changes above:

- **New token `--status-alarm-solid` / `-fg`** (§3.1, §3.2, §3.6, §12, §14): accessible solid-red fill (white text, 4.83:1 in both themes) for count badges and the Critical severity badge, fixing a dark-theme AA failure (~2.8:1 white-on-coral) on the single most important number in the product.
- **Errors use fault amber, not alarm red** (§3.6, §12, §15): login and field validation corrected to honor "red is sacred."
- **`dark:` variant bound to `[data-theme]`** (§12, §14): theme-dependent utilities now follow the chosen theme, not the OS preference.
- **Mobile card list for tables** (§9.3, §11): DataTable collapses to a status-led card list below `md`; ARIA `role="table"` scopes header + rows only, with pagination outside it.
- **44px touch targets** (§5): codified for top-bar and mobile-nav icon controls; selects/search/date inputs default to 40px.
- **Live region for summary counts** (§9.4, §12): screen-reader users hear count deltas without a toast.
- **Iconography reconciled** (§3.1, §7): shipped `lucide-react` at stroke 1.75; four distinct silhouettes documented (alert-octagon for Fault).
- **4px grid clarified** (§5): a 2px sub-step is allowed for optical micro-adjustments only.

### v1.2 — 2026-07-13 (shipped the planned gap)

The items previously tracked as "specified but not yet shipped" are now built:

- **DataTable column sort** (§9.3) — headers are click-to-sort with `aria-sort`; the active column and direction (asc → desc → unsorted) are URL-synced, and sorting is applied **server-side** so ordering is correct across paginated pages.
- **Density toggle** (§6.3) — Comfortable (48px) / Compact (40px) is a segmented control in the UserMenu, persisted to `localStorage` and shared with every DataTable; the virtualized body re-measures on change.
- **Per-surface stale/degraded state** (§9.6) — a `StaleNote` tied to each surface's Last Update stamp appears on the Dashboard summary and the monitoring page headers when the live stream drops, in addition to the global reconnecting banner.
- **DataTable sticky header** (§9.3) — the header sticks to the top of the virtualized scroll container.
- **Deep-linkable Event History pagination** — Events now uses the shared URL-synced `Pagination` component instead of "Load more" (§9 of the UI Spec).

### v1.3 — 2026-08-20 (audible alarm, severity-tiered)

The audible alarm was a single 0.44s two-tone chirp, identical for every severity, and was being missed in the control room. Critical alarms are rare here, so a critical alarm can afford to be genuinely loud and persistent.

- **Severity-tiered alarm sound** (§3.1, §9.4; full design in UI Spec §8.1) — *critical* loops an evacuation siren (rising wails alternating with the ISO 8201 / NFPA 72 Temporal-3 pattern) until an operator silences it or all alarms restore; *high* is an urgent triple-beep; *medium/low* keep the original chirp. Still fully synthesized (Web Audio), so no binary asset was added.
- **SilenceButton** (§9.4, §12) — stops the sound only; every visual signal persists. Silencing acknowledges the noise, never the alarm.
- **SoundBlockedButton** (§9.4, §12) — surfaces the browser autoplay block as an "Enable sound" control instead of leaving an unattended display silently deaf.
- **Spoken announcement** (§9.4, §9.5, §12) — optional `speechSynthesis` utterance naming the zone between siren cycles, toggleable in the UserMenu.
- **§8 motion rule amended** — the infinite-animation ban is now scoped to *status surfaces*, with a documented, bounded carve-out for the Silence control while a siren is audibly sounding. §15 clarified to match.

---

*End of Design System - v1.3*
```
