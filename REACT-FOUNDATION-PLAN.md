# GGary foundation plan

React uses Base UI where it reduces interaction ownership. GGary owns design,
public APIs and domain widgets. Svelte has a separate behavior implementation;
share visual contracts and genuinely framework-independent domain logic.

Status: Planned React foundation migration and local candidate verification are
complete. Custom/native components are retained deliberately. Hosted CI passed;
publication has not run. Leads is retired as a test bench; do not update it.

## 1. Ownership inventory and demo metadata (completed; detailed accessibility audits separate)

Record implementation and migration decision for every documented React
component: native HTML, Base UI, GGary custom, or GGary + Base UI. Describe
ownership within composites. Label the React demo outside specimens. Audit
keyboard, focus, validation and state ownership before finalizing decisions.

## 2. Complex primitives (completed)

Migrate Tabs and Accordion first, then Slider/RangeSlider and NumberField.
Retain styling and useful APIs; remove replaced React behavior. Check keyboard,
controlled state, disabled state and focus. No permanent parallel backends.

## 3. Form architecture (completed; release verification remains in phase 6)

Review Form, Field, Fieldset, Input, Checkbox/CheckboxGroup, RadioGroup and
Switch together. Establish consistent labels, errors, reset and submission.
Use Base UI integration where useful; retain native controls deliberately.

## 4. Other counterparts (decisions and selected migrations completed)

Review Toast, Toolbar, Avatar, Progress, Meter, Button and related groups.
Prioritize substantial custom behavior; avoid migration solely for coverage.

## 5. Custom widget boundaries (selected migrations and helper audit completed)

Retain tables, trees, Kanban, uploads, calendars and agent UI. Compose standard
React controls from the chosen foundation. Separate framework DOM interaction
from shared domain logic.

## 6. Packaging and release checks (local and hosted gates completed)

Ship compiled JS/declarations and reliable component exports. Validate a clean
consumer installation. Automate representative browser overlay/form/keyboard
checks; use a dedicated clean consumer smoke fixture. Review CSS entry points/payload.

## 7. Svelte

Choose its foundation separately after React contracts settle. Share tokens,
anatomy, styling and domain types; verify equivalent observable behavior.

## Working rules

Update demo metadata and this plan with each completed batch. No claim of full
migration until counterpart decisions and release checks are complete. Browser verification of packaged consumers remains a release gate. Do not rewrite unrelated
presentation components. Current metadata is a baseline, not an accessibility
certification or a completed component-by-component behavior audit.


## Checkpoint: Tabs and Accordion (2026-10-09)

React Tabs and Accordion now compose Base UI primitives. Their React adapters
no longer instantiate shared interaction machines. Shared core machines remain
for Svelte/vanilla. GGary anatomy/styling, document closing, panel mounting and
non-collapsible single accordions remain supported.

Behavior differences adopted deliberately: disabled tabs are discoverable via
arrow focus but cannot activate; Accordion uses ordinary Tab navigation rather
than arrow/Home/End shortcuts. Demo ownership notes explain both. Base UI owns
Accordion hidden-until-found handling. GGary keeps the multiple=true rule that
items may close even when collapsible=false.

Validation: 83 fast test files pass, 2626 tests pass and 9 skip. React/Svelte
checks pass with zero Svelte errors/warnings; docs production build passes.
Manual browser checks cover tab arrow activation, document deletion/focus return,
and accordion selection/Tab navigation. Automated browser tests were not run.
Leads remains on snapshot 0.0.13; these newer primitives are not repackaged yet.

Next implementation batch: Slider/RangeSlider and NumberField. The deeper
inventory/form audit remains open; do not label the entire React migration done.


## Checkpoint: numeric controls (2026-10-09)

React Slider/RangeSlider use Base UI for pointer and keyboard interactions and
thumb collision/gap rules. React NumberField uses Base UI parsing, stepping and
ScrubArea; attachScrub and direct input-value synchronization are removed.
GGary presentation helpers still provide marks, range bubbles and range editor
commit rules; their legacy track/thumb handlers are not installed in React.
Form reset and existing Field attributes remain GGary integration until phase 3.

Slider's native input ref and attributes are preserved through render composition
without replacing Base UI event handlers. Range names support one name or a pair.
New visual parts accommodate Base UI thumb geometry without altering Svelte's
native controls. NumberField has a visible text editor plus one hidden numeric
submission input. Its scrub sensitivity follows Base UI: one ordinary step per
pixel after the movement threshold; Shift uses ten steps per pixel.

Validation: 83 fast files passed, 2629 tests passed, 9 skipped. Typecheck reports
zero Svelte errors/warnings; docs production build passes. Added decimal/bounds,
controlled refusal and single numeric submission checks. Manual browser checks
cover Slider arrows/Field naming, RangeSlider dragging and collision, and
NumberField axis dragging and arrows. Automated browser suite was not run.

Leads is retired as a test bench by user decision. Do not refresh it or treat
consumer adoption there as remaining work. Next: phase 3, coherent form/field
architecture and its control contracts.


## Checkpoint: React Form event ownership (2026-10-09)

Phase 3 is in progress. React Form no longer calls attachForm or emits/listens
for the core gg:edit event. React submit/input/change/reset handlers deliver
native events; composite controls report edits through context. Shared core
attachForm remains available for Svelte/vanilla. GGary's submission state
machine remains a domain workflow for async rules, server errors and summaries.
The React workflow uses native constraint checks; it is not a Base UI Form yet.

