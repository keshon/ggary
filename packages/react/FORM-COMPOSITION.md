# React form composition

GGary Form is a deliberate native HTML + GGary implementation. Base UI owns
Field constraint computation and standard control interaction. Form owns async
rules, submission, returned server errors, and summary-first focus. There is no
second Base UI Form provider or legacy DOM event bridge.

## One control

Use Field around one GGary/Base UI control. Name the Field when it participates
in Form rules or server errors. Names must be unique per logical field.

```tsx
<Form onSubmit={data => save(data)}>
  <FormSummary />
  <Field name="email" label="Email" required>
    <Input type="email" />
  </Field>
  <Button type="submit">Save</Button>
</Form>
```

GGary controls already register with Base UI Field. Do not wrap Input, Checkbox,
Switch, Select, or another Base UI primitive in FieldControl; registering a
control twice gives validation and focus two competing owners.

## A custom native control

FieldControl is an unstyled registration adapter for one native input, textarea,
or select. It inherits Field metadata and preserves Base UI handlers and refs.
Pass value/defaultValue, constraints, and onValueChange to FieldControl. Its
callback takes a string. Its ref points to the rendered native element.

```tsx
<Field name="code" label="Project code" required error="Use APP-123 format">
  <FieldControl
    pattern="[A-Z]{3}-[0-9]{3}"
    render={<input data-scope="input" data-part="root" />}
  />
</Field>
```

The input scope above deliberately opts into GGary input styling. A custom
renderer may supply its own anatomy/presentation. Render functions must forward
all supplied props and the ref to the actual native control. Custom component
wrappers must do the same. Native select has no readonly capability; use disabled
when selection must be unavailable. FieldControl is not a registration adapter
for arbitrary div-based widgets or hidden-input composites.

useFieldControl returns metadata only. Spreading it on a raw input does not
register that input with Base UI validation. Use FieldControl for native elements;
use the existing Base UI primitive for a standard interactive widget.

## A group

Use Fieldset for option groups rather than putting multiple inputs in Field.
A named Fieldset represents one logical form field; its child option group
inherits that name unless given its own. The summary links to and focuses the
fieldset, announcing its legend and error.

```tsx
<Fieldset name="channels" legend="Channels" required error="Pick a channel">
  <CheckboxGroup items={channels} />
</Fieldset>
```

Required CheckboxGroup means at least one enabled checked option. Required
RadioGroup means one enabled selection. Standalone named groups register their
own root for rules/server errors and summary links. To group several independent
fields visually, leave Fieldset unnamed and name each child separately.

## Submission and edits

Form sends a FormData snapshot, including repeated checkbox values and the
submitter. Native constraints run before async rules. Without onSubmit, a valid
form submits to its native action. After async rules, changed native-submit
values restart validation and changed constraints are checked again. Promise-based rules run on submit; synchronous
rules also run after accepted edits once submission has been attempted.

Edits are coalesced into one task after React commits. A refused controlled
change does not clear a server error or validate an unaccepted value. Custom
hidden-input composites use useFormField(...).edited(element) to notify Form;
this is React context delivery, not a custom DOM event. Raw native controls
already notify through normal input/change events.

Reset clears error disclosure and ignores late validation/server results.
Uncontrolled controls return to their defaults; controlled values remain owned
by the caller. Validation exceptions become form failures and allow retry.

## Remaining integration audit

Select now inherits the surrounding Field's name, control ID, label/error
metadata, required, disabled and readOnly settings. Field owns its Form summary
registration and error disclosure. A disabled Fieldset also disables Select.
Read-only Select follows Base UI semantics: users can browse options, but cannot
change the value. It keeps one canonical submitted value. Field blur ignores
focus moving into a popup referenced by its control's aria-controls.

Combobox uses the same Field ownership and disabled Fieldset inheritance.
Required checks the accepted selection, not its search query; multiple mode
requires at least one selection. Base UI owns canonical submission inputs:
single selection submits one scalar (an empty string when unselected), multiple
selection submits one entry per value (no entries when empty). Search text is
never submitted. The nameless multiple-selection validation input carries a
reference to the visible control so GGary Form can use its registered label,
error message and focus target without adding a fake submission name.
The previous React single-selection empty state omitted the
entry; consumers should treat both missing and empty values as unselected.
Read-only permits browsing but blocks typing, clearing, chip removal, Backspace
removal, selection and creation. Switching to read-only ignores pending creation results.

