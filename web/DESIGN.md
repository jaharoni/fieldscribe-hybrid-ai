# DESIGN.md - FieldScribe Local Clinical Intake (`fieldscribe-local`)

## 1. Overview & Purpose
- **Plan ID**: `DP-FIELDSCRIBE-LOCAL-72fac51f` (Planned at `2026-11-27T10:54:10.638363+00:00`)
- **Intent**: Privacy-first hybrid on-device PHI redaction and clinical care summary studio
- **Scroll & Stage Architecture**: `zero_scroll_paged` (Zero endless scrolling; max inner scroll ratio `<= 1.45x`).

## 2. Unique Brand Palette (Non-Repeating Lineage)
- **Canvas Ground**: `#f8f8f8`
- **Primary Accent**: `#1f6b3a`
- **Uniqueness Guarantee**: Registered in `design_lineage_uniqueness.canonical.json` with zero collision against all sibling Inception Engine surfaces and zero banned templates.

## 3. Typography Pairing
- **Display Font**: `Unbounded`
- **UI & Body Font**: `Onest`
- **Telemetry / Tabular Mono**: `IBM Plex Mono` (`font-variant-numeric: tabular-nums`)

## 4. Screen-Space Budgets (Phone-First + Desktop)
- **iPhone Safari Real Visible (`390 x 664`)**:
  - Top Header: `<= 52px` tall, max `2` horizontal clusters (`minmax(0,1fr) auto`), ellipsis guard, zero colliding center pills.
  - Controls / Filter Strip: `<= 48px` tall using `bottom_sheet` (never multi-row pill walls).
  - Bottom Navigation: `<= 56px` tall with full stage clearance (zero card occlusion).
  - Primary Content Stage: `>= 74.3%` of screen height visible immediately on Screen 1 without scrolling.
- **Desktop Studio (`1440 x 900`)**:
  - Top Header: `<= 58px` tall; Primary Workbench `>= 78.0%` of viewport height.

## 5. Elevation & Borders
- Hairline structural borders (`1px solid`), subtle layered elevation, high-contrast readable text (`>= 7:1` primary copy).

## 6. Shapes & Touch Ergonomics
- Every interactive button, chip, tab, and close trigger enforces `min-height: 44px; min-width: 44px` on touch devices (`touch-action: manipulation`).

## 7. Motion & Transitions
- Drag row: Live spring-damped motion, drag/scrub interaction, animated transitions
- Compositor-only (`transform`, `opacity`), `<= 240ms`, full `@media (prefers-reduced-motion: reduce)` support.

## 8. Plain-English Copy Law
- Warm, direct human language. Zero developer codes, zero spaced em-dashes, and zero desktop keyboard instructions (`Press /`, `Click`, `Hover`) shown on mobile touch screens.

## 9. Interactive Control & State Inventory
- `Primary Stage Interactive Controls (zero dead buttons)`
- `Slide-Over / Bottom-Sheet Settings & Filter Drawer (open, apply, reset, Escape/backdrop close)`
- `Bounded Deck / View Switcher (zero endless scroll)`
- `LocalStorage State Persistence across reloads`
