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


## Menu family checkpoint (2026-10-12)

Menu, ContextMenu and Menubar now use Bits UI. Removed their interaction-machine,
connect and attachPopover wiring. Shared BitsMenuItems/BitsMenuSub render actions,
links, owner-held checkbox/radio state, labelled groups and recursive submenus.
GGary retains item data, callback details/reasons, styling/theme inheritance,
closeOnSelect, access keys, ArrowUp last-item opening and one-level Escape policy.
Bits owns roving focus, typeahead, pointer corridors, positioning and dismissal.
Portal submenu forward-navigation in Menubar is forwarded to its Bits parent;
it does not introduce a second navigation machine. Internal encoding preserves
empty-string radio and Menubar keys without colliding with Bits' closed state.

Bits skips disabled entries during arrow navigation. Menu's bind:open remains
Svelte two-way binding, rather than React's request/refusal model. ContextMenu
preserves Shift+right-click for the browser and explicitly supports ContextMenu
and Shift+F10 keys. Menu/ContextMenu/Menubar docs start closed and are interactive;
removed staged opening and synthetic mnemonic events from these pages.

Conformance tests now find portal contents and await framework effects. Fixed
the Svelte act helper to await async interactions. Full fast suite passed:
103 files, 2,783 tests, nine existing skips. After the final key-encoding and
Tooltip disposal changes, 110 focused contract/conformance/SSR/timing cases
passed; all 13 Chromium pilot cases passed, including seven menu-family cases.
Final TypeScript/Svelte checks have zero diagnostics; theme checks (544
measurements) and the production docs build passed. Real docs Menu/submenu,
ContextMenu and Menubar opening were checked visually. Existing React act
warnings remain.

Previous checkpoint CI run 38255198948 failed on Tooltip unmount cancellation.
Added a disposal guard so late Bits callbacks cannot restart the close timer or
publish after teardown; the focused timing checks pass. Hosted CI for this new
checkpoint is still a separate gate after push.

Next: migrate the internal DataGrid row and Kanban card menus, then delete
MenuContent.svelte. Those two consumers still use the old renderer; the three
public menu components do not. Follow with confirmation/command composites,
then selection/form family and the compiled installed-Svelte-consumer release
gates. The whole Svelte migration is not complete yet.


## Domain menu checkpoint (2026-10-12)

Previous menu-family hosted CI passed on run 38260278312. DataGrid GridRowMenu
and Kanban card menus now use an internal Bits-based AnchoredMenu with the
shared BitsMenuItems/BitsMenuSub renderer. Their domain controllers still own
row targeting/selection, card movement and requests. Removed createMenuMachine,
connectMenu and attachPopover menu wiring from both consumers. Deleted
MenuContent.svelte; no Svelte source references it or createMenuMachine remain.

AnchoredMenu accepts the controller's real/virtual anchor, copies theme variables,
normalizes its rectangle for Bits, opens pointer requests on the menu surface
and keyboard/button requests on the first enabled row. Closing returns focus
to the grid or the card's current DOM element after a move. Bits owns keyboard,
submenus, typeahead, positioning and dismissal; no backend switch was added.

Full fast run: 102 files passed; one newly enabled Svelte Kanban submenu test
failed because it searched whole item text including whitespace. The other
2,784 tests passed with nine existing skips. Fixed that lookup to use the named
item-text part. Final focused React/Svelte grid-row and Kanban rerun: 40 passed.
Final Chromium pilot: 15 passed, including both domain-menu workflows inside
Dialog (row identity/focus return, submenu Escape, card move and callback).
Seven SSR checks passed, including standalone Kanban and closed AnchoredMenu.
TypeScript/Svelte checks have zero diagnostics; production docs build passed.
Real Kanban menu/submenu visuals were checked in the running docs site.
Existing React act warnings remain. No full-suite rerun after the test-only
lookup correction is claimed; hosted CI remains the final whole-suite gate.

Next: confirmation and command composites (Popconfirm and CommandPalette),
then selection/form widgets and the installed-Svelte-consumer release gates.
The menu family is migrated; the complete Svelte foundation is still in progress.


## Confirmation/command composite checkpoint (2026-10-12)

