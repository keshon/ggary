# GGary: framework-specific interaction backends

## Public React overlay adoption (2026-10-09)

React overlays and their private consumers now use @base-ui/react 1.8.0.
Select native lifting and React legacy dismissal registrations have been removed.
There are no separate experimental component exports. Existing props, anatomy,
icons and GGary theme remain the consumer contract. Svelte and its core machines
are unchanged; keep shared design assets and framework-specific interaction code.

## Integration choices

Dialog uses Base UI focus management, modal scroll locking, pointer dismissal
and body portals. Nested Dialog portals are outside the parent Popup so closing
a child restores focus to its trigger. Portal layers carry resolved theme,
direction, locale and inherited CSS variables. React no longer discovers native
dialog/popover owners as a compatibility fallback.

The trigger render callback receives actual Base UI props and ref. It must return
one ref-forwarding button. Controlled owners can refuse closing without callback
echoes on prop synchronization. Escape/outside settings and callback reasons are
preserved. A form inside the popup with method="dialog" closes through the
existing callback, including submitter returnValue and cancellation semantics.
The underlying surface is now a div, not HTMLDialogElement: native close() and
DOM returnValue are unavailable. Put forms inside the popup; a body portal does
not retain native association with an ancestor form outside it.

Select portals into the nearest Base UI Dialog/Popover outer layer or the body.
It carries local theme/direction and uses Base UI positioning to escape clipping.
There is no manual native Popover lift.
Select preserves controlled values, form validation/submission/reset and local
configuration. React and Svelte navigation tests explicitly account for different
focus models rather than demanding identical DOM.

Base UI owns React dismissal ordering. React has no legacy dismiss-stack bridge;
the shared legacy machinery remains for Svelte and vanilla consumers.
Structure/theme packages contain the public layer/backdrop styles. Docs use
static specimens for miniature previews and real components for interaction.

## Earlier pilot validation (historical)

The full fast suite reports 2602 passed, 9 skipped and two existing calendar
failures: React/Svelte tests target September while clearing opens October.
Calendar code/tests were not changed. The Popover conformance run passes 16 shared cases; four dedicated integration cases pass.
Eight dedicated Dialog DOM cases cover callbacks, controlled refusal, Escape,
ARIA, form submission and closed-content cleanup.

Repository typecheck including svelte-check and docs production build pass.
Browser regression cases were authored and typechecked; the automated browser
project was not executed. Interactive browser checks separately verified nested
Escape/focus restoration, local dark/RTL, nested Popover interaction, method="dialog",
Sheet body scrolling/page locking, and Select mouse/keyboard focus inside Dialog.

Leads uses compiled React/structure/theme snapshot 0.0.12. Consumer typecheck and
production build pass. In the isolated CallsFeed fixture, choosing Anna inside
Sheet changes 24 calls to 8; focus returns to Select, then closing Sheet returns
focus to Filters. No backend writes were performed.

## Next stages

1. Continue the broader primitive inventory and migration in REACT-FOUNDATION-PLAN.md. The overlay backend is complete; the whole React library is not migrated.
   Leads currently retains the earlier 0.0.12 snapshot until explicitly refreshed.
2. Evaluate a Svelte interaction foundation separately, preserving visual and
   behavior contracts rather than sharing framework implementation.
3. Retain core machines while Svelte/vanilla uses them. No blanket rewrite.

This bounded migration does not claim complete accessibility certification.

## Full React migration completion criteria

The target is a React interaction stack with no legacy dismissal bridge, not a
permanent mix of Base UI and GGary popup listeners. Svelte remains separate.
Completion requires all of the following, including private consumers:

- Menubar and ContextMenu use Base UI and share the migrated menu rendering.
- DataGrid row menus and Kanban card menus stop using legacy MenuContent.
- Tooltip and Popconfirm use Base UI overlay primitives.
- Cascader, DatePicker and TimePicker replace attachPopover; custom selection
  or calendar domain logic can remain where Base UI has no equivalent.