Cascader also inherits Field naming, label/error metadata, required, disabled and
readOnly state; disabled Fieldset applies. GGary retains tree selection while
Base UI Field.Control registers one visually hidden native text input for
constraint checking and submission. It submits the accepted terminal node value,
not the complete path or the browsed/highlighted branch. Empty selection submits
an empty string. The input redirects focus to the visible trigger and carries
its canonical ID for Form summaries. A type="hidden" input cannot enforce required.

Nonempty paths must resolve completely, contain no disabled nodes, and end at a
leaf unless selectParents is enabled. Ineligible externally supplied or stale
paths fail native validation; the accepted value is not silently replaced.
Read-only permits tree browsing, including branches with selectParents, but
refuses selection. Native read-only controls are exempt from required validation.
Reset closes the popup and restores uncontrolled defaults; controlled values
remain caller-owned. Accepted edits notify Form through React composition context.

Other composite controls such as calendar pickers have their own label/error slots and
Form registration. Their Field/Fieldset naming, readonly/disabled inheritance,
and native constraint capabilities still need an explicit cross-control audit
before the whole form phase is declared complete. Packaging and a clean consumer
installation remain separate release checks.


DatePicker (single/range) inherits Field name, canonical editor ID, label/error
metadata and required/disabled/readOnly, plus Fieldset disabled. One clipped
native Field.Control submits the canonical ISO value and forwards focus to the
editor. Required selection, unavailable endpoints, incomplete ranges and pending
or invalid drafts fail native validation. Drafts commit on blur/Enter; programmatic
submission cannot silently submit an older accepted date. Read-only permits
calendar browsing but refuses edits and presets. Disabled selections are excluded.
Combined DateTime/TimePicker composition remains under audit; do not infer its
completion from the single/range DatePicker contract.


TimePicker follows the same canonical selection contract: one Field.Control
validates/submits HH:mm, while Base UI Combobox supplies the popup boundary.
A private BaseField.Root isolates Combobox editor registration from the enclosing
Field; the canonical control remains registered in the outer Field. This is a
React composition boundary, not a DOM/event bridge. Unavailable supplied times
and uncommitted/invalid drafts block submission. Off-step typed times remain
accepted when within min/max and not disabled.

DateTime owns one YYYY-MM-DDTHH:mm input. Embedded time has its own editor ID,
no name/constraint/outer-label ownership, and reports draft validity through a
private React context. A partially completed pair is invalid; required also
blocks a completely empty pair. Disabled/read-only affect both editors. Date
and time controlled requests revert to the owner's accepted values if refused.


Numeric controls inherit disabled Fieldset state into their Base UI primitives.
Slider inherits read-only Field state and refuses pointer/keyboard value-change
requests while preserving submission; its thumb exposes aria-readonly. Native
range inputs do not implement HTML readonly, so this is an explicit adapter rule.
RangeSlider's two-editor/Field naming and read-only/reset boundary remains under
audit; do not assume the single-input Field contract extends to all its children.


RangeSlider compound contract: a named Field owns both endpoints under its name
(in lower/upper order). Without a named Field, name="range" submits two values,
or name={["lower", "upper"]} submits separately named endpoints. Draft editors
and Base UI slider internals are isolated from the outer Field's name/ID through
private React context/BaseField boundaries. Only one Field.Control registers
aggregate constraints; a second hidden input submits the upper endpoint. Both
canonical inputs are excluded when disabled. Drafts never submit as additional
values. Pending drafts block submission until blur/Enter; invalid/empty number
commits revert to accepted values, matching the existing domain policy.

The first thumb receives the Field's canonical ID and summary/label focus; the
other thumb and each editor have distinct IDs. Errors/hints describe both
editors/thumbs. Read-only refuses both editor and thumb changes. Reset clears
both drafts and restores latest defaults, while controlled values remain owned
by the caller. Upper-only accepted edits also notify the Form after canonical
values commit, so server errors clear consistently. minGap violations fail the
aggregate constraint; the domain's existing clamping/ordering policy remains.