Async lifecycle fixes block duplicate submits while validation is pending,
ignore validation/server results after reset or unmount, and show rejected
validators as failures that permit retry. Reset cancels queued summary focus.
These changes preserve the existing FormData callback and native-action API.

Validation: 84 fast files passed, 2634 tests passed, 9 skipped; TypeScript
check and docs production build passed. Added regression coverage for pending
validation, reset races and rejected validators. Manual Form demo check confirms
server error display and a successful edited retry. Automated browser suite was
not run. No Leads files were changed.

Next: migrate Field and Input/Textarea validation together, then Fieldset and
option controls. Avoid installing two competing constraint-validation owners;
only add Base UI Form once the registration/summary contracts are resolved.


## Checkpoint: Field and text-control validation (2026-10-09)

React Field now composes Base UI Field.Root, Label and Validity. It no longer
instantiates createFieldMachine or installs core Field validation handlers.
Base UI owns native constraint computation/registration. GGary owns error
visibility: blur or invalid reveals errors, edits revalidate once revealed,
reset hides native errors without remounting controls. Form/server invalidity
still takes precedence. Persistent hint/error nodes and canonical metadata
remain GGary presentation so descriptions point only at the visible slot.

Input and Search use Base UI Input. Textarea uses Field.Control rendered as a
native textarea and retains autosizing. The public value callback still receives
one string argument. Checkbox, Switch and FileDrop register through Field.Control;
their native/GGary interaction behavior is retained pending counterpart review.
NumberField's rendered ARIA/state follows the same reset visibility policy.
Native labels remain combined for a checkbox/switch with its own caption.

Compatibility boundary: useFieldControl now supplies metadata, not legacy event
handlers. Custom React controls must register through a Base UI primitive or
Field.Control to participate in Field validation. Settle the public composition
API/documentation before a consumer release. Shared Svelte/core Field behavior
was not changed.

Validation: 84 fast files passed, 2642 tests passed, 9 skipped. Typecheck and
docs production build passed. New coverage checks malformed live edits, native
node identity across reset, revalidation after reset, Search registration,
React controlled refusal and NumberField reset ARIA. Manual browser checks cover
required blur, malformed live errors, valid clearing and preserved checkbox/
switch labels. Automated browser suite was not run.

Phase 3 remains open: Fieldset and option groups, Checkbox/Switch primitive
counterparts, public custom-control composition and final Form orchestration.
Form still uses native HTML + GGary async submission policy; do not mark it as
Base UI Form. Leads remains retired and untouched.


## Checkpoint: Checkbox and Switch primitives (2026-10-09)

React Checkbox and Switch now compose Base UI Root/Indicator/Thumb. Their
adapters no longer call core connect/choice or use Field.Control as a checkbox
substitute. Base UI owns activation, keyboard focus, hidden-input submission,
Field registration and indeterminate DOM state. GGary maps its string mixed
state, owns reset/default restoration and retains one-boolean callbacks.

The visible toggle is the focusable semantic checkbox/switch; the native input
is hidden and only submits. The public ref remains that input, and focus()
redirects through Base UI to the visible toggle. DOM event props are typed for
the visible span; consumers must not assume event.currentTarget is a native
input. A small inputRef attribute helper preserves anatomy/ARIA used by native
refs and form summaries, without installing event handlers or writing values,
checked state or indeterminate. Its purpose is metadata, not legacy interaction.

New toggle anatomy/theme rules reproduce GGary visuals and central focus-ring
styles. Svelte/native choice styles and interaction remain unchanged. Checkbox
and Switch inherit disabled state from GGary Fieldset, including removing the
visible toggle from keyboard navigation. Field now treats internal focus
transfers (hidden input to toggle, or password reveal) as remaining inside the
field; required errors appear when focus leaves.

Validation: full fast suite passes (85 files, 2654 tests passed, 9 skipped); TypeScript and Svelte checks pass (0 errors/warnings), and the docs build passes. Added controlled refusal, readonly Space,
exactly-one submitted value, public ref identity, disabled Fieldset inheritance,
and pristine focus/reset validation coverage. Manual browser checks confirm
checkbox Space/pointer toggles, pristine required focus then blur, and Switch
Space/readonly behavior. Automated browser suite was not run.

Next: CheckboxGroup, RadioGroup and Fieldset as a group-validation boundary.
These independent group adapters are still native/core implementations. Phase 3
and final Form orchestration remain open. Leads stays retired and untouched.


## Checkpoint: option groups and Fieldset (2026-10-09)

React CheckboxGroup now uses Base UI CheckboxGroup with the migrated Checkbox;
RadioGroup uses Base UI RadioGroup/Radio. Base UI owns selection, visible-control
activation and radio roving focus. GGary keeps the value-only callback, item-order
checkbox values, controlled refusal and form-reset defaults. Hidden inputs retain
native submission and constraint validation. No legacy choice/connect adapter
remains in these React groups.

Fieldset uses Base UI Root/Legend, with Legend rendered as a native legend.
Its old core machine/connect adapter is removed from React. GGary still owns
aggregate native validity and error timing: internal focus movement is ignored,
leaving the group or a native invalid event reveals errors, edits recheck revealed
errors, and reset clears disclosure. Disabled state reaches visible Base controls
as well as native descendants. CheckboxGroup required means at least one enabled
checked input; disabled values do not satisfy submission. This uses native custom
validity on the first eligible input, not required on every checkbox.