- CommandPalette replaces its native-dialog attachment with Base UI ownership.
- React Select removes its native Popover lift.
- React Dialog, Popover, Menu, Select and Combobox remove trackDismissable
  registrations. No React overlay imports attachPopover, attachDialog or the
  legacy dismissal stack, directly or through a helper.
- Tests assert nested Escape, pointer dismissal, Tab/final focus and portal
  theme ownership on the standard stack; no test requires a legacy layer count.

Removing registrations before replacing their remaining consumers does not
satisfy the target. Source-level checks should prevent their reintroduction.

## Popover boundary

Popover uses Base UI Root/Trigger/Positioner/Popup/Title/Close with the existing
GGary props and reason vocabulary. It is nonmodal, with focus-in on open and
focus restoration on close. Controlled refusal, persistent behavior and updated
Escape options are covered. Body fields unmount on close; the hidden positioner
remains mounted. Native manual Popover is no longer the public React backend.

Popover portals into its nearest Base UI owner layer, outside the owner Popup,
or a remaining native owner; standalone popovers portal to body. This prevents
parent Dialog pointer dismissal and focus theft. Local variables and ConfigProvider
mode/direction/locale cross the portal. Base UI available-width is mapped into the
GGary CSS contract. Static docs previews are separate from interactive specimens.

Interactive checks verified standalone outside dismissal, nested Popover Escape,
Select mouse selection and focus, and Dialog -> Popover -> Select under dark/RTL.
The automated browser project remains unexecuted. Leads receives snapshot 0.0.12;
its existing CallsFeed Sheet/Select fixture was rechecked (24 -> 8 calls).

## Menu boundary

Public React Menu uses Base UI Root/Trigger/Positioner/Popup, Item,
CheckboxItem, RadioGroup/RadioItem, Group/GroupLabel, Separator and nested
SubmenuRoot/SubmenuTrigger. MenuContent remains for legacy Menubar/ContextMenu;
Svelte/core machines are unchanged. Menu props and callback item identity remain.
Checkbox/radio state belongs to the owner. Per-item closeOnSelect overrides the
menu option; links retain anchor elements and href.

Each open surface registers a temporary Escape bridge only after its portal node
mounts. Registrations stay stable across focus/navigation updates. Submenu Escape
closes one level and focuses its trigger. Hover closure does not restore focus
and steal it from the newly hovered parent row. Tab keeps the previous GGary
contract: close the whole tree and return focus to the root trigger.

Body portals carry theme/custom variables; hosted portals use the nearest Dialog
or Popover owner layer. DirectionProvider supplies RTL keyboard behavior and
submenus/chevrons switch sides. Menu remains nonmodal.

Focused conformance/integration checks pass 108 cases, including existing
Menubar/ContextMenu consumers. Four new cases cover controlled close refusal,
refused repeated checkbox requests, already-selected radio activation and Dialog
ownership. React tests simulate actual button activation and pointer events;
Svelte retains its render-free keyboard-batch test. Pointer-open virtual clicks
and parent-row highlight differ by backend; tests assert those explicitly.
Interactive browser checks cover two nested submenu levels, Escape/focus, Tab,
checkbox/radio ownership, local dark/RTL and Menu inside Dialog/Popover.
The automated browser project was not executed.

## Combobox boundary (2026-10-09)

Public React Combobox uses Base UI Root/InputGroup/Input/Clear/Trigger,
Portal/Positioner/Popup/List/Item/ItemIndicator. It no longer subscribes to the
legacy interaction machine or uses attachPopover. GGary retains its ranked
filterItems utility, remote loading API, result limits, localized status words,
selected-label retention, async creation and native form integration.

Remote searches debounce, abort on query/loader changes, closure or unmount,
and reject late answers even if the server ignores abort. Only selected labels
are cached. Pending creation uses the current owner/callback; reset, disabling
and unmount invalidate its result. Multiple selection keeps the popup open;
chip removal and Backspace retain the existing public behavior.

