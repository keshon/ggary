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

## 2. Combobox (implemented; verification checkpoint below)

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


## Combobox checkpoint (2026-10-12)

Dialog/Select pilot hosted CI passed on run 38245764464. Combobox now uses Bits UI
for input navigation, highlighting, selection and floating layers. Removed
createComboboxMachine, attachComboboxSource, attachPopover and manual highlighted
scroll wiring from this Svelte adapter. GGary retains ranked filtering, abortable
remote search, creation, selected-label retention, chips, binding callbacks and
canonical named submission inputs. Internal prefixed keys preserve empty-string
public values and keep the create option distinct from real item keys.

Remote results are ignored after abort, closure, disabling or query changes.
Creation is guarded against reset, disable and unmount. The input keeps its
committed label on blur; multiple choices clear the search and keep the list open.
The docs page marks Bits ownership and exposes Dialog, form/reset and creation
examples. Its specimen grid now allows room for the editor and preview padding.

Focused checks passed: 26 Combobox conformance cases; four adapter edge-case tests
(stale remote answers, creation after reset, retained remote labels, empty keys
and dynamic owner updates); three Node SSR cases across the pilot; four actual
Chromium pilot cases including nested Combobox, binding, submission/reset and
layered Escape. Full fast-suite and final type/theme/build checks follow.
Next batch: the overlay family, starting with Popover and Tooltip.


Final Combobox local gates passed: 102 fast test files, 2,776 passed / nine
existing skips; four Chromium pilot tests; TypeScript/Svelte zero diagnostics;
theme checks; docs production build; React inventory/CSS audit with no inventory
drift. Shared theme CSS is 372,457 bytes / 44,196 gzip; structure is 80,355 /
10,808 gzip. Existing React act warnings remain. Live docs checks exercised local
filtering, keyboard selection, multiple chips and the Dialog composition.


## Popover and Tooltip checkpoint (2026-10-12)

Combobox hosted CI passed. Svelte Popover and Tooltip now use Bits UI root,
trigger, floating content and portal primitives. Removed their core interaction
machines and attachPopover wiring. Preserve bind:open, placement, callback reasons,
close controls and dismissal flags. Public Popover remains a non-modal dialog;
Tooltip remains non-interactive descriptive content. GGary owns their anatomy,
theme inheritance and CSS geometry aliases.

Popover content mounts only while open, allowing Bits' normal focus lifecycle.
In the real browser initial focus reaches its first control and closing returns
to the opener. jsdom only asserts contained focus because it cannot measure
visibility. Tooltip preserves explicit closeDelay through a small cancelable
policy timer; pointer-corridor callbacks cannot close a newly keyboard-focused
tip. Timers are canceled on unmount and disabling. Each Tooltip currently has its
own Bits provider; cross-tooltip warm starts are not shared. Explicit delays and
keyboard-focus behavior are covered; provider grouping remains a future decision.

Popover/Tooltip demos now start closed and open through interaction. Removed
empty preview frames from Popover and marked migrated pages Built with Bits UI.
Six Chromium pilot cases passed, including Select -> Popover -> Dialog Escape
routing/focus return and Tooltip keyboard behavior. Closed SSR overlay rendering
passed. Two additional timing tests cover focus during delayed closure and unmount.

Full fast run: 2,776 passed, nine skips and one missing wrapper anatomy marker.
Added the marker; the contract plus 32 focused overlay/timing cases passed on the
final code. Existing React act warnings remain. Final type checks passed with
zero Svelte diagnostics; theme checks and the docs build passed. All six Chromium
pilot cases passed again on the final code.
Next: Menu/ContextMenu/Menubar, then the remaining confirmation composites.