Demo implementation labels describe these ownership boundaries. Shared pure
choice-group anatomy/frame and native validity utilities remain available;
Svelte keeps its existing adapters.

Validation: latest full fast run has 2658 passed, 9 skipped and one failure in
an unrelated menu/dialog Escape test. The isolated rerun of menu integration,
all adapter conformance and anatomy contracts passes (1298 passed, 9 skipped),
including a Svelte form-focus test that failed in an earlier full run. The full
suite is not recorded as clean. TypeScript/Svelte checks and docs build pass;
five new integration cases pass for controlled refusal, disabled
submission, reset and error disclosure. Live browser checks confirm radio arrow
navigation (including skipping disabled options) and CheckboxGroup Space
selection/required constraint clearing.
Automated browser suite was not run.

Next: settle Form orchestration and public custom-control/group composition.
This checkpoint does not close the entire form architecture phase. Leads remains
retired and untouched.


## Checkpoint: Form ownership and public composition (2026-10-09)

Decision: retain one native HTML + GGary Form workflow. The installed Base UI
Form synchronously validates and focuses the first invalid registered control
before invoking its submit callback; it does not await async validation to stop
submission. That conflicts with GGary's async rules, native action fallback and
summary-first focus. Base UI still owns Field/control constraint computation and
standard control interaction. There is no parallel Form backend or DOM event
bridge. Shared pure core state/summary utilities are intentional GGary policy.

FieldControl is now a public React-only, unstyled Base UI Field.Control adapter
for custom native inputs, textareas and selects. It preserves native refs,
handlers, controlled values and GGary Field error visibility. Existing GGary or
Base UI primitives must not be wrapped in it: they already register. The package
contract explicitly permits this React integration export; no fake Svelte
counterpart is added. See packages/react/FORM-COMPOSITION.md for examples and
limitations.

Named Fieldsets register their group for Form rules, server errors and summary
focus; child option groups inherit the name. Standalone named groups register
their own root. Registered native group errors are deduplicated into one summary
entry using the group legend/label and visible message. Summary links focus the
semantic fieldset/group rather than an arbitrary option.

Input/change and explicit context edits are coalesced after React commits. Form
compares accepted FormData values before clearing errors: refused controlled
requests cannot clear server errors or validate transient native values. Reset
and disposal cancel queued edits. Synchronous validator exceptions become form
failures with retry. Async submit rule names are tracked for later synchronous
rechecks. Async native submission restarts validation when values change while
rules are pending, and rechecks current native constraints before passing.
Untouched optional file placeholders do not cause false restarts. Required RadioGroup also rejects a checked disabled option, which
native radio required can count even though it submits nothing.

The Form demo adds a custom native control, named checkbox group, standalone
radio group, required/summary flow, mock server error, successful save and reset.
Documentation and demo metadata state that Form remains GGary deliberately.

Validation: full fast suite passes (87 files, 2673 passed, 9 skipped), using
maxWorkers=2. TypeScript/Svelte checks pass (0 errors/warnings); docs build passes.
All 22 focused custom-control/group/workflow cases pass, including input/select/textarea refs, accepted-state edit coalescing,
controlled refusal, group summary focus, required disabled-radio submission,
reset, async native-submit value/constraint changes, optional file placeholders,
and exactly one numeric value for a named NumberField. Live browser checks
confirm summary-first focus, grouped server errors, group-link focus, saving
and reset.
Automated browser suite was not run.

Next: audit composite control integration (Select, Combobox, Cascader, date/time
pickers and related custom controls): Field/Fieldset naming, disabled/readonly
inheritance and native constraint capabilities. The composition contract is now
explicit; phase 3 is not declared complete until that cross-control audit passes.
Then proceed to the remaining Base UI counterparts in phase 4.


### Composite audit checkpoint: Select

Select now composes with Field: the visible trigger inherits its ID and label/
error metadata; Field owns Form registration and the name used by Base UI's
single canonical submission input. Required/readOnly/disabled settings inherit
from Field; disabled also inherits from Fieldset. Public required/readOnly props
are available for standalone use. Read-only follows Base UI's browse-without-
mutation semantics. Reset closes the popup as well as restoring uncontrolled
values. Field blur ignores focus entering a popup referenced by aria-controls.
A separate internal composition context delivers accepted edits without copying
submission names into generic DOM metadata or installing an event bridge.

The Form demo includes required and read-only Selects inside Field. Composition
and implementation notes document ownership. Focused tests cover native required
constraints, one submitted value, canonical labels, disabled Field/Fieldset,
read-only selection refusal, popup focus disclosure, server-error clearing on
accepted edits, and retaining errors on controlled refusal.

Validation: full fast suite passed (87 files, 2678 passed, 9 skipped); the final
expanded Select/Form composition suite passed all 22 cases. TypeScript/Svelte
checks passed (0 errors/warnings), and docs production build passed. Live browser
checks confirmed summary-to-trigger focus, required error clearing after
selection, and read-only submission preservation. Automated browser suite was
not run.

Next: Combobox composition, then Cascader and date/time native validation.
Phase 3 remains open until those composite contracts are verified.


### Composite audit checkpoint: Combobox

Combobox inherits Field naming, visible input ID, label/error metadata, required,
disabled and readOnly settings; disabled Fieldset state also inherits. Base UI
owns canonical submission inputs and native selected-value constraints. Removed
GGary's extra hidden inputs. Search text never submits or satisfies required;
multiple mode requires at least one selected value and submits repeated values
once each. Single empty selection now submits an empty string instead of omitting
the entry; this React submission detail is documented.