Body portals inherit local variables and use the field's width. Hosted portals
stay inside their Dialog/Popover owner layer. Escape closes the list first;
Tab can proceed to the next control. Disabled fields do not submit.

Base UI intentionally permits keyboard highlighting of disabled options for
announcement while blocking activation. Async results arriving after an empty
list need ArrowDown before Enter. Tests record these differences from Svelte.
React typing tests use InputEvent with inputType, distinguishing typing from
autofill; the Svelte harness remains unchanged.

Seven dedicated DOM cases cover controlled refusal, stale server responses,
minimum length and label retention, creation rejection/retry, latest-default
reset, hosted Escape and resetting during creation. Shared conformance covers
ranked filtering, keyboard/pointer selection, chips, limits and submission.
Manual browser checks include actual typing, Tab, controlled acceptance,
creation, Popover remote selection, and Dialog dark/RTL/Escape ownership.
Browser regression tests were updated for portals but not executed automatically.


## Menubar, ContextMenu, Tooltip and Popconfirm (2026-10-09)

React Menubar and ContextMenu compose Base UI Menu surfaces. Menubar retains
opt-in Alt/F10 access keys and mnemonic presentation; Base UI owns menu
navigation and selection. ArrowUp opens on the last enabled item after the
opening lifecycle completes. Disabled bar entries are skipped by React's
roving focus. ContextMenu preserves Shift-right-click for the browser and
supports Shift+F10 and the menu key.

React Tooltip uses Base UI Trigger/Portal/Positioner/Popup, retaining delays,
controlled ownership, theme variables and an accessible description. Its
hover tests include the actual positioner boundary. React Popconfirm uses
Base UI Popover for positioning, focus and dismissal, while the pure GGary
confirmation state machine retains pending actions, retries and rejection
messages. These two components no longer use attachPopover or the legacy
interaction bridge. Shared focused conformance passes 58 cases across both
frameworks. Popconfirm was checked manually for rejection, cancellation,
initial focus, Escape and returning focus to its trigger.

### Full React migration completion criteria

This stage does not complete the migration. Remove attachPopover/attachDialog
from Cascader, DatePicker, TimePicker, CommandPalette and private MenuContent
used by Grid/Kanban; replace Select's native popover lift; then remove
trackDismissable registrations from all React components. Add a source guard
against reintroducing the legacy overlay stack and verify nested pointer,
Escape, Tab and focus behavior. Svelte remains separate.

Base UI need not supply every GGary component. GGary retains domain behavior
such as upload progress, grid data operations and calendar calculations;
shared overlays and interaction primitives must use the standard React stack.


## Private Grid and Kanban menus (2026-10-09)

GridRowMenu and Kanban now use the internal AnchoredMenu, composed from Base UI
ContextMenu.Root and the public Menu's shared Surface/Level renderer. Their
controllers retain target selection, row actions, card moves and announcements;
React no longer creates a legacy menu interaction machine. The old recursive
MenuContent renderer was deleted. Positioners accept controller-supplied real
or virtual anchors. Focus restoration resolves the reference at close time,
so a card moved into another column receives focus at its new DOM location.

A triggerless Menu.Root did not establish the required floating-tree node for
these externally anchored menus: opening a submenu closed the parent as a
sibling. Browser testing exposed that issue. ContextMenu.Root supplies the
correct context and fixes the hierarchy. The regression test covers opening a
submenu, closing only that level with Escape, reopening and choosing a new
column while retaining the original card target and restoring focus.

Focused Grid/Kanban/Menubar/ContextMenu conformance passes 73 cases. Manual
Kanban checks cover opening via its action button, ArrowRight, submenu Escape,
choosing a destination and focus after moving. Svelte retains its renderer.
The shared Surface still has the temporary dismissal registration; the full
React migration checklist above remains pending for the remaining consumers.