Previous domain-menu hosted CI passed on run 38261759694. Popconfirm now composes
Bits Popover; CommandPalette composes Bits Dialog. Removed attachPopover and
attachDialog wiring from these Svelte components. Their shared core machines
remain deliberate workflow owners, as in React: pending confirmation/retry/errors,
ranked command filtering, hierarchical pages, abortable remote search and hotkey
policy. They are not compatibility bridges or alternative overlay backends.
Bits owns portal/modal focus, dismissal and positioning.

Preserved alertdialog naming and safe initial focus for destructive confirmation.
Palette Escape goes back one page before closing. Commands run after closure and
focus return; Ctrl+K restores the element that previously held focus. Nonmodal
palettes render in their inline host and ignore outside clicks. Shared structure
and GGarry theme rules now support Bits backdrop and inline sizing as well as
Base UI. Removed Popconfirm staged default-open/auto-confirm demos; retained the
inline palette preview but removed its fixed-height frame.

Final local verification: 28 React/Svelte conformance/anatomy checks; eight Node
SSR cases; 19 Chromium pilot tests (four new composite cases) passed. TypeScript
and Svelte checks have zero diagnostics, 544 theme measurements passed, and docs
production build passed. Real confirmation and modal/inline palette visuals were
checked in the running docs site. No full fast-suite rerun is claimed for this
checkpoint; hosted CI remains the whole-suite gate after push.

Next: Tabs and Accordion, followed by slider/option/form widgets, remaining
custom-widget ownership inventory and compiled installed-Svelte-consumer gates.


## Tabs/Accordion checkpoint (2026-10-13)

Previous composite checkpoint hosted CI passed on run 38263645719. Svelte Tabs
and Accordion now use Bits UI. Removed their interaction machines, manual roving
focus and findableContent attachment. Bits owns ordinary selection/disclosure,
activation and keyboard behavior. GGary retains document-close requests and
neighbor selection/focus after actual removal, panel-content retention, public
bindings, noncollapsible policy, anatomy and labels. Internal key encoding keeps
empty-string public keys distinct from Bits' unselected value. Accordion uses
Bits hiddenUntilFound for retained searchable content and keeps stable ARIA links.

Fixed the reported tab scrollbars for BOTH React and Svelte. The generic GGarry
base rule set scrollbar-width: thin on every component, overriding the tab-list
structure's none due to layer order. Excluded tab lists from that generic rule;
kept overflow scrolling and ordinary scrollbar styles elsewhere. Real narrow
lists in Chromium have hidden scrollbars and still scroll focused tabs into view.
Both framework docs pages were checked visually, including vertical tabs.

Final local checks passed: 36 focused React/Svelte conformance/anatomy cases,
23 Chromium pilot tests (four new disclosure/scrollbar cases), nine Node SSR
cases, zero TypeScript/Svelte diagnostics, 544 theme measurements and the docs
production build. Browser cases cover manual activation, empty keys, draft
retention, focused document removal and find-in-page disclosure. Noncollapsible
activation is tested by keyboard because the trigger correctly reports
aria-disabled while open. Included react/jsx-dev-runtime in browser dependency
optimization to avoid first-run test reloads. No whole fast-suite rerun is claimed
for this checkpoint; hosted CI remains the whole-suite gate after push.

Next: Slider/RangeSlider and option/form widgets, followed by remaining custom
ownership inventory and the compiled installed-Svelte-consumer release gates.

## Remaining component work inventory (2026-10-13)

This counts public components requiring migration or an explicit ownership decision,
not every custom component as a missing Bits primitive. Before the slider checkpoint:
21 components. After Slider and RangeSlider: 19.

- Option controls (7): Checkbox, CheckboxGroup, RadioGroup, Switch,
  ChoiceCardGroup, ChipGroup, SegmentedControl.
- Form contracts (4): NumberField, Field, Fieldset, Form. Native controls and
  GGary validation may remain; audit ownership rather than force a primitive.
- Composite controls (3): Toolbar, Ribbon, Toast/Toaster.
- Domain/floating controls (5): Calendar, DatePicker, TimePicker, Cascader, Shell.

Separate release gates: remaining interaction-owner audit (including native and
custom domain components), compiled package build, installed Svelte consumer,
SSR and full regression suite. The component count is a bounded work inventory;
audit findings may add follow-up fixes.

## Slider/RangeSlider checkpoint (2026-10-13)