Read-only permits browsing but rejects typing, selection, clear, chip/Backspace
removal and creation. Switching to read-only ignores pending creation results.
Explicit child disabled/readOnly state remains effective inside an editable Field.
Field owns Form errors and summary registration when named, and only accepted
selections clear server errors. Base UI's nameless multiple constraint input has
an internal metadata reference to its visible control; GGary's summary uses this
to resolve the registered name, visible error and focus target. No event bridge
or duplicate interaction owner was added.

The Form composition demo includes required single/multiple and read-only
Combobox specimens; implementation and composition notes are updated. Live checks
caught and fixed an unlabeled multiple summary entry and an overwritten
aria-describedby error reference, then confirmed labelled error links, selection
clearing, summary focus and read-only value preservation.

Next: Cascader form composition, then date/time native validation. Phase 3 remains
open; packaging and clean-consumer verification are still separate work.


Validation: final fast suite passed (87 files, 2692 passed, 9 skipped), including
all 18 focused Combobox cases. TypeScript/Svelte checks passed (0 errors/warnings),
and docs production build passed. One Svelte summary-focus timing failure during
a concurrent build/test run passed in isolation and in the final full rerun.
Automated browser suite was not run; live browser composition checks were run.


### Composite audit checkpoint: Cascader

Cascader now inherits Field naming, visible trigger ID, label/error metadata,
required, disabled and readOnly settings; disabled Fieldset state also applies.
GGary retains domain tree navigation and path selection, with Base UI Popover
and Field.Control boundaries. One visually hidden native text input validates
and submits the accepted terminal node value; it forwards focus to the visible
trigger and supplies its canonical ID to Form summaries. It replaces the old
unchecked hidden input. Empty selection submits an empty string; traversing
branches does not satisfy required.

Nonempty paths must resolve completely, include no disabled nodes and end at a
leaf unless selectParents is enabled. Stale or ineligible supplied values fail
native validation rather than being silently replaced. Removing selectParents
restores its false default. Read-only permits browsing even with selectParents,
but rejects value changes. Read-only listboxes expose their state semantically.
Native read-only inputs are exempt from native required checks. Reset closes the
popup and restores the latest uncontrolled default; controlled owners keep their
values. Form edits are delivered after canonical value/constraints commit, so
refused requests retain server errors. Label-only/hint-only Field composition
also preserves the child's naming/error ownership.

A shared core bug was fixed: a disabled or missing explicit SELECT previously
could commit the previously highlighted neighbor when HIGHLIGHT was refused.
Selection now rejects such requests and disabled ancestors. The Svelte adapter
was not migrated; it benefits from this shared domain correction. New machine
regressions cover the invalid-click fallback and disabled-ancestor selection.
The conformance submission assertion checks the actual named input instead of
requiring type=hidden, which cannot enforce required.

The Cascader demo adds a form with required selection, a mock server error,
read-only region, disabled Fieldset, successful canonical submission and reset.
Composition and implementation notes describe the ownership. Live checks confirm
summary-to-trigger focus, required/server error presentation, clearing errors
after accepted selection, saving terminal values, disabled submission exclusion,
and unchanged read-only values.

Next: date/time native validation and Field composition. Phase 3 remains open.


Validation: 40 focused Cascader/machine/Form cases passed; the final broad run
reported 88 files, 2708 passed, 2 failed, 9 skipped. Those failures were an
unrelated React radio-group 5-second timeout and a Svelte Form summary-focus
assertion; all 8 matching radio/Form cases passed in an isolated rerun. An earlier
source-shape timeout passed in the final broad run. TypeScript/Svelte checks
passed (0 errors/warnings); docs production build passed. Automated browser suite
was not run; live Cascader form checks were completed. Broad-suite timing/focus
reliability remains a verification limitation; it was not hidden by changing
timeouts or editing unrelated tests.


### Date/time checkpoint: deterministic reset

Fixed React DatePicker, TimePicker and combined DateTime reset semantics before
adding native constraint ownership. A dedicated shared-core RESET event clears
pending text, invalid state and popup state without emitting a value-change
request. Date reset also cancels range anchor/hover. Ordinary SYNC_VALUE remains
unchanged so external synchronization does not indiscriminately discard drafts.
Controlled reset restores the owner's current value; uncontrolled reset uses the
latest default. Combined DateTime no longer resets to its mount-time default.
Svelte adapters were not migrated or changed.

Validation: five React DOM regressions and fifteen machine cases passed;
TypeScript no-emit check passed. Broad/browser suites were not rerun for this
bounded reset change. Native required/bounds/draft constraints and Field naming,
error and label composition for date/time remain next; phase 3 remains open.


### DatePicker native Field checkpoint

Single/range DatePicker now inherits Field ownership and native required,
readonly/disabled constraints through one Field.Control canonical input. It
validates unavailable endpoints, incomplete ranges and invalid/pending typed
drafts. Drafts commit on blur/Enter; programmatic submit blocks until acceptance.
Read-only calendar navigation remains available, selection requests are refused.
The DatePicker page contains a required/range/server-error/read-only/disabled
form specimen. Conformance assertions target the submitted input rather than
requiring unchecked type=hidden. Fourteen focused DOM cases and TypeScript
checks passed. TimePicker and combined DateTime constraints/ownership remain
next; phase 3 is open.


