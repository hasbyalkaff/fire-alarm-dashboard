---
target: fire-alarm dashboard system
total_score: 33
p0_count: 0
p1_count: 1
timestamp: 2026-07-13T03-59-12Z
slug: fire-alarm-dashboard-system
---
# Design Critique — Fire Alarm Monitoring Dashboard

Method: dual-agent (A: design review · B: detector + deterministic evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Connection pill, StaleNote, reconnecting banner, sr-only live region, skeletons all present. |
| 2 | Match System / Real World | 4 | Plain-language device names; raw registers quarantined to a "Reference only" section. |
| 3 | User Control and Freedom | 3 | Dialog doesn't trap Tab focus; no page-size/jump control on paginated lists. |
| 4 | Consistency and Standards | 3 | Two table implementations (ARIA-div grid vs real `<table>`); type scale runs one step small; em-dash in copy. |
| 5 | Error Prevention | 3 | Deactivate confirm is good; login/user forms don't move focus to the error. |
| 6 | Recognition Rather Than Recall | 4 | Icon+label+glyph everywhere, breadcrumbs, URL-synced filters. |
| 7 | Flexibility and Efficiency | 3 | Density toggle + URL sort shipped; spec'd column-visibility toolbar + page-size control absent. |
| 8 | Aesthetic and Minimalist | 4 | Calm resting state, disciplined color/motion budget. |
| 9 | Error Recovery | 3 | Retry states + inline amber errors; messages generic, focus not moved to first error. |
| 10 | Help and Documentation | 2 | No inline help/tooltips (e.g. severity meanings); relies on labels alone. |
| **Total** | | **33/40** | **Good (upper band)** |

## Anti-Patterns Verdict

**Not AI-generated.** A user fluent in Linear/Stripe/Notion would trust this. Reserved four-color status model, cool-slate neutrals, tight `e1` shadows (not ghost-card), 8/12px radii only, one icon family at stroke 1.75, no gradient text, no decorative backgrounds.

**Deterministic scan** (`detect.mjs --json app components`, exit 2): **1 finding, 0 real after sanity-check.** The lone hit — `side-tab` at `status-tile.tsx:52` (`border-l-4`) — is a confirmed FALSE POSITIVE: the 4px left border is transparent at rest and only takes a tokenized status color when active (the documented StatusTile signature). Grep evidence corroborates a clean build: `transition-all` 0×; z-index all on the standard scale (no `z-[999]`); every `rounded-[…]` resolves to a token, max radius 12px; hardcoded hex only in `layout.tsx` `themeColor` metadata (2×, not rendered markup). ARIA attributes confirmed present: `aria-sort`, `role="table/row"`, `aria-live` (4 spots), global `:focus-visible`.

**No browser overlay:** no dev server or browser-automation tool was exposed this session (fallback: static source review only). Dark-theme status-chip contrast is claimed AA in the spec but should be verified with a live tool at ship.

Where the detector caught what the review quantified: 52 off-4px-grid half-step spacing utilities (`py-2.5`, `gap-1.5`, `mt-0.5`, …). The design system §5 permits a 2px sub-step for *optical* micro-adjustments only; the `py-2.5` (10px) on Users table cells (6×) is structural, not optical.

## What's Working

1. **Status-system fidelity is exemplary** (status-icon.tsx:18-23, status-badge.tsx:16-28): four distinct silhouettes + text label + color, never color alone, from one source. Fully grayscale-operable — dead-on the North Star.
2. **The accessible solid-alarm token is correctly applied** to the two highest-stakes numbers — nav count badge (app-shell.tsx:161) and bell badge (app-shell.tsx:247) use `--status-alarm-solid` (#DC2626, white, 4.83:1), not the coral hue. Exactly the §3.1/§12 fix.
3. **Signature StatusTile behavior is right** (status-tile.tsx:44-56, globals.css:121-130): 4px transparent left border reserved at rest (no layout shift), colored + tinted + one-shot pulse when active, disabled under reduced-motion. Calm-to-loud-and-back honored.
4. **Strong SR support**: sr-only polite live region mirrors summary counts even when no toast fires (summary-tiles.tsx:26-30).

## Priority Issues

**[P1] Monitoring tables are fake tables; `role="row"` on the anchor clobbers link semantics.** DataTable renders ARIA roles on `<div>`/`<a>` (data-table.tsx:254 puts `role="row"` directly on the navigating `<Link>`), so a screen reader announces the row as a row, not a navigable link; columnheaders carry no association; and Users uses a real `<table>` whose `<th>` lack `scope="col"` (users-view.tsx:67-72). UI Spec §11.2/§9.3 promise "real `<table>` semantics with scoped headers." *Fix:* keep the row as `role="row"` on a container, expose a real in-tree link for navigation, and add `scope="col"` to Users. → `$impeccable polish` / `harden`

**[P2] Dialog doesn't trap focus.** The custom Dialog moves and restores focus but has no Tab-containment loop (dialog.tsx:23-34); a keyboard user tabbing out of "Deactivate user?" can act on the page behind it. Description isn't linked via `aria-describedby`. Spec §8 lists dialogs as focus-trapped. *Fix:* trap Tab within the panel; wire `aria-describedby`. → `$impeccable harden`

**[P2] FilterBar never collapses to a "Filters" sheet on mobile.** It only `flex-wrap`s (filter-bar.tsx:41). Spec §11 and §7.7/§7.10 explicitly promise a "Filters" sheet below `md`. On a phone, Events stacks 5 full-width controls and pushes the timeline far below the fold — the opposite of glanceable. *Fix:* collapse filters behind a "Filters" button + active-count below `md`. → `$impeccable adapt`

**[P3] Pagination has no page-size selector or page jump, and prev/next are <44px.** Only 36px prev/next buttons (pagination.tsx:26-31). The whole density/virtualization story targets the 20,000-device technician, who can't change page size or jump across 400 pages. *Fix:* add URL-synced page-size (50/100/200), bump touch height to 44px. → `$impeccable adapt`

**[P3] Type scale runs ~one step under the documented scale.** h1 is 24px (page-header.tsx:13) vs spec 28px; CardTitle 16px vs spec 18px; StatusTile number 36px (status-tile.tsx:63) vs spec `display` 40px. Shrinking the top of the hierarchy flattens the "glanceable first" contrast. *Fix:* map to 28/18/40 or amend the spec. → `$impeccable typeset`

**[P3] Em-dash in UI copy.** StaleNote reads "Live updates paused — data may be delayed" (stale-note.tsx:23); Design System §13 bans em-dashes in UI copy. *Fix:* "Live updates paused. Data may be delayed." → `$impeccable clarify`

## Persona Red Flags

**Alex (power user):** Can't set page size or jump on a 400-page device list; the spec'd DataTableToolbar with column-visibility (UI Spec §6.2) was never built; sort is single-column only. Density toggle + URL-synced sort are real wins.

**Sam (accessibility):** Two blockers — fake-table markup with `role="row"` on anchors (primary navigation not announced as a link; cells not tied to headers) and the Dialog leaking Tab focus. Otherwise strong: skip link, global focus ring, `aria-hidden` on decorative icons, `aria-label` on icon buttons, labeled `StatusDot role="img"`.

**Casey (mobile):** The missing Filters sheet is the main friction (Events buries content under 5 stacked filters). Pagination prev/next are 36px, under the 44px minimum. Card-list collapse and the icon-only connection pill in the TopBar are well done.

## Minor Observations

- TopBar uses `bg-surface/95 backdrop-blur` (app-shell.tsx:181) — a frosted sticky header against the anti-glassmorphism rule (§2). At 95% it's borderline; make it opaque.
- Login doesn't move focus to the error on failure (login-form.tsx:82) — announced via `aria-live`, but §12 asks for focus-to-first-error.
- Events date inputs are 36px (events-view.tsx:65,70) while the rest of the FilterBar is 40px (spec §5 default).
- `Skeleton` `animate-pulse` is infinite but covered by the reduced-motion blanket (globals.css:130) — fine.

## Questions to Consider

1. If "real `<table>` semantics with scoped headers" is the spec's own promise, why do monitoring tables render as ARIA-role `<div>`s while only Users uses a real `<table>` — which is the source of truth?
2. Density + virtualization are justified by "20,000 devices," yet pagination is prev/next only — does the build serve that technician, or just the demo dataset?
3. The design system bans glassmorphism, but the always-visible TopBar uses `backdrop-blur` — deliberate exception worth documenting, or slop that slipped the guardrail?