## CommandPalette dialog boundary (2026-10-09)

React CommandPalette uses Base UI Dialog.Root/Trigger/Portal/Backdrop/Popup.
It no longer creates a native dialog or uses attachDialog. Modal palettes carry
local tokens through their portal; inline palettes use a local portal host,
remain in document flow and ignore outside presses. Base UI requires its
Portal context even for the inline Popup.

The GGary palette state machine retains filtering, highlighted commands,
hierarchical pages, remote loading and command execution. Escape is delegated
to the hierarchy: leave one page first, close at the root, and respect a
controlled owner's refusal. Initial focus goes to the search input, and focus
returns before the selected command runs. The trigger's shortcut annotation
now respects the configured hotkey.

Shared conformance passes 15 cases, including three React boundary checks for
controlled refusal, inline placement/outside presses and callback focus order.
Eight palette machine tests and eight Base UI dialog integration tests pass.
Manual browser checks cover the inline specimen, modal remote results,
keyboard command pages, one-level Escape, closing and returning to the trigger.
Browser regression assertions were updated for Base UI portals and modality;
the automated browser project was not executed. Remaining bridge removal still
depends on Cascader, DatePicker, TimePicker and Select's native lifting.


## Cascader popup boundary (2026-10-09)

React Cascader uses Base UI Popover.Root/Trigger/Portal/Positioner/Popup and
DirectionProvider. It no longer uses attachPopover or native popover lifting.
GGary retains the tree selection machine, selected path, columns, keyboard
navigation and form reset. Portals carry local theme tokens and direction;
column height uses Base UI's available positioning height.

Sixteen Cascader conformance checks, seven machine checks and four Base UI
popover regressions pass. TypeScript and the docs production build pass.
Manual browser checks cover three-column layout, keyboard leaf selection,
Escape and focus restoration, and local dark/RTL inheritance with reversed
parent/child arrows. A dark/RTL specimen is included in the docs.
Browser regression queries were updated for the portal; the automated browser
project was not executed. DatePicker, TimePicker, Select's native lifting and
remaining temporary registrations still need migration/removal before the
full nested-overlay integration check.


## DatePicker popup boundary (2026-10-09)

React DatePicker uses Base UI Popover and DirectionProvider without attachPopover
or native popover lifting. The whole control remains the positioning anchor;
GGary retains calendar navigation, date parsing, range selection, constraints,
presets, form integration and the embedded time field. Portal tokens retain
local theme/direction. TimePicker itself still awaits migration.

A real-browser check found that changing Base UI's reference from the trigger
to the field can restart its focus manager and invoke finalFocus while open.
The finalFocus callback now restores the input only after the visit ends.
A React conformance regression and browser regression cover repeat opening;
React focus assertions wait for Base UI's asynchronous focus scheduling.

Twenty-seven focused conformance checks (including two-month and Grid date
filter coverage), 26 calendar/date machine checks and four Base UI popover
checks pass. TypeScript and the docs production build pass. Manual browser
checks cover mouse opening, keyboard date selection, Escape, two-month layout,
outside dismissal preserving the destination field's focus, range presets,
and local dark/RTL inheritance. Automated browser tests were updated but not
executed. Remaining work: TimePicker, Select's native lifting, temporary
registration removal and nested-overlay integration/source guards.


## TimePicker combobox boundary (2026-10-09)

React TimePicker uses Base UI Combobox.Root/Input/Trigger/Portal/Positioner/
Popup/List without attachPopover, native popover lifting or a new dismissal
registration. GGary retains parsing, off-step text commitment, step navigation,
constraints, selected/highlighted time, form submission and reset. The keyboard
handler delegates time-specific keys to the machine; Base UI owns the input/
popup interaction boundary. Custom time option rows retain their machine props.

Base UI's Combobox boundary preserves natural Tab exit with focus staying in
the input while the list opens. The initial scroll is repeated after Base UI's
open-complete callback because a portalled list has no final geometry during
its initial state effect. Walking only reveals the highlighted row as needed.
Portal width follows the control anchor and local theme/direction are copied.