### TimePicker and DateTime native Field checkpoint

TimePicker now inherits Field name, canonical editor ID, label/error metadata,
required/read-only/disabled, and Fieldset disabled. One canonical Field.Control
validates/submits HH:mm. A private BaseField.Root isolates the Combobox editor
registration from the enclosing Field; no legacy DOM/event bridge was added.
Unavailable accepted times and uncommitted/invalid drafts block submission.
Off-step typed times remain valid within the accepted bounds.

Combined DateTime submits one YYYY-MM-DDTHH:mm field. Embedded time owns no
submission name/outer Field ID/constraint and reports its validity through a
private React context. Invalid time drafts and partially completed pairs block
submission; disabled/read-only apply to both editors. Date/time controlled
requests now revert to the owner's accepted value when refused. The controlled
DateTime update also avoids retaining a refused half for subsequent requests.
The TimePicker page adds required time/DateTime, mock server errors and read-only
composition. Existing conformance submission queries no longer demand hidden
input types that cannot enforce constraints.

Validation: 24 combined picker/reset DOM cases passed, followed by 10 time cases
including an additional optional partial-DateTime regression (25 unique cases).
TypeScript and Svelte passed with zero errors/warnings; docs production build
passed. Live demo checks covered required summary, typed off-step time, combined
canonical submission, mock server error and clearing it after accepted change.
Broad and automated browser suites were not rerun in this checkpoint.

Next: consolidated form/Field regression and remaining composition-contract audit
before closing phase 3, then the saved remaining primitive/package work. Leads
remains excluded; Svelte adapters remain unchanged.


### Consolidated form audit checkpoint

A consolidated run across Form workflow, custom native controls, choice groups,
Select, Combobox, Cascader and date/time/reset passed 96 cases in 10 files.
Four additional picker/Form integration cases confirm canonical summary focus,
server-error clearing after accepted edits, retention after refused controlled
edits and reset clearing. No browser or whole-library suite was rerun here.

The audit found and fixed numeric Fieldset disabled inheritance in NumberField,
Slider and RangeSlider. Explicitly disabled primitives now prevent custom
interaction as well as native form submission. Slider inherits Field read-only,
refuses value requests and exposes aria-readonly on its thumb. Two additional
numeric regressions passed with the existing form-composition tests (10 cases).

Phase 3 remains open specifically for RangeSlider's two-thumb/two-editor Field
ownership, naming, readonly and draft/reset contract. Treat it as a composite,
not a single native input. Next: settle and verify that boundary, then finalize
form metadata and move to phase 4. Do not mark form architecture complete yet.

Checkpoint verification total: 102 unique form/composition cases passed across
consolidated and targeted runs. Full TypeScript/Svelte checks passed (0 errors,
0 warnings). Docs production build and broad suites were not rerun this batch.


### RangeSlider compound contract and phase 3 completion

RangeSlider now owns two canonical endpoints, one aggregate Field.Control
constraint, and private isolated editor/slider Base UI boundaries. A named Field
owns both endpoint names; otherwise a scalar name submits repeated lower/upper
values or a tuple submits separately named endpoints. Editor drafts have unique
IDs, carry no submission names, and block submission while pending. Blur/Enter
retains existing clamping/step/domain commit rules; invalid/empty commits revert
to the accepted value. Reset clears drafts and restores latest defaults, with
controlled values remaining caller-owned. Field read-only applies to both
editors and thumbs; disabled Fieldset excludes both endpoints. Field label and
Form summary focus the first thumb; the compound group uses the Field label.
Upper-only edits notify Form after canonical commit, clearing server errors.

The initial regression run found a shared editor ID and mismatched submission
names under a named Field; both were fixed rather than weakening assertions.
The demo adds server-error, read-only, disabled and reset form composition.

Validation: consolidated 12-file form run passed 109 tests. Final RangeSlider
run passed 8 cases including an additional minimum-gap constraint regression
(110 unique cases across these runs). TypeScript/Svelte checks passed with zero
errors/warnings; docs build passed. Live demo confirmed server error, clearing
on upper-end change, canonical 20/90 submission, preserved read-only 10/50 and
disabled exclusion. Whole-library/automated browser suites were not rerun.
Earlier broad-suite intermittency and clean-consumer packaging remain release
checks, not evidence of release readiness.

Phase 3's planned form architecture/composite ownership work is complete.
Next: phase 4 counterpart decisions for Toast, Toolbar, Avatar, Progress, Meter,
Button and related groups, prioritizing actual interaction/semantic benefit.
Inventory, custom-boundary review and packaging/release checks remain open.
Svelte adapters and Leads were not changed.


### Phase 4 decisions and Avatar checkpoint

Reviewed actual React adapters rather than migrating for component coverage.
Button remains a native button: no substantial custom keyboard state exists.
ButtonGroup remains layout. Progress and Meter retain GGary formatted ARIA/bar/
ring presentation for now; semantic bounds merit a separate audit, not a blind
wrapper substitution. Named Toolbar currently installs attachToolbarKeys on
arbitrary descendants; Base UI migration needs explicit item registration while
preserving unnamed layout strips. Toast exposes a shared imperative store and
native top-layer presentation; queue ownership and the public imperative API
must be settled before replacing that behavior. Neither is migrated yet.

