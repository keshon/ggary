# GGary Svelte foundation plan

Use Bits UI for standard Svelte 5 interactions. Keep GGary public APIs, visual
anatomy and styling; share pure domain logic with React. React remains on Base UI.
Leads is retired. Do not introduce a permanent legacy/backend switch.

## 1. Dialog + Select pilot

Replace the Svelte Dialog/Select interaction machines and attachDialog/
attachPopover wiring with Bits UI. Sheet follows Dialog automatically. Preserve
bind:open/value, callback reasons, form submission/reset and ConfigProvider theme
inheritance through portals. Test nested Select in Dialog with real pointer,
keyboard, focus containment, outside dismissal and inner/outer Escape.

Current implementation uses Bits UI 2.19.5 and requires Svelte >=5.33.0. Static docs previews are separate
from live overlays. Bits uses aria-activedescendant for Select and skips disabled
items; React Base UI moves DOM focus and can focus disabled items. These are
intentional foundation differences, with equivalent selection outcomes.

Bits reserves an empty string as its unselected value. The adapter encodes item
keys internally so GGary's empty-string keys still work. GGary owns one named
submission input and its existing Svelte form-error integration; Bits owns
selection, typeahead, popup positioning and dismissal. Dialog uses DOM overlays,
with GGary's method=dialog submission behavior retained by a submit handler.

Closed SSR rendering is covered by a separate Node test project. Portal-backed
open overlays are client-rendered; do not claim server-rendered dialog contents
or exhaustive hydration coverage. Existing core machines remain for unmigrated
Svelte/vanilla components, but these migrated Svelte adapters do not use them.

## 2. Combobox

Validate filtering, async/dynamic items, single/multiple values, keyboard and
form/reset before removing the old implementation. Reuse the pilot's portal,
theme and composition contracts where applicable.

## 3. Overlay family

Popover, Tooltip, Menu, ContextMenu, Menubar and confirmation/command composites.
Audit coexistence with any remaining native top-layer overlays during migration.
One behavior owner per migrated widget; remove replaced handlers immediately.

## 4. Selection and form family

Tabs, Accordion, Slider/RangeSlider, option controls and coherent field/form
integration. Decide counterpart benefit component by component. Preserve native
semantics and GGary workflow behavior where they are the appropriate owner.

## 5. Custom boundaries and release gates

Inventory all remaining Svelte components. Retain domain widgets deliberately.
Add compiled Svelte distribution and a clean installed-consumer smoke test,
including SSR/hydration and representative interactions. Run shared CSS/React
regression checks. Migration is complete only after these gates and ownership
review; a successful pilot is not completion of the whole Svelte migration.


## Pilot verification checkpoint (2026-10-12)

Three Chromium pilot tests passed: nested popup stacking/inner-outer Escape/focus
containment and return; binding updates/single named submission/reset/method=dialog;
outside dismissal and persistent-dialog close. Two Node SSR tests passed. The
131 focused contract/conformance checks passed after adapting portal-aware
lookups and cancelable pointer events. Light/dark nested menu visuals were checked
in the running docs site. Full fast-suite and production build are final gates.
The browser pilot is wired into CI alongside existing React verification.


Full fast-suite rerun passed: 101 files, 2,771 passed and nine existing skips.
Existing React act/key warnings remain; no warning-free claim is made. This
checkpoint is Dialog/Sheet + Select only. Combobox is the next implementation
batch, with the remaining Svelte behaviors still scheduled above.


Final local gates passed: TypeScript/Svelte (zero errors/warnings), theme contract
and 544 light/dark measurements, docs production build, and React inventory/CSS
audit. No React inventory drift. Shared theme CSS is 372,283 bytes / 44,190 gzip;
structure is 80,181 / 10,801 gzip. No installed Svelte consumer/release artifact
is claimed yet; that remains phase 5. Pilot browser tests are now part of hosted CI.