Both Svelte sliders now use Bits UI Slider for track pointer interaction and thumb
keyboard/focus behavior. No core pointer or native range-input handlers are
attached. GGary retains presentation, marks, formatted values, range editor drafts
and the pure placeEnd minimum-gap rule. Hidden inputs submit canonical values;
form reset restores the original defaults and clears range drafts. Field labels
name and focus the single thumb (rendered as a labelable button with slider role).
Disabled GGary Fieldsets and readonly Fields propagate to the new interaction
boundary. ConfigProvider direction is passed to Bits. Theme rules share the
existing React thumb styling, with Bits-specific exact-centre mark/fill geometry.

Validation: 34 focused conformance/anatomy cases, all 23 existing Chromium pilot
cases plus two new slider cases, ten Node SSR cases, 544 theme measurements,
TypeScript/Svelte checks and docs production build. Browser cases cover canonical
submission/reset, pointer movement, keyboard/minGap, Field label focus/readonly,
disabled Fieldsets, RTL keys and rendered thumb/fill geometry. Added a no-layout
ResizeObserver stand-in for jsdom; actual geometry is checked in Chromium.
Whole fast-suite coverage remains the hosted CI gate after push.

Next: Checkbox, RadioGroup, Switch and their option-group wrappers. The remaining
19-component inventory above is separate from release gates.

## Native choice ownership checkpoint (2026-10-13)

Checkbox, RadioGroup and Switch intentionally remain native HTML controls in
Svelte. The source audit found no legacy interaction machine or custom roving
focus here: browser inputs own activation, radio arrow navigation, validation,
form participation and disabled fieldsets. GGary owns binding/callback wiring,
form-reset synchronization, decorative anatomy, mixed-state synchronization,
and the small readonly click guard (checkbox inputs have no native readonly).
Replacing this with Bits buttons plus form proxies would add ownership without
removing a homemade keyboard/focus implementation. This is a completed ownership
decision, not a postponed bridge migration. React's Base UI adapters are separate.

Added three real Chromium cases covering labels/Space, native required validity,
canonical submission and reset, indeterminate state, readonly refusal, disabled
fieldsets, radio arrow navigation past disabled options and empty public keys.
These are included in the hosted Svelte browser gate. Focused cross-framework
conformance and SSR selection passed 104 cases; TypeScript/Svelte checks passed.

Remaining unresolved component count: 16 (four option wrappers, four form contracts,
three composites and five domain/floating components). Package/consumer release
gates remain separate. Next: CheckboxGroup, ChoiceCardGroup, ChipGroup and
SegmentedControl ownership review, replacing custom keyboard machinery where needed.

## Native option-group checkpoint (2026-10-13)

CheckboxGroup, ChoiceCardGroup and SegmentedControl intentionally retain native
inputs. There is no custom keyboard/focus implementation to replace in these
three. Preserved form names, public values, radio keyboard navigation, validation
and reset. Found and fixed missing at-least-one validation for required Svelte
checkbox choice cards. Svelte CheckboxGroup now places custom validity on the
first enabled input and clears obsolete errors; shared input-event validity sync
also targets an enabled control. Previously a disabled first option could hide
an invalid group from the browser's constraint validation.

Added Chromium coverage for both required groups with disabled first options,
label activation, canonical submitted values, valid/invalid transitions and reset,
and segmented radio arrows past a disabled option with an empty default key.

Remaining unresolved components: 13. ChipGroup is next: unlike the native groups,
it has a custom selection/roving-focus/typeahead/removal machine. Evaluate Bits
ToggleGroup for selection/focus, preserving GGary removal requests and form values.
Then four form contracts, three composites and five domain/floating components.
Previous two hosted checkpoints (sliders and native choices) passed CI.

Local gates passed: 42 focused cross-framework conformance cases, 12 Node SSR
cases, the new Chromium group case, TypeScript/Svelte checks and diff whitespace checks.

## ChipGroup Bits checkpoint (2026-10-13)

Svelte ChipGroup now uses Bits ToggleGroup for toggle interaction and roving
arrow/Home/End focus. Removed createChipGroupMachine, subscription/SYNC effects,
core connect keyboard handlers and focus nonce from this adapter. Core machines
remain for other framework consumers. GGary owns item-order public selection,
single-mode exclusivity with deselection, label typeahead, removal requests,
canonical hidden form values and reset. ToggleGroup's multiple mode preserves
pressed-button semantics; single-mode policy constrains the public array.
Internal JSON key encoding keeps an empty public key usable. Removal focus
recovery runs only when a previously focused DOM node is actually removed.