Avatar now uses Base UI Root/Image/Fallback. React-local image status/source
state and event handlers are removed. GGary retains initials, name/decorative
semantics, sizes, anatomy/styles and AvatarGroup composition. keepMounted loads
the real image in place; Base UI controls fallback visibility and image status.
Two behavioral tests cover no-image semantics, successful/failed loading, source
replacement and removing a loaded image. Tests and TypeScript check passed;
docs production build passed. No broad or live-browser checks were run here.

Demo metadata records these decisions explicitly. Next: Toolbar composition and
keyboard/focus migration, followed by Toast queue ownership. Phase 4 remains open.


### Range editor visual regression correction

Moved each private FieldEditorBoundary outside its InputGroup. The wrapper had
broken the kit's direct-child selector, so editors incorrectly retained their
own border/radius inside the group. The CSS contract is preserved without
broad descendant selectors or theme overrides. Live computed styles confirm
the editors are direct children with 0px borders/radius while the group retains
its border. Eight RangeSlider form regressions passed. Toolbar remains the next
phase-4 migration; this correction was prioritized after user visual feedback.


### Toolbar registered-item checkpoint

Named React Toolbar now uses Base UI Root and explicit ToolbarButton items.
attachToolbarKeys and its React effect/ref are removed from the Toolbar adapter.
ToolbarButton renders the existing GGary Button, preserving refs, styling,
native semantics and callbacks. Disabled items are skipped deliberately via
focusableWhenDisabled=false. Unnamed strips remain ordinary layout with native
Tab order. Separators/spacers remain presentational; Base UI owns horizontal/
vertical arrow navigation and looping. ToolbarButton is exported publicly.

This is an intentional composition API change: named toolbars must use registered
ToolbarButton actions rather than arbitrary native/Button descendants. The
Toolbar, Composer and Panel React examples and React conformance fixture were
updated. Input/link/toggle toolbar items are not claimed supported through
unregistered descendants; add explicit primitives when such cases are needed.
Svelte adapter untouched. Ribbon still calls attachToolbarKeys independently;
its custom-widget boundary remains a phase-5 audit item, not a completed Toolbar
migration. No React compatibility scanner or legacy event bridge was introduced.

Four focused DOM cases pass for horizontal/vertical roving focus, disabled skip,
wrapping, refs/click and unnamed native Tab order. Next: Toast queue ownership.

Toolbar checkpoint verification: TypeScript no-emit and docs production build
passed. Live demo confirmed Cut -> Copy with ArrowRight and Zoom in -> Zoom out
with ArrowDown. Four focused DOM cases passed; broad and automated browser suites
were not rerun. Toolbar's shared core helpers remain for Svelte/vanilla and Ribbon;
they are not installed by the migrated React Toolbar adapter.


### React Toast queue ownership checkpoint

React createToaster/toast/toaster now target Base UI Toast manager, and Toaster
renders its Provider/Viewport/Root/Title/Description/Action/Close parts. Core toast
machine/timers/subscription and GGary announcers are removed from the React path.
GGary retains ToastOptions vocabulary, tone icons, anatomy/CSS and native
popover top-layer placement. Existing toast/update/dismiss call shape maps to
Base UI commands; buffering before mount holds commands, not a parallel toast
state machine or timers. One mounted Toaster owns each React queue. Limits use
Base UI limited state rather than core oldest-toast eviction, and Base UI owns
pause, expiry, announcements, swipe/dismissal and removal after transitions.
Error defaults remain persistent; tone-changing updates set the appropriate
GGary default timeout. Ordering is adapted to existing placement CSS.

API boundary: import React createToaster from @ggary/react, not @ggary/core/toast.
The React store no longer exposes core getState/subscribe/pause/resume/custom
clock APIs. Active presentation belongs to its mounted provider; unmount ends
that presentation. Core/Svelte queues remain independent. This is not a mirror
of a core queue into a Base UI queue. React demo creates its own queue; the shared
Svelte data factory remains core-based. Public toast subpath exports are updated.

React conformance now tests the adopted Base UI contract instead of demanding
legacy core announcement markup/removal timing; Svelte keeps its original cases.
Dedicated React tests cover buffered add/update/upsert, timeout vs persistent
errors, action dismissal, limits/dismiss-all and hover/focus pauses. Live demo
confirmed creation, preserved tones/top-layer presentation and Undo dismissal.

Phase 4's listed counterpart decisions/migrations are complete: Toolbar, Avatar
and Toast adopted; Button/ButtonGroup/Progress/Meter deliberately retained for
now. No claim of whole-library migration or release readiness. Next: phase 5
custom-widget boundaries, starting with Ribbon's remaining attachToolbarKeys
usage and other framework interaction helpers; then inventory/packaging checks.

Toast checkpoint validation: 6 dedicated React DOM cases passed; targeted
conformance passed 2 new React Base UI cases and 9 unchanged Svelte cases
(17 unique cases across runs). TypeScript/Svelte checks passed (0 errors/warnings)
and docs production build passed. Live creation and action-dismiss checks were
completed; broad and automated browser suites were not rerun. Native top-layer
placement helper is retained solely for presentation; no core toast lifecycle
or event bridge remains in the migrated React Toaster.

### Phase 5: Ribbon boundary checkpoint

React Ribbon now uses Base UI Tabs with automatic activation and the migrated
Toolbar for explicitly registered ToolbarButton actions. Removed React usage of
attachToolbarKeys and focusTab. Mixed Select/SegmentedControl groups opt out of
managed toolbar behavior and retain ordinary named group semantics. Shared
selection requests and custom horizontal scroll/fade layout remain GGary.
Native button resets preserve the former div-tab presentation in both adapters.

