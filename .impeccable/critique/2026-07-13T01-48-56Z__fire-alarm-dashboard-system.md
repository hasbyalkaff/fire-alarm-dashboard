---
target: fire-alarm dashboard system
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-07-13T01-48-56Z
slug: fire-alarm-dashboard-system
---
# Design Critique — Fire Alarm Dashboard

Method: dual-agent (A: design review · B: detector + deterministic evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Per-surface "stale" state exists only globally, not tied to each surface's Last Update |
| 2 | Match System / Real World | 4 | Plain-language names; raw registers quarantined to a labeled section |
| 3 | User Control and Freedom | 3 | Events "Load more" not deep-linkable; no density control |
| 4 | Consistency and Standards | 2 | Error red vs amber inconsistency; icon shapes off-spec; dark: variant decoupled; no mobile card pattern |
| 5 | Error Prevention | 3 | Destructive deactivate confirmed; submit disabled while pending |
| 6 | Recognition Rather Than Recall | 3 | Headers not sortable as promised |
| 7 | Flexibility and Efficiency | 2 | No density toggle (§6.3); no column sort |
| 8 | Aesthetic and Minimalist | 4 | Genuinely calm control-room language |
| 9 | Error Recovery | 3 | Errors painted in sacred alarm red; focus doesn't move to first error |
| 10 | Help and Documentation | 2 | No contextual help (acceptable for audience) |
| Total | | 29/40 | Good |

## Anti-Patterns Verdict
Not AI-generated. Disciplined product-register work. No gradient heroes/glassmorphism/purple/warm-cream/transition-all/gradient text/oversized radii/suppressed focus. Zoom not disabled, prefers-reduced-motion honored. Token discipline real; 21 tabular-nums; aria-live wired.
Detector: exit 2, ONE finding — side-tab at status-tile.tsx:52 — false positive in intent (documented signature Status Tile affordance, no layout shift). Two real off-system micro-defects: non-tokenized chart fill #175CD3 (reports-view.tsx:143), lone rounded-[6px] (reports-view.tsx:53).
No browser overlay: no dev server / browser tool exposed this session.

## What's Working
1. Status Tile implemented exactly to intent (status-tile.tsx:52-56, globals.css:108-117): reserved gutter, no layout shift, two-count reduced-motion-aware flash.
2. Color+icon+label discipline centralized (status-badge.tsx, status-icon.tsx): four silhouettes, StatusDot role=img+aria-label, severity text tag. Legible in grayscale.
3. Realtime + i18n-safe formatting: ConnectionPill, role=status banner, role=alert toaster, Intl formatting, translate=no on registers.

## Priority Issues
[P1] Dark-mode alarm & critical badges fail WCAG AA. White on #ff6b60 ~2.8:1. NotificationBell (app-shell.tsx:231), sidebar nav badge (app-shell.tsx:151), Critical SeverityBadge (status-badge.tsx:61). Fix: darker red fill under white in dark theme; verify >=4.5:1.
[P1] Tables never collapse to mobile card list (§11). DataTable always wide grid in overflow-x-auto (data-table.tsx:64-82). Fix: below md render status-led card per row.
[P2] Error text/invalid inputs use sacred alarm red (login-form.tsx:84, field.tsx:30,35), violating §3.1/§15. Reports/Users correctly use amber. Fix: route non-alarm errors to fault/neutral token.
[P2] Theme-toggle icon decoupled from selected theme. dark: variant (app-shell.tsx:251) resolves against OS not [data-theme]. Fix: add @custom-variant dark to globals.css.
[P2] Touch targets <44px (§5). Top-bar p-2 ~32px, sm buttons/selects h-9=36px. Fix: 44px min hit area at touch breakpoints.
[P3] Live count changes not announced to SR (summary-tiles.tsx). Fix: polite live region for deltas.
[P3] Status-icon shapes/stroke off-contract (status-icon.tsx): OctagonAlert not diamond, outline not filled, strokeWidth 2 not 1.75.
[P3] 4px grid not strict (py-2.5=10, gap-1.5=6, mt-0.5=2); non-tokenized chart fill; lone rounded-[6px].

## Persona Red Flags
Alex: no density toggle (data-table.tsx:23 ROW_HEIGHT=48); non-sortable headers; Events "Load more" not deep-linkable.
Sam: dark-mode badge contrast (P1); unannounced deltas; sacred-red errors; focus not moved to first error; invalid ARIA table (Pagination inside role=table, data-table.tsx:80,108).
Casey: tables sideways-scroll not cards (P1); <44px targets (P2); ConnectionPill hidden on phone (app-shell.tsx:193); FilterBar wraps not collapses.

## Minor Observations
- At rest all five tiles identical weight; Active Alarms in center column (summary-tiles.tsx:22) while first in DOM — visual/reading-order mismatch.
- Green semi-decorative on resting tiles (status-tile.tsx:60); Users "Active: Yes" reuses normal-green.
- DataTable header not actually sticky despite §9.3.
- button.tsx:13 presses down; doc specifies up.

## Questions to Consider
1. Does "calm at rest" justify making the most important number the hardest to locate?
2. How did the primary (dark 3am) context get the least contrast scrutiny?
3. Is the design system a spec the build is measured against, or a wishlist that drifted?