The existing chip conformance cases and a Chromium pilot cover keyboard focus,
disabled skipping, toggling, typeahead, empty keys, submission/reset, removal
and single-mode deselection. Added Node SSR submission/button coverage. Previous
native-group checkpoint passed hosted CI.

Remaining unresolved components: 12: NumberField, Field, Fieldset, Form; Toolbar,
Ribbon, Toast/Toaster; Calendar, DatePicker, TimePicker, Cascader and Shell.
Package/installed-consumer release gates remain additional work.
Next: NumberField and the form ownership contract review.

Final local gates: 42 focused chip conformance cases, 30 Chromium pilot cases,
13 Node SSR cases, both anatomy contracts, TypeScript/Svelte checks and docs build.
The full Chromium run caught blur firing during node removal before disconnection;
focus tracking now clears on a real focus transfer and retains removal recovery.
No whole fast-suite rerun is claimed; hosted CI remains that gate after push.

## NumberField and form contracts checkpoint (2026-10-13)

Resolved NumberField, Field, Fieldset and Form ownership. NumberField deliberately
uses native input[type=number] for editing, keyboard stepping and constraints;
GGary's optional scrub handle is a custom inspector enhancement, not a bridge.
Field/Fieldset own presentation and native-validity state. Form owns rules,
submission status, server errors and registered field metadata. Their pure
machines remain intentional domain state, not duplicated overlay/focus behavior.
No Bits replacement is needed to remove a legacy interaction engine here.

Fixed NumberField's missing server-rendered value by emitting its mount-time
initial value in HTML while retaining the draft-preserving client write effect.
The shared scrub attachment now checks :disabled as well as the input's own
flag, so disabled fieldsets block dragging too. Previously scrub could change a
value that native keyboard/pointer editing correctly treated as disabled.

Added Chromium checks for assembled Form/Field/Fieldset/NumberField: native
required validity, label focus, hint association, submission/server errors,
canonical values, reset and disabled scrub. Added SSR initial/default/null value
and assembled form coverage.

Remaining unresolved components: 8: Toolbar, Ribbon, Toast/Toaster; Calendar,
DatePicker, TimePicker, Cascader and Shell. Package/installed-consumer release
gates remain additional work. Next: Toolbar/Ribbon interaction ownership.

Local gates: 33 focused number/field/form and SSR cases, two Chromium assembled
form cases and TypeScript/Svelte checks passed. Hosted CI for the previous
ChipGroup checkpoint exposed a source-heuristic false positive: its internal
Bits snippet spread was named props and classified as consumer passthrough.
Renamed it primitiveProps; no behavior or public attribute contract changed.

## Ribbon tab checkpoint (2026-10-13)

Ribbon tab selection and keyboard/focus now use Bits Tabs. Removed the Svelte
createRibbonMachine subscription/SYNC/focus-nonce path. Kept public bindings,
default selection, invalid/removed selection fallback, panel retention, anatomy,
variant and GGary horizontal-scroller attachment. Encoded values distinguish
an empty public key from no selection. Actual root DOM remains the same layout
boundary; primitive render props are explicitly named primitiveProps.

Chromium covers empty-key selection, disabled-tab skipping, automatic keyboard
activation, retained draft input state and ARIA panel links. SSR covers initial
selection and panel markup.

This is a staged Ribbon checkpoint, not a completed Toolbar/Ribbon migration.
Both remain in the unresolved count of 8. Next: add Svelte ToolbarButton backed
by Bits Toolbar, migrate managed Toolbar and RibbonGroup, and update consumers.
Expose an unmanaged path for mixed controls, matching the React contract.

Local gates passed: the Ribbon Chromium case, all 16 SSR cases, all 569
contract cases, TypeScript/Svelte checks and docs production build. Previous
form checkpoint hosted CI passed on run 38366760078.

## Toolbar and Ribbon groups checkpoint (2026-10-13)

Managed Svelte Toolbar and RibbonGroup now use Bits Toolbar. Added/exported
ToolbarButton: it renders GGary Button through the Bits registered-button snippet
in managed context and an ordinary GGary Button otherwise. Removed all Svelte
attachToolbarKeys calls. Registration is explicit, matching React; arbitrary
buttons are not scanned into a roving focus group. Named Toolbar consumers must
use ToolbarButton for actions. Unnamed strips remain ordinary layout.

