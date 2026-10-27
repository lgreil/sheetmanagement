# Design audit, 27 October 2026

Branch `feature/einfach-auf-dem-handy`, run with `/impeccable audit`. I checked the code across `src/` and ran the Impeccable detector over it. I also tested 8 routes of the demo (`pnpm dev:demo`) at 375px: light and dark mode, and the "larger" text size. Code-level checks covered contrast, target sizes, accessible names, headings and overflow.

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | Many labels and date chips are 11px (`0.6875rem`), and reduced motion just turns all animation off |
| 2 | Performance | 3 | Nothing wrong in the code; not profiled |
| 3 | Theming | 3 | Colours are tokens throughout; the dark block appears twice, and a few token values are copied as literals |
| 4 | Responsive | 3 | No horizontal scroll anywhere; one overlap at the largest text size |
| 5 | Implementation Integrity | 3 | 7 stripe borders and 1 springy curve (2 hits) |
| **Total** | | **15/20** | **Good** |

## Implementation Integrity: pass

The app has a clear look of its own:

- **Look:** Barlow Condensed headings, poster-style black and gold, and calendar "stickers" with a velvet look.
- **Tokens:** almost all colours, spacing and motion come from one token set in `src/app.css`, with comments that point to the issue behind each decision.
- **Detector, 9 findings, all real:**
  - **Stripe borders (7):** 4 are coloured left edges on note boxes, a common pattern for quotes (`.last-note`, `.piece-notes`, `.answer`, `.piece-note`). The other 3 are the tell itself, on whole cards and chips: `CalendarView.svelte:571`, `PieceNotes.svelte:148` and `setup/+page.svelte:109`.
  - **Springy curve (2):** the pill in `Segmented.svelte:122` overshoots before it settles (`1.36`). It's minor, but it's the only curve in the app that breaks the "one curve everywhere" rule.

## Findings: 0 × P0, 0 × P1, 4 × P2, 2 × P3

### [P2] Portrait credit covers the chip at large text size

- **Where:** `.credit` in `src/routes/stuecke/[id]/+page.svelte:507`.
- **What happens:** at the "larger" text size, the absolutely placed "Bild: Wikimedia Commons" link sits on top of the "Ehemaligenorchester" chip in the header.
- **Also:** the link is only 19px tall at normal size, below the 24px minimum target (WCAG 2.5.8).
- **Fix:** put the credit in the normal flow under the image, or keep it clear of the chip. → `/impeccable adapt`

### [P2] 11px text is the norm for metadata

- **Where:** 20+ places use `0.6875rem`: calendar weekday and month labels, EventRow, the chronicle, a piece's sections. `Metronome.svelte:354` and `Tuner.svelte:553` go down to 10px.
- **Why it matters:** the app is phone-first for orchestra members of all ages. The "Schriftgröße" setting helps, but it only makes 11px into about 14px.
- **Fix:** use a 12px minimum for labels people actually read. → `/impeccable typeset`

### [P2] Reduced motion just switches all animation off

- **Where:** the global `0.01ms` rule in `src/app.css:284`.
- **Problem:** page changes, the opening of `<details>` sections and the tab pill lose all motion, not just the movement. Changes of state then happen with no transition.
- **Fix:** with reduced motion on, swap movement for short cross-fades instead of removing it. → `/impeccable animate`

### [P2] Stripe borders on cards and chips (3 places)

These are the 3 detector hits listed above. A full border, a tinted background or a small dot would do the same job. → `/impeccable polish`

### [P3] Tab bar labels ignore the text size setting

`min(0.6875rem, 11.5px)` in `src/routes/+layout.svelte` keeps the five labels at 11.5px at every text size. It's a deliberate choice to make them fit, but it's the one spot the setting doesn't reach.

### [P3] Token values copied as literals

- The dark-theme block in `src/app.css:75-117` is written out twice.
- The bold home page header (`src/routes/+page.svelte:240`) and the settings preview (`src/routes/einstellungen/+page.svelte:122`) repeat token values as hex literals.
- If someone changes the palette later, these copies drift. → `/impeccable polish`

## What's working well

- **Layout:** no horizontal scroll on any route tested, in light or dark, at normal or 125% text size.
- **Structure:** one `h1` per page, no skipped heading levels, and a skip link.
- **Focus and names:** every button and field has an accessible name. Every place that removes `outline` replaces it with `:focus-within` or `:focus-visible`.
- **Dragging:** the metronome weight and the practice score drawing set `touch-action: none`, capture the pointer and handle `pointercancel`. That covers the problems that usually break drag on phones.
- **Touch and contrast:**
  - `@media (pointer: coarse)` makes buttons 44px tall.
  - The status colours are documented as reaching 4.5:1 in both schemes.
  - Status messages use `aria-live` and `role="status"` (92 instances).

## Not covered

- **Performance:** not profiled (bundle size, rendering).
- **Not walked:** admin mode ("Verwaltung"), the tuner and the metronome.
- **Not tested:** the keyboard tab order and screen readers.
- **Contrast check gap:** the automated check skipped text on see-through or `oklab()` backgrounds, such as the tab bar and the header banners.
- **Demo bar:** at the largest text size it cuts off "Zurücksetzen", but it only exists in the demo.

## Recommended order

1. **[P2] `/impeccable adapt`:** fix the portrait credit overlap and its target size.
2. **[P2] `/impeccable typeset`:** raise the 11px and 10px labels to at least 12px.
3. **[P2] `/impeccable animate`:** reduced motion that cross-fades instead of switching off, and a smooth curve for Segmented.
4. **[P2] `/impeccable polish`:** replace the 3 stripe borders, write the dark tokens once and remove the copied hex values.