Focused Ribbon/Toolbar coverage: automatic tab selection, group arrow navigation,
controlled refusal, mounted panels and mixed-group semantics. Phase 5 remains
open. Audit Shell drawer and Anchor panel next, then remaining domain helpers
(drag/drop, palette sources/hotkeys, log tail, autosizing and mnemonics). Such
helpers are not legacy bridges merely because they attach DOM listeners.
Inventory completion and clean-consumer/package validation remain release gates.

### Consumer docs and Anchor boundary checkpoint

Demo pages now show a small foundation badge, practical usage guidance where
needed, and collapsed implementation details. Migration decisions stay out of
the consumer UI; this plan remains the migration progress record.

React Anchor floating lists use Base UI Popover for dismissal, focus and
positioning. Removed attachAnchorPanel from React. Native section links,
scroll tracking, responsive folding and accepted/refused state remain GGary.
The popup stays in its navigation host to preserve local theme/layout scope.
Live checks cover opening a second instance and Escape focus restoration.
Shell still uses attachShellDrawer for modal behavior; its responsive drawer
is the next boundary to migrate. Phase 5 remains open.

### Demo cleanup and overlay regressions

Removed expanded ownership details and explanatory text from the demo header;
only the small foundation badge remains. Removed automatic context-menu opening
on page entry. Keyboard invocation supplies target coordinates instead of (0,0).
Keep-mounted menus honor hidden explicitly. Inline command palettes wait for their
portal host, size to the container and omit modal margins. Their demo uses a
content-sized stage rather than a fixed-height frame. Shell migration remains
pending; the unfinished experiment was reverted before this checkpoint.

### Shell mobile drawer boundary checkpoint

React Shell uses Base UI Dialog for the narrow-screen drawer. Removed React
attachShellDrawer usage. A persistent portal inside the Shell retains sidebar
DOM/state while a display-contents column preserves grid layout. Desktop/bar
modes expose ordinary complementary navigation without modal focus management.
GGary retains resize-close requests, navigation-close callbacks and layout.
Structure/theme selectors support both the direct Svelte sidebar and React's
portal column. Focused checks cover toggle/Escape/navigation, controlled refusal,
and sidebar draft preservation across resize. Phase 5 remains open: remaining
domain helper/inventory audit precedes packaging and clean-consumer checks.

### Remaining helper and export audit

Recorded retained domain/layout helpers in packages/react/BEHAVIOR-BOUNDARIES.md.
No React references remain to the replaced toolbar, Anchor or Shell interaction
helpers; the backend contract test now guards those boundaries. Menubar mnemonic
synthetic-key integration is explicit remaining debt, not hidden as fully native.
Fixed export-parity checks to exclude type-only exports and recognize deliberate
React ToolbarButton registration. Packaging is next: current source/private
packages are not distributable artifacts. The full component inventory and
release verification remain open; this checkpoint is not a release declaration.

### Compiled release candidate and clean-consumer checkpoint

Added build:react-packages and smoke:react-packages. Each build creates fresh,
git-ignored release candidates for React/core/icons/structure/theme without
changing development source exports. JavaScript and declarations resolve
relative imports with explicit ESM extensions. Icon runtime helpers accompany
compiled exports; theme tokens expose JavaScript and declarations.

The smoke command packs all five candidates, installs their tarballs in a fresh
temporary directory outside the workspace, checks consumer TypeScript, builds a
Vite app importing CSS/root/component subpaths, and imports runtime exports in
Node ESM. The first smoke caught a missing glyph.mjs beside compiled icon code;
the build now copies that helper. These are private 0.0.0 candidates, not a
published release. Browser consumer automation, full inventory completion and
CSS payload review remain open.

Clean-consumer rerun passed all three gates: TypeScript, Vite production build,
and Node ESM root/subpath imports. Also fixed extension normalization for dotted
module names such as button.anatomy. Consumer CSS: 371.72 kB raw / 44.11 kB gzip;
fixture JavaScript: 386.66 kB raw / 126.11 kB gzip (includes React and demonstrated
controls). These are fixture measurements, not isolated package payload sizes.
Ten package/backend contract tests also passed. Next: browser consumer coverage,
CSS payload review and remaining inventory/mnemonic integration debt.

### Packaged consumer browser checkpoint (2026-10-12)

The clean-consumer smoke now serves the installed tarballs' production build in
headless Chrome. It checks required-field rejection and summary focus, accepted
submission, reset, ToolbarButton arrow focus, Select selection inside a Dialog,
inner Escape isolation, dialog focus return, Tab containment and outside-click
dismissal. Runtime exceptions and failed HTTP resources fail the check. A browser
screenshot is saved next to the candidate artifacts. The consumer installs only
packed GGary dependencies; the test driver remains repository tooling.

This is representative consumer coverage, not a complete component/browser
matrix. CSS payload review, inventory completion, Menubar mnemonic integration
debt and final release-manifest decisions remain open. Svelte migration remains
separate. Development manifests still export source; nothing was published.

Complete smoke rerun passed types, Vite build, Node ESM imports and all consumer
browser checks. Next: Menubar mnemonic integration cleanup.

### Menubar mnemonic checkpoint (2026-10-12)