RibbonGroup exposes managed=false for mixed controls. Its frame is a group;
managed tools get an inner named toolbar with display:contents to preserve the
existing layout. Group context boundaries prevent unmanaged descendants from
accidentally inheriting an outer managed toolbar. Updated the docs consumers in
Toolbar, Ribbon, Composer and Panel; Select/SegmentedControl Ribbon groups are
unmanaged. Updated the conformance fixture to register its intended toolbar items.

Chromium checks horizontal/vertical navigation, disabled skipping, Home, single
Space activation, Ribbon tool navigation and ordinary mixed text-input arrows.
Added SSR managed/unmanaged markup coverage. Focused conformance and all 571
source contracts pass.

Toolbar and Ribbon are now resolved. Remaining unresolved components: 6:
Toast/Toaster, Calendar, DatePicker, TimePicker, Cascader and Shell. Package and
installed-consumer release gates remain additional work. Next: Toast ownership.

Local gates passed: all 34 Chromium pilot cases, nine focused toolbar/SSR
cases, all 571 source contracts, TypeScript/Svelte checks and docs build.
No whole fast-suite rerun is claimed; hosted CI remains the full regression gate.

## Svelte Toast ownership checkpoint (2026-10-13)

Installed Bits UI has no Toast primitive. Svelte Toaster deliberately remains a
GGary component with a pure queue/timer store, native manual-popover top layer,
pre-existing polite/assertive announcers and native action/close buttons. This is
an explicit custom-component ownership decision, not a pending interaction bridge.
React's separate Base UI toast owner remains unchanged.

Fixed overlapping pause reasons in the Svelte region: hover and keyboard focus
are tracked independently. Leaving with the pointer no longer restarts timers
while focus is inside; blurring no longer restarts them while hovered. Region
unmount/store replacement releases the pause it acquired. The default idle
region does not resume a queue that was paused externally.

Chromium covers combined pause reasons, cleanup, native top-layer openness,
announcement urgency and single action invocation/dismissal. SSR covers stable
announcers and persistent error content. Previous toolbar checkpoint passed CI.

Remaining unresolved components: 5: Calendar, DatePicker, TimePicker, Cascader,
and Shell. Package/installed-consumer release gates remain additional work.
Next: Calendar/DatePicker foundation and value-format contract.

Local gates passed: 12 focused toast conformance/SSR cases, two Chromium toast
cases, TypeScript/Svelte checks and diff whitespace checks. Hosted CI is the
whole-suite gate after push.

## DatePicker popup checkpoint (2026-10-13)

DateField (shared by ordinary DatePicker and DateTimeField) now uses Bits Popover
for anchoring, outside/Escape dismissal and portal lifecycle. Removed its
attachPopover effect and bespoke destroy/focus-restoration path. The existing
text/date/preset machine still supplies parsed values and calendar state; the
calendar engine migration is intentionally the next stage. Removed the trigger's
legacy toggle handler before registering it with Bits to avoid double toggles.

GGary retains ISO/range form serialization, text editing, presets and reset.
Popup focus enters the current calendar day; Escape/selection return to the
text input, while outside clicks retain their target focus. Portal content
copies inherited CSS variables and direction. Shared positioner styling now
includes the Bits boundary alongside React's Base UI boundary.

Chromium covers anchored geometry, focused day, selection/ISO submission, reset,
ArrowDown opening and Escape focus return. SSR checks the closed field and
submission value without mounted popup content.

This is a staged checkpoint. Calendar and DatePicker remain unresolved until
the calendar engine is migrated; the remaining component count stays 5.
Next: Bits Calendar/RangeCalendar with GGary ISO date/range adapters.

Local gates passed: all 21 date-picker conformance cases, the Chromium popup
case (including keyboard Enter selection and outside-click focus), closed-popup
SSR and anatomy coverage, TypeScript/Svelte checks and docs production build.
Calendar-driven close needed a deferred field-focus request because it changes
open state outside the primitive's own dismissal path. Both native browser and
DOM conformance now assert that focus recovery. Conformance opens the popup
before checking its ARIA links; closed popup content is deliberately unmounted.
Previous Toast checkpoint passed hosted CI on run 38371349356.