Forty focused conformance checks (TimePicker, DatePicker, two-month calendar and
Grid date-filter integration), 13 time machine checks and seven Base UI Combobox
checks pass. TypeScript and the docs production build pass. Browser checks cover
trigger opening, selected-time centering, ArrowDown/Enter, natural Tab exit,
Escape, dark/RTL inheritance, embedded DatePicker width and pointer selection,
and typed 09:37 highlighting 09:30 while committing 09:37. A dark/RTL specimen
and browser regression for centering/Tab exit were added. The automated browser
project was not executed. Remaining: Select native lifting, temporary bridge
registrations/fallbacks, then nested-overlay checks and a source guard.


## Bridge removal and nested integration (2026-10-09)

React Select now uses a body or nearest Base UI owner portal with inherited
local tokens/direction. There is no native popover lift. React Dialog, Popover,
Menu and Combobox no longer register with trackDismissable. Native dialog and
popover owner fallbacks were removed from React portal discovery, including
ContextMenu and Menubar. Shared legacy helpers remain for Svelte/vanilla.

TimePicker delegates open-list Escape to Base UI so the same event cannot also
close an ancestor Dialog. Nested menus consume Escape at their own popup and
restore the submenu trigger before unmounting. This is a local React keyboard
handler on Base UI Popup, not a document listener or legacy layer registration;
hover changes and Menubar switching retain their destination focus.

Ten integration cases cover Select in Dialog/Sheet/Popover and Combobox,
Cascader, DatePicker, TimePicker, Menu, Popover and CommandPalette in Dialog.
They assert child-only Escape and zero legacy layer registrations. A source
contract rejects legacy React dismissal/attachment methods and native-owner
fallback selectors. Legacy layer-count expectations in shared tests are now
framework-specific. Calendar fixtures have a fixed default month rather than
assuming today's month; a form focus assertion awaits its scheduled outcome.

Manual browser checks cover Select pointer selection/return focus inside Dialog,
child-only Escape for Select and TimePicker, multilevel Menu ArrowLeft/Escape,
and standalone Select dark/RTL tokens without native popover attributes. Browser
regression assertions were updated, but the automated browser project was not
executed. The docs Dialog specimen includes TimePicker beside Select.

Repository React/Svelte typecheck reports zero Svelte errors or warnings and the
docs production build passes. Final fast suite: 83 files passed, 2622 tests passed and 9 skipped, with no
failures.
The React overlay migration is complete after these checks. Leads still uses its
previous 0.0.12 snapshot; consumer adoption has not been performed in this stage.


## Leads consumer adoption (2026-10-09)

Leads now installs compiled React/structure/theme snapshot 0.0.13 from the
bridge-free working tree. Its root/frontend typechecks and production build
pass. Browser checks on the synthetic CallsFeed/CRM playground verify manager
filtering (24 to 8 calls), nested Select/Sheet Escape ordering and focus return,
and local CRM settings saves. These checks perform no backend writes. The
previous 0.0.12 consumer references above describe earlier stages.


## Broader primitive migration: Tabs and Accordion (2026-10-09)

React Tabs/Accordion use Base UI; core interaction machines remain only for
other adapters. GGary adds document closing and non-collapsible single disclosure
policy. Disabled tabs now receive arrow focus without activation; Accordion
uses Tab navigation without legacy arrow shortcuts. See REACT-FOUNDATION-PLAN.md
for validation and remaining work. Whole-library migration remains in progress.


## Numeric primitives (2026-10-09)

React Slider, RangeSlider and NumberField now use Base UI interaction primitives.
GGary keeps design/presentation and range editor composition. Existing Field
integration is addressed next. Validation and deliberate DOM/scrub differences
are recorded in REACT-FOUNDATION-PLAN.md. Leads is no longer a migration target.