Removed simulated ArrowDown dispatch from React Menubar. Alt mnemonics activate
Base UI's native trigger; directly forcing controlled open alone did not initialize
its list-navigation index reliably, so it was not retained. Repeated shortcuts
focus the first enabled row without duplicate open callbacks. Base UI retains
ordinary menu interaction. Global mnemonic/F10 recognition stays a deliberate
GGary extension. React-only regression covers repeat, disabled and switching keys;
existing Svelte semantics are unchanged. A contract guards against synthetic keys.
27 Menubar conformance cases and 11 package/backend contracts passed. Added the
mnemonic path to the installed-package browser fixture; full smoke verification
is the completion gate. Next: component inventory and CSS payload review.

Full installed-package smoke passed types, production build, Node ESM imports
and browser checks including Alt activation, repeat navigation and Escape return.

### Inventory and CSS review checkpoint (2026-10-12)

Recorded all 96 React component directories in component-inventory.json: direct
Base UI primitives, internal composition and retention decisions. 34 directories
import Base UI directly; indirect wrappers must not be counted as independent
legacy implementations. This completes ownership enumeration, not a blanket
component accessibility audit. Package contract coverage prevents missing new
directories. Removed unused demo prose generator after user requested badge-only
pages.

Added audit:react-foundation to regenerate the inventory and minified/gzip CSS
measurements through Vite. Full theme is 371,718 / 44,113 bytes; structure alone
79,644 / 10,744; icons alone 42,157 / 4,296. Default CSS is deliberately full-kit;
JavaScript tree shaking does not imply stylesheet tree shaking. Keep the working
full entry; optional subsets require a shared-style dependency map. CSS review
is complete at this boundary, with no speculative splitting introduced.

Remaining React foundation release work: make final distribution manifests and
version policy concrete, wire release gates into CI, and run the consolidated
required checks. Optional granular CSS and exhaustive widget accessibility audits
are follow-up work, not covered by this migration. Svelte remains separate.

### CI and consolidated release gate checkpoint (2026-10-12)

Added verify:react, a fail-fast sequential runner for type checks, all
machine/contract/DOM tests, theme checks, docs build, inventory/CSS audit and
installed-package browser smoke. Added a read-only GitHub Actions workflow for
PR/main/codex branches using Node 24 and Chromium. It checks inventory drift and
retains candidate artifacts/screenshots for seven days. No publishing job exists.
Compiled candidate manifests stay private and pin sibling GGary versions.

The first full run reported 2,761 passes and six failures. Corrected a real
DatePicker regression: readOnly=false had overwritten disabled preset props.
RangeSlider's secondary submission input now has an explicit anatomy marker.
Updated DateTime tests to verify canonical named inputs rather than insist on
input[type=hidden]; canonical constraint inputs are visually hidden instead.
The attribute-forwarding scanner distinguishes internal Base UI render-prop bags
from consumer props in Field/Toaster. Shell conformance waits for asynchronous
focus completion. All 31 targeted cases passed after these corrections. Some
legacy conformance tests still emit React act warnings; do not claim warning-free
verification. The complete gate rerun is the completion check.

Complete verify:react rerun passed: TypeScript/Svelte (zero diagnostics), 100 test
files with 2,767 passed / nine skipped, theme checks, docs production build,
inventory/CSS audit, candidate version/private assertions, clean consumer types,
Node ESM imports, production build and real-browser interactions. React act
warnings remain in some legacy conformance cases. Hosted CI has been configured
but not executed on GitHub; these changes are local and uncommitted. Candidate
policy is private 0.0.0 artifacts with pinned sibling versions. A public version,
registry and publishing authorization remain separate from this migration.


### Review corrections (2026-10-12)

The branch's hosted verification passed on run 38231981152. The subsequent
review found a Shell SSR regression: the Dialog portal omitted navigation from
server HTML. Shell now emits an inline aside until the client host is available,
with the same initial responsive snapshot for SSR and hydration. Public Base UI
portals remain client-only, so sidebar children remount once when transferred to
the portal; consumers must keep persistent draft state above Shell if it must
survive that initial handoff. Desktop/mobile resizing retains the mounted sidebar.
No legacy drawer bridge or private Base UI internals were introduced.

The docs header now places colour-mode settings on a second row below 540px,
with matching navigation and scroll offsets. At a 390px viewport the document
width is 390px (previously 456px); both settings groups remain visible.

Validation: 11 targeted Shell DOM/conformance tests passed, including server
markup/hydration, controlled dismissal and responsive state retention. Full
TypeScript/Svelte checks and clean installed-package types/build/ESM/browser
smoke passed. Responsive header verified in the running docs browser.


### Packaged server-rendering gate (2026-10-12)

Hosted CI passed for review correction 17f17b2 (run 38235586015). The clean
consumer smoke now also runs React server rendering in a real Node process with
no window/document globals. It asserts Shell brand/navigation and all landmarks
for drawer/bar and open/closed variants, plus the no-column case. This guards the
compiled installed artifact rather than only the workspace source under jsdom.
The one-time sidebar remount remains a documented public-portal constraint.

The planned React migration is complete. Next development phase is the separate
Svelte foundation decision; public release version/registry and publishing are
still separate decisions. Detailed accessibility audits remain follow-up work.


### Svelte foundation pilot (2026-10-12)

The React branch was merged and pushed to main at dc81d41. Svelte now has its
own migration branch and plan in SVELTE-FOUNDATION-PLAN.md. The first batch is
Dialog/Sheet and Select on Bits UI; shared styling supports both foundations.
This is a pilot, not a completed Svelte migration or a publishing step.
