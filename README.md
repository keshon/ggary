# ggary-ui

A UI kit scaffold: one framework-agnostic core, three sibling renderers (vanilla
custom elements, React, Svelte 5), and two design languages on top of it.
Forty-four components — DataGrid, Button, ButtonGroup, Chip, ChipGroup, Select, Field,
Fieldset, Input, InputGroup, Search, Textarea, Checkbox, CheckboxGroup, Switch,
RadioGroup, ChoiceCardGroup, SegmentedControl, Slider, NumberField, FileDrop, Tabs,
Breadcrumbs, Nav, Pagination, Steps, Toolbar, Dialog, Sheet, Popover, Tooltip, Toast,
Menu, Menubar, Badge, Avatar, AvatarGroup, Spinner, Skeleton, Card, Panel, Banner,
Note and EmptyState — built end to end to prove the architecture holds.

The two themes are **GGarry**, the kit's own neutral language, and
**Instrument**, ported from [keshon/instrument](https://github.com/keshon/instrument)
to test whether a strict, opinionated language can live on this spine without
becoming a monolith again.

**Instrument is frozen.** It styles the forty-three components it has, and the
gates keep checking every one of them; components added after the freeze — the
data grid onward — are GGarry's only. It stays because a second theme is what
proves structure and look are really apart: it found bugs in the shared layer
that GGarry alone never would have (an auto margin that loses to a theme's
reset, a `display` rule that showed a closed menu).

```bash
npm install
npm run dev      # http://localhost:5180 — three pages, same demo
npm test         # 2434 tests, 967 of them in headless Chrome
npm run test:fast  # the same without the browser: node and jsdom only
npm run typecheck
npm run check:themes   # the theme gates as a readable report; -- -v for every row
```

`index.html` is vanilla, `react.html` is React, `svelte.html` is Svelte. The
header is static markup on all three, so anything that differs below it is the
components' doing. The header also switches theme and each theme's own axes; the
choice persists across the three pages.

## Layout

```
packages/
  core/              machine + connect + anatomy. No framework imports. One dependency.
  structure/         CSS a component needs to WORK, shared by every theme
  theme-ggarry/      GGarry: JSON tokens -> CSS, component CSS, the --gg-* contract
  theme-instrument/  Instrument: OKLCH token tiers, component CSS, the --gg-* contract
  icons/             glyph SVGs -> --gg-icon-* tokens; the shared glyph compiler
  checks/            the theme gates: structure and contrast, run on every theme
  elements/          <gg-button>, <gg-chip>, <gg-chip-group>, <gg-select>, <gg-field>, <gg-input>,
                     <gg-textarea>, <gg-checkbox>, <gg-switch>, <gg-radio-group>, <gg-dialog>, <gg-sheet>,
                     <gg-popover>, <gg-tooltip>, <gg-menu>, <gg-menubar>, <gg-fieldset>,
                     <gg-checkbox-group>, <gg-tabs>, <gg-toaster>, <gg-badge>, <gg-avatar>,
                     <gg-avatar-group>, <gg-spinner>, <gg-skeleton>, <gg-card>, <gg-panel>,
                     <gg-banner>, <gg-note>, <gg-empty-state>, <gg-segmented-control>,
                     <gg-slider>, <gg-number-field>, <gg-choice-cards>, <gg-search>,
                     <gg-input-group>, <gg-file-drop>, <gg-button-group>, <gg-breadcrumbs>,
                     <gg-nav>, <gg-pagination>, <gg-steps>, <gg-toolbar>
  react/             <Button>, <Chip>, <ChipGroup>, <Select>, <Field>, <Input>, <Textarea>,
                     <Checkbox>, <Switch>, <RadioGroup>, <Dialog>, <Sheet>, <Popover>, <Tooltip>,
                     <Menu>, <Menubar>, <Fieldset>, <CheckboxGroup>, <Tabs>, <Toaster>,
                     <Badge>, <Avatar>, <AvatarGroup>, <Spinner>, <Skeleton>, <Card>,
                     <Panel>, <Banner>, <Note>, <EmptyState>, <SegmentedControl>,
                     <Slider>, <NumberField>, <ChoiceCardGroup>, <Search>, <InputGroup>,
                     <FileDrop>, <ButtonGroup>, <Breadcrumbs>, <Nav>, <Pagination>,
                     <Steps>, <Toolbar>
  svelte/            the same components as React
apps/sandbox/        the three demo pages
tests/               machine (node) · contract (node) · conformance and elements (jsdom)
```

## How one component reaches three frameworks

`core` exports a `connect(state, send, normalizeProps)` that turns machine state
into plain prop bags. Each adapter passes its own normalizer and spreads the
result into its own markup.

```
              +-- reactNormalizer  --> <button {...api.triggerProps}>     (React)
connect() ----+-- svelteNormalizer --> <button {...api.triggerProps}>     (Svelte)
              +-- domNormalizer    --> spread(el, api.triggerProps)       (vanilla)
```

`normalizeProps` is the piece that makes this work at all. Prop bags do not
spread cleanly across frameworks — React wants `onClick`/`className`, Svelte 5
wants `onclick`/`class`, the DOM wants `addEventListener` plus `setAttribute`.
`connect()` emits one canonical shape and the normalizer translates. Without it
you get three divergent copies of `connect()`, which is the thing this
architecture exists to prevent.

Markup is still written once per framework. That duplication is the deliberate
price of not using a compiler — about 60 lines per component per adapter, all of
it readable.

## The contract

Three rules every component obeys, so themes and third-party components can
participate without importing any JS:

1. Every node carries `data-scope` and `data-part`. No theme stylesheet targets a
   class name, and the components emit none — `tests/select.dom.test.ts` asserts
   this.
2. Every state is a data attribute: `data-state="open"`, `data-highlighted`,
   `data-disabled`. CSS is a pure function of DOM state. Notably the Select's
   highlight is driven by machine state, never `:hover`, so mouse and keyboard
   cannot disagree about which option is active.
3. Every visual value comes from a token. Components hardcode no colors or sizes.
   Per-component custom properties (`--button-height`, `--btn-bg`) are the
   override surface.
4. Variants are named by **intent**, never by look: `emphasis: high | medium |
   low | minimal`, `tone: neutral | danger`. A look-named variant like `outline`
   is a lie in any theme whose language forbids outlines; an intent is a question
   every theme can answer its own way.

No shadow DOM. `data-scope` gives most of the encapsulation without breaking
theming, global CSS, or SSR.

## Themes

A theme is a package that owns **tokens and component CSS**. It shares with every
other theme exactly three things, and nothing else:

1. **The DOM contract** — anatomy parts and state attributes, emitted by core.
2. **The cascade layers**, identical in every theme:
   `gg.tokens, gg.structure, gg.base, gg.components, gg.forced, gg.motion`.
   Application CSS lives outside every layer and so always wins, with no
   `!important`, whichever theme is loaded.
3. **The public contract** — a short list of `--gg-*` custom properties
   (`--gg-page`, `--gg-surface`, `--gg-text`, `--gg-border`, `--gg-accent-text`,
   `--gg-font-sans`, …) that each theme maps onto its own private tokens.
   Application layout reads only these and survives a theme switch. The sandbox
   chrome is written against nothing else, which is how the contract is tested:
   it stays readable in both themes and every mode.

A theme's private tokens can have any shape. GGarry's are `--ggarry-*`, generated
from JSON; Instrument's are its own four-tier OKLCH vocabulary (`--surface-page`,
`--accent-solid`, `--control-h-md`). Neither leaks into the other.

**A project picks one theme** by importing one stylesheet. Within a theme, the
theme's axes are runtime attributes on any subtree:

| Theme | Axes |
|---|---|
| GGarry | `data-mode`: light · dark (default: system) |
| Instrument | `data-mode`: light-neutral · light · light-cool · dark · dark-soft<br>`data-accent`: petrol · graphite · indigo · clay<br>`data-density`: compact · regular · comfortable<br>`data-scale`: 14 · 15 · 16 · 17 · 18 |

The sandbox is the one place that swaps whole languages at runtime, purely so a
page can be compared across them. It mounts one theme stylesheet at a time —
two loaded at once would fight over the same selectors.

### `@ggary/structure`

The CSS a component needs to function in every theme: the positioner's absolute
placement and closed state, the listbox scroll, the chip list's flex and
orientation. It exists because the port found these rules duplicated inside both
themes' component CSS. The test for a rule belonging here: would the component be
*broken* without it in every theme? A closed listbox that still takes space is
broken; a listbox with no shadow is a different theme.

### Icons

Core **names** a glyph, a theme **draws** it, and adapters do neither:

```
core       data-icon="check" on a part               (types: IconName from @ggary/icons)
structure  [data-icon] { mask: var(--gg-icon); background: currentColor }
icons      svg/check.svg -> --gg-icon-check: url(data:…)  +  [data-icon=check] -> --gg-icon
theme      --gg-icon-check: url(data:…)                (optional override, same layer, later)
adapter    <span {...api.getItemIndicatorProps()} />   (no SVG anywhere)
```

A glyph is a mask filled with `currentColor`, so it always takes the colour of
the text around it, and a theme recolours it the way it recolours text. Instrument
ships its own drawings of the three glyphs on its own grid and stroke; GGarry uses
the defaults. Adding a glyph is one SVG file — no adapter changes.

One rule came from Instrument the hard way: **a mask clips everything on its
element, pseudo-elements included.** A part that carries an enlarged tap area in
`::before` cannot also be the glyph. That is why chip has `remove` (the target)
and `remove-icon` (the drawing).

`npm run assets` compiles the glyph sets and GGarry's tokens; `dev`, `test` and
`typecheck` run it first.

### Porting Instrument: what it took, and what it found

The token system came across **mechanically**: `tokens.css` was split by tier into
nine files by line range, with every value and every comment intact. The only
edits were `data-theme` → `data-mode` and the `.inst-theme` class → an attribute
selector. The component CSS was **re-authored** onto anatomy selectors, keeping
Instrument's decisions and shortening its reasoning, with pointers back to the
original files.

What the port changed in the spine, because Instrument was right:

- **Loading is not disabled.** A busy button stays focusable; disabling it drops
  it out of the tab order under the fingers of whoever pressed it from the
  keyboard. Core now emits `aria-busy` without `disabled`.
- **Variants became intents.** Instrument's measured "weights" answer *how loudly
  does this ask to be pressed*. GGarry's old `solid/subtle/outline/ghost/danger`
  answered *what does it look like*, and could not be mapped onto a theme that
  forbids outlines.
- **Structural CSS moved out of the themes** into `@ggary/structure`.

What differs between the two languages, on identical markup:

| Decision | GGarry | Instrument |
|---|---|---|
| medium button | neutral outline | a recess: no border, no shadow |
| high + danger | solid red | accent fill — no solid red, by rule |
| busy button | inline spinner part | label dimmed, a ring in `::after`; the spinner part is hidden |
| standalone chip | pill, emphasis levels | a tag; emphasis levels drawn alike |
| selected option | check mark, bolder label | check mark only; weight never changes |
| document | styles kit components only | styles the whole document (`* { margin: 0 }`, body type, scrollbars) |

What the first full render caught: a vertical ChipGroup rendered centred in
Instrument. Its chips size themselves with `align-self: var(--flow-self, center)`,
which outranks the structure layer's `align-items: flex-start`. The fix is
Instrument's own hook, set on the vertical list — a theme bug, not a structure
bug.

## The first four components, and why these four

| | State | Focus model | What it proves |
|---|---|---|---|
| Button | none | — | the stateless path: `core` contributes only an attribute contract |
| Chip | none | — | that contract is shareable: `chipAttrs` is reused verbatim by ChipGroup |
| Select | machine | `aria-activedescendant` — focus parks on the trigger | async positioning, dismiss, form value |
| ChipGroup | machine | roving tabindex — real focus moves between chips | shared collection traversal, focus as an explicit intent |

Select and ChipGroup deliberately use the two *different* focus models, because
they are the two you actually have to pick between, and they put different
demands on the architecture. `aria-activedescendant` needs no DOM work at all —
`connect()` just emits an id. Roving tabindex needs someone to call `.focus()`,
which is why `ChipGroupState.focus` carries a `nonce` and not just an index: the
machine has to be able to say "move focus *now*" as distinct from "the current
chip is N". Without that distinction every re-render re-focuses.

Adding component three and four is also where `utils/collection.ts` fell out.
Select and ChipGroup both walk a list skipping disabled entries; they differ by
one flag (`loop`), because a toolbar wraps and a native `<select>` clamps. Before
ChipGroup existed, extracting that would have been speculation.

## Field and Input

Two components, split where the responsibilities split:

| | State | Owns |
|---|---|---|
| Input | none — the value lives in the native `<input>` | the attribute contract (`data-size`, `data-invalid`) and `onValueChange` |
| Field | machine | the label, the hint/error slot, the ids between them, and *when* an error shows |

Input has no machine because every framework already knows how to own an input's
value: React with `value`/`defaultValue`, Svelte with `bind:value`, the browser
with the element itself. A machine would be a second copy to keep in sync.

```tsx
<Field label="Email" hint="We never share it" error="Enter a valid address" required>
  <Input type="email" name="email" />
</Field>
```

```html
<gg-field label="Email" hint="We never share it" error="Enter a valid address">
  <input type="email" name="email" required>
</gg-field>
```

**Composition is a prop bag, merged.** Field publishes `control` — canonical,
un-normalized props: the control's id, `aria-describedby`, `aria-invalid`, and
blur/input/invalid handlers — through context (React, Svelte) or directly (the
element). Input merges it with its own using `mergeProps` from core, then
normalizes once. Merging rather than spreading matters because both sides add an
input handler, and a caller's own `onBlur` has to run alongside the field's
validation instead of replacing it. `mergeProps` chains handlers, joins token
lists (`aria-describedby`, `class`), and otherwise lets the later bag win.

**Validation follows the `:user-invalid` rule.** The constraint is the browser's
own — `required`, `type="email"`, `minlength` — read from `validity`. What the
machine decides is timing:

- no error while the user types into a field for the first time, however invalid;
- an error when they leave it, or when a submit attempt fires `invalid`;
- once shown, it clears live as the value is fixed;
- `invalid` from the owner (a server said the name is taken) shows at once.

The hint and the error share one slot: the error *replaces* the hint, so the
layout does not jump, and `aria-describedby` follows whichever is visible. The
required marker is theme CSS (`label[data-required]::after`, with empty alt text
so it is not read as "star"), not markup.

For inline errors without the browser's bubble on top, put `novalidate` on the
form and call `form.checkValidity()` in the submit handler: it still fires each
control's `invalid` event, which is what the fields listen to. The sandbox's
validated form does exactly that.

**In the elements, the outermost enhancer owns the control.** `<gg-input>` inside
a `<gg-field>` does nothing; the field applies the input contract itself and reads
the wrapper's `size`. Two elements spreading props onto one `<input>` would each
strip the other's attributes on every render. `<gg-textarea>` stands down the
same way, and a wrapper whose attributes change asks the field to render again
(`refresh()`). `<gg-field>` also accepts a bare `<select>`, labelling and
validating it without a contract of its own, and adopts an `id` the page gave
it — the host *is* the field root.
Flags may sit on the field or on the control's own markup; the markup is read
once, at connect, because afterwards those attributes are the field's own output
and reading them back would make `disabled` impossible to remove. A test caught
exactly that.

## Textarea

Input's shape — no machine, the value in the native element, Field props merged
in — plus the two things only a textarea has:

```tsx
<Field label="Notes" hint="Grows with the text, up to 8 lines">
  <Textarea rows={2} autoResize maxRows={8} />
</Field>
```

```html
<gg-field label="Notes">
  <gg-textarea autoresize max-rows="8"><textarea rows="2"></textarea></gg-textarea>
</gg-field>
```

**A resting height.** Both themes size a textarea from the control height of its
size — two and a half controls tall, Instrument's definition — so it keeps scale
with the inputs and buttons in its row. `rows` can make it taller, not shorter.
Themes share one rule set for the field look: `input.css` styles
`:is([data-scope='input'], [data-scope='textarea'])`, and `textarea.css` holds only
what differs. Two copies of the state rules would drift.

**Auto-resize**, from `rows` up to `maxRows` lines, then it scrolls. It needs the
DOM, so it lives in core as `attachAutosize` — like `attachPositioner` — and the
adapters only attach and destroy it; `connect()` returns `autosize` options or
null. The resize handle turns off while it is on (`data-resize="none"`, applied by
`@ggary/structure`), since the next keystroke would undo a drag.

It is JS rather than `field-sizing: content`, which has no max-rows and is not in
every browser a kit supports. The measure collapses to `height: auto` and reads
`scrollHeight`, which is what lets a textarea shrink as text is deleted.

A height is only right for the metrics it was measured under, and most of the
ways those change fire nothing on the textarea: switching theme, mode or density,
a stylesheet loading, a web font arriving after the first paint. The sandbox
showed it — type five lines, switch theme, and the old height stayed. So one
shared watcher (attributes on `<html>`, stylesheet changes in `<head>`,
`document.fonts`) re-measures every live instance in a microtask. A change scoped
to a subtree is not watched; call `update()` (`measure()` on `<gg-textarea>`)
after one, and after setting a value from code in the custom element.

## Checkbox, Switch and RadioGroup

All three are native inputs, so keyboard, form submission, label clicks and what
a screen reader announces come from the browser. None has a machine: the checked
state is the input's, owned by the adapter the way Input's value is.

```tsx
<Checkbox checked={all} onCheckedChange={setAll}>All notifications</Checkbox>
<Switch defaultChecked>Wi-Fi</Switch>
<RadioGroup label="Plan" name="plan" items={plans} defaultValue="free" />
```

```html
<gg-checkbox indeterminate><label><input type="checkbox" name="all"> All</label></gg-checkbox>
<gg-radio-group label="Plan" name="plan">
  <label><input type="radio" value="free" checked> Free</label>
  <label><input type="radio" value="pro"> Pro</label>
</gg-radio-group>
```

**One anatomy for all three**, built by `utils/choice.ts` in core: a `<label>`
root, a `control` that stacks the native `input` with what is drawn over it — the
check or dash (`indicator`, from the icon tokens), the dot, the switch's `thumb` —
and the text `label`. The drawing is its own element, not a pseudo-element on the
input: an `<input>` has no content box and not every browser renders one. The
stacking and the visibility of the mark are `@ggary/structure`; the mark follows
`:checked`, not `data-state`, so a form reset that fires no event still draws
right. RadioGroup's options carry a `radio` scope, as ChipGroup's chips carry
`chip`, so a theme styles the checkbox box and the radio circle from one rule set.

**What native does not have**, core adds:

- *Indeterminate* is a DOM property with no attribute. Connect reports it; each
  adapter assigns it to the element. A user's click always resolves it to a
  boolean, which is all `onCheckedChange` ever reports.
- *Readonly* does not exist for checkboxes. Core sets `aria-readonly`, blocks the
  click — the one event every way of toggling goes through — and stays silent in
  its change handler. React is the exception to the blocked click: it restores a
  controlled input after every event, and a cancelled click on top of that flips
  the box, which a jsdom probe showed and the sandbox confirmed. React's adapter
  passes `restoresChecked` and relies on the restore alone.
- *A name for the group*: radios that share one are a group — one tab stop, arrow
  keys that move and select. RadioGroup never lacks one; without `name` it uses
  its id. The keyboard is not reimplemented.

`checked={false}` survives normalization for React and Svelte, which every other
`false` does not: there `checked` is a property, and a controlled box rendered
without it when unchecked is not controlled. For the custom elements it stays
dropped, because there it would be the `checked` attribute — the default a reset
restores.

**Field.** Checkbox and Switch consume a Field like Input: the field's label, hint,
error timing and flags reach the native input, and readonly arrives as the
substitute above rather than as an attribute the browser ignores. Inside
`<gg-field>` the direction reverses — `<gg-checkbox>` renders several parts, so the
field pushes its props into it (`applyField`) instead of spreading onto the input.
A group of options is not a Field control; it goes in a Fieldset, below.

## Fieldset, CheckboxGroup, and the form's rhythm

A popover with two checkboxes above a radio group showed the checkboxes 16px apart
and the radios 8px apart, with the group label as far from the last checkbox as the
checkboxes were from each other. The radios' spacing came from the theme; nobody
owned the checkboxes' — the page's wrapper supplied a gap meant for fields. Two
option lists, two rhythms.

**CheckboxGroup** is RadioGroup's shape with a value array: `items`, a shared
`name`, `value` / `defaultValue` / `onValueChange`, orientation. The two share one
frame in core (`utils/choice-group.ts`) and one rhythm in every theme, so they cannot
drift again. Native checkboxes have no "at least one" — `required` on each would
demand all of them — so `required` is a custom validity on the first checkbox, set
while the input event is still on the box: a Fieldset above reads the group's
validity from that same event, and an adapter effect would run too late. The first
version did run too late, in React and Svelte only, and the fieldset conformance
test caught it.

**Fieldset** is a native `<fieldset>` and `<legend>` with Field's machine: one name
for a group, one hint-or-error slot, and the `:user-invalid` timing for the group as
a whole — no error until focus leaves the group (moving between its own options is
not leaving it) or a submit attempt fires `invalid`, which it hears by capturing.
`disabled` is the native attribute, so the browser disables everything inside. An
option group inside a Fieldset without a label of its own does not name itself
again: the fieldset is the group, and a second unnamed one would only be announced
as noise. It takes the fieldset's state instead — required, disabled, and
`aria-invalid` on its inputs.

```tsx
<Fieldset legend="Interests" hint="Pick at least one" error="Pick at least one interest" required>
  <CheckboxGroup name="interests" items={interests} />
</Fieldset>
```

```html
<gg-fieldset legend="Plan" error="Choose a plan" required>
  <gg-radio-group name="plan">
    <label><input type="radio" value="free"> Free</label>
    <label><input type="radio" value="pro"> Pro</label>
  </gg-radio-group>
</gg-fieldset>
```

**The rhythm is two public tokens,** in `contract.json`, so every theme must map
them and an application can lay out with them:

| Token | Between | GGarry | Instrument |
|---|---|---|---|
| `--gg-space-option` | the options of one group; a group label or legend and what follows | 8px | `--gap-row`, 6px at regular density |
| `--gg-space-group` | groups and fields stacked in a form | 20px | `--pad-panel`, 12px at regular density |

The second is always larger than the first, so a group reads as one thing.
`tests/rhythm.*.browser.test.ts` measures it in Chrome, per theme and per Instrument
density: label to first option, option to option, legend to content and group to
group, in real pixels. Putting the old 16px checkbox gap back fails it.

The same test holds the **listbox corners**: a highlighted option at the top or
bottom of a listbox is concentric with the panel — the panel's radius less its
padding and border — rather than a second, tighter token that happened to be close.
Both themes now derive it; restoring the old radius fails the test by a pixel.

A Field's label and its control, and the control and its hint, are the same
distance: `--gg-space-option`. "A label and what it labels" is one rule whether the
thing labelled is an input or a list of options. The rhythm test measures both;
restoring GGarry's old 4px gap fails it.

## Form reset

A native `reset` restores values and checked states without firing `input` or
`change`, so everything a component derived from them goes stale: its state, its
`data-state`, a shown error, a select's displayed and submitted value.
`onFormReset` in core listens on the enclosing form and calls back a task *after*
the event — the event fires before the browser restores the controls, and can be
cancelled — and every adapter uses it:

| Component | After a reset |
|---|---|
| Field, Fieldset | `RESET`: no error until the user leaves the control again |
| Checkbox, Switch, RadioGroup, CheckboxGroup | back to the default, drawn and validated again |
| Select, ChipGroup | back to the default value, shown and submitted |
| Input, Textarea | the owner's value follows; Textarea measures again |

Svelte needed more than a listener. It sets `checked` and `value` as properties,
never the attributes a reset restores to, so a box that started checked resets to
*unchecked* while the component's state — which never changed — says checked. The
Svelte adapters write the initial state back to the binding and to the element.
`tests/conformance/reset.spec.ts` covers it for all three adapters; making
`onFormReset` a no-op fails all of it, and dropping the Svelte write-back fails
the default-checked test alone.

A controlled React owner is not told: its value is the value, and the component
renders it again over the reset.

## Tabs

Tabs follow the WAI-ARIA APG pattern: a tab list with one tab stop, where the arrows
move along it and each tab controls a panel. There are two jobs and two looks, as in
Instrument:

| Variant | For | Marked by |
|---|---|---|
| `line` | sections of one screen: few, fixed, never closed | a bar under the selected tab; its weight does not change, so the tabs after it do not shift |
| `chips` | open documents: any number, opened and closed as work goes on | a raised chip on a recessed track, and weight |

```tsx
<Tabs items={files} variant="chips" label="Open files" onClose={(value) => setFiles(files.filter((f) => f.value !== value))}>
  {(item) => <Editor file={item.value} />}
</Tabs>
```

```html
<gg-tabs label="Object properties">
  <section data-tab="geometry" data-label="Geometry">…</section>
  <section data-tab="material" data-label="Material" data-closable data-modified>…</section>
</gg-tabs>
```

- **Activation.** `automatic`, the default: the arrows select as they move. `manual`:
  the arrows move focus, and Enter or Space selects, for panels that are expensive to
  show. `orientation="vertical"` walks with ArrowUp and ArrowDown and stands the
  list beside the panel.
- **Panels.** React renders the selected panel from `children(item)` and Svelte from a
  `panel` snippet; `keepMounted` renders all of them, hidden, to keep their state.
  `<gg-tabs>` enhances the author's own panels: each child with `data-tab` is a panel,
  and its tab is built from its `data-*`. Adding or removing a panel adds or removes
  its tab. Without panels, the tabs are a switch for something rendered elsewhere, and
  they don't point `aria-controls` at nothing.
- **Closing is a request.** A closable tab carries a close button with an
  `aria-label`, kept out of the tab order. Delete and a middle click close it too;
  `onClose` (or `tabclose`) asks, and the owner removes the item. When the selected
  tab goes, its neighbour is selected and reported, as in an editor. Focus on the
  closing tab is aimed at that neighbour. A dot marks `modified` in place of the
  cross, until the pointer reaches it.
- A tab is a `div role="tab"`, not a button, so it can hold its close button: a
  button inside a button is invalid HTML.

Found on the way, in `<gg-tabs>`: closing the tab next to the focused one lost focus.
The list was rebuilt with `replaceChildren`, which detaches the focused tab to put it
back. The first fix still moved it: with the closed tab in the middle, every tab after
it looked out of place. `reconcileChildren` now removes leavers first and moves only
what is out of order, and the menu renderer uses it too. A long strip of documents
scrolls, with its scrollbar hidden, and the keyboard keeps the focused tab in sight; a
browser test proves it, and fails without the scroll.

## The overlay layer, and Dialog

Everything before Dialog sat in the page's normal flow. An overlay does not, and
the usual kit answer — a portal, a z-index scale, a focus-trap library, a scroll
lock that pads the body — is mostly unnecessary now. The platform does it:

| Need | What provides it |
|---|---|
| Above everything, never clipped by an ancestor's `overflow` or `transform` | the **top layer**: `showModal()` puts the `<dialog>` there — no portal, no z-index |
| Focus kept inside, the page unclickable | a modal dialog makes the rest of the document **inert** |
| The page does not scroll behind it | `:root:has([data-scope='dialog'][data-part='content']:modal) { overflow: hidden }` in `@ggary/structure` |
| Which overlay an Escape or an outside press belongs to | **the dismiss stack**, in core |

**The dismiss stack** (`utils/dismissable.ts`). Every open layer — Select's listbox,
a dialog, and later popovers and menus — registers, and only the topmost hears
Escape or a press outside. Before it, each layer listened to the document on its
own: an Escape in a select inside a dialog closed both. The stack also prevents the
Escape keydown, and a prevented keydown makes no close request, so the native
dialog underneath does not close by itself either. Removing that one
`preventDefault` fails exactly two browser tests: the nested select, and a
controlled dialog that refuses to close.

**Closing goes through state**, never natively (`utils/modal.ts`, `attachDialog`).
A close request is cancelled and reported. A `<form method="dialog">` submission is
intercepted — its `submit` is synchronous and carries the submitter — rather than
left to close the element and fire `close` later: in a page that is not rendering
that event can wait indefinitely, which the sandbox found in a hidden browser pane,
with the state saying "open" over a closed element. So every way out reaches
`onOpenChange(open, { reason, returnValue? })`, and a controlled React owner can
refuse any of them.

**Focus** moves inside on open (the platform) and back to where it was on close
(`attachDialog`, since not every browser restores it). When nothing had focus —
Safari does not focus a clicked button — it goes to the trigger instead of `<body>`.

**The trigger belongs to someone else.** `triggerProps` carry ARIA, an id and a
handler, and no `data-scope`/`data-part`/`data-state`: spread onto a kit `<Button>`
they would overwrite the button's own and it would lose its styling. In the
elements, `spread()` keeps its bookkeeping per owner, so `<gg-button>` and
`<gg-dialog>` can both apply props to one `<button>` without each removing the
other's attributes and listeners.

```tsx
<Dialog title="Delete project?" role="alertdialog" closeOnEscape={false} closeOnOutside={false}
  trigger={(props) => <Button tone="danger" {...props}>Delete…</Button>}
  footer={<form method="dialog"><Button type="submit" value="delete">Delete</Button></form>}
  onOpenChange={(open, { reason, returnValue }) => …}>
  Everything in "Atlas" goes.
</Dialog>
```

```html
<gg-dialog heading="Delete project?" alert persistent>
  <gg-button slot="trigger" tone="danger"><button>Delete…</button></gg-button>
  <p>Everything in "Atlas" goes.</p>
  <footer><form method="dialog"><button value="delete">Delete</button></form></footer>
</gg-dialog>
```

Svelte binds it: `<Dialog bind:open>`, with `trigger`, `footer` and the body as
snippets.

**Testing overlays.** jsdom has no `showModal()`, no Popover API, no `inert` and no
`:modal`. `tests/setup/dom-shims.ts` adds stand-ins for the methods so the jsdom run
exercises the adapters' wiring, and nothing more; the conformance spec runs again in
Chrome against the real thing, and `tests/dialog.browser.test.ts` covers what only
a browser has — `:modal`, Tab never leaving, the scroll lock, a real backdrop click,
real Escape presses through the stack, the form close, and a controlled refusal.

### Sheet

A full-height panel at the edge of the screen: settings, details, navigation on a
narrow screen. As in Instrument, it is the modal dialog in a different layout, not a
different component. The parts, focus, Escape, the backdrop and the scroll lock are
all Dialog's. `Sheet` is Dialog with `placement` set from `side` (`end` by default,
or `start`). The sides are logical, so a sheet mirrors in a right-to-left page.

```tsx
<Sheet side="end" title="Run parameters" trigger={(props) => <Button {...props}>Parameters…</Button>}>…</Sheet>
```

```html
<gg-sheet side="start" heading="Sections"><gg-button slot="trigger"><button>Sections</button></gg-button>…</gg-sheet>
```

Each theme lays it out: full height with `100dvh`, so a phone browser's toolbar
doesn't hide the footer. It sits flush with its edge, with no radius, and a border
only on the side that faces the page. On a narrow screen it is full width. The
rhythm test opens one at each edge in both themes and measures it.

### Popover and Tooltip

The same layer with the **Popover API** instead of `<dialog>`: `popover="manual"`
puts the content in the top layer, and `attachPopover` (`utils/popover.ts`) shows it,
places it with Floating UI's `fixed` strategy — a top-layer element is positioned
against the viewport whatever its DOM parent — and puts it on the dismiss stack.
`manual`, not `auto`: the platform's light dismiss would compete with the stack, and
the trigger's own click would close the popover and open it again.
`@ggary/structure` removes the browser's centred, bordered popover box, so
placement is Floating UI's alone; removing that reset fails three placement tests.

**Popover** is a non-modal dialog on its trigger — filters, a share panel. Focus
moves to its first visible control and returns to the trigger; the trigger toggles
it; Escape and a press outside close it.

**Tooltip** describes its trigger (`aria-describedby`, whether shown or not) and
holds no controls — that would be a popover. Its timing is the reducer's, its
timers are effects:

- hover shows it after `openDelay` (500 ms), and hides it after `closeDelay` (150 ms),
  long enough for the pointer to move onto the tooltip without losing it
  (WCAG 1.4.13, hoverable);
- keyboard focus shows it at once — `:focus-visible` only, so a click that focuses
  a button does not; blur, a press on the trigger and Escape hide it at once;
- a touch "hover" is ignored: the tap should act, not describe;
- moving from one tooltip to the next within 600 ms skips the delay, page-wide,
  so running along a toolbar reads as one conversation.

A tooltip is a **passive** layer on the stack: it takes Escape, but a press
elsewhere while it shows still reaches the popover beneath it.

**Select** moved onto the same layer: its listbox is a manual popover handed to
`attachPopover` (focus stays on the trigger — it uses `aria-activedescendant`). It
used to be absolutely positioned inside the select, and a dialog body or any
`overflow: hidden` ancestor cut it off; two browser tests now open a select inside
each and hit every option where it is drawn. Both failed before the move.

Open and close requests for all three overlays share one rule,
`utils/open-intent.ts`: a request is judged against the current state, reported
through intent, and in controlled mode moves nothing until the owner answers.

```tsx
<Popover title="Filters" trigger={(props) => <Button {...props}>Filters</Button>}>
  <Checkbox>Only open issues</Checkbox>
</Popover>
<Tooltip content="Bold (Ctrl+B)" trigger={(props) => <Button aria-label="Bold" {...props}>B</Button>} />
```

```html
<gg-popover heading="Filters"><gg-button slot="trigger"><button>Filters</button></gg-button>…</gg-popover>
<gg-tooltip content="Bold (Ctrl+B)"><gg-button><button aria-label="Bold">B</button></gg-button></gg-tooltip>
```

### Toast

The result of an action whose result has no place on the screen: "the run is
queued", "could not send". A toast is called, not written: the queue is a store in
core that belongs to no framework, so `toast()` works from anywhere, including an
event handler, a fetch or a store. One region per page renders it.

```tsx
import { Toaster, toast } from '@ggary/react'   // or '@ggary/svelte', '@ggary/elements'
<Toaster placement="bottom-end" />
toast({ tone: 'ok', title: 'Saved' })
const id = toast({ tone: 'running', title: 'Saving…', duration: 0 })
toast({ id, tone: 'ok', title: 'Saved' })     // the same id updates it in place
```

```html
<gg-toaster placement="bottom-end"></gg-toaster>
```

- **Tones** are Instrument's `neutral · running · ok · warn · error`. Each tone is
  an icon in its colour next to text on the surface, never a fill. GGarry gained
  `--ggarry-text-success` and `--ggarry-text-warning` for it, and both themes check
  every pair.
- **Time.** A toast leaves after 5 s. An error stays until dismissed: a message that
  something *didn't* happen may not leave unseen. While the pointer rests on the
  region, or focus is inside it, every clock stands still (WCAG 2.2.1), and resuming
  continues with the time that was left. No more than four show at once: the oldest
  leaves. A leaving toast plays its exit, then a timer removes it, so reduced motion
  still removes it. The timers are the store's, not a component's, so nothing
  re-renders to count down.
- **One action**, not two, plus a close button on every toast.
- **The region** is a manual popover opened once and never closed. It sits in the top
  layer, above everything the app drew, and takes no pointer events: presses go
  through it to the page. A browser test proves both.
- **Announcing.** The region holds two live regions that exist before any toast does:
  polite, and assertive for an error. A new message is added to one of them, because
  a live region created together with its content is not reliably spoken. The
  visible toasts carry no live role, so nothing is heard twice.

### Menu

A menu button (WAI-ARIA APG) on the same layer: a button opens a list of actions,
toggles and choices. Items are data, as Select's are: actions (a link when they have
`href`, so middle-click still opens a tab), `checkbox` and `radio` items, separators
and labelled groups one level deep.

```tsx
<Menu
  items={[
    { value: 'rename', label: 'Rename', shortcut: 'F2' },
    { type: 'separator' },
    { value: 'delete', label: 'Delete', tone: 'danger' },
  ]}
  onSelect={(value, { item, checked }) => …}
  trigger={(props) => <Button {...props}>Actions</Button>}
/>
```

```html
<gg-menu label="Row actions"><gg-button slot="trigger"><button>Actions</button></gg-button></gg-menu>
<!-- menu.items = [...]; listen for `itemselect` ({ value, item, checked? }) -->
```

**Focus moves into the menu,** unlike Select. A menu is a place the user goes, and a
link item has to hold focus for the browser to follow it. The highlight is still
machine state: the pointer and the keyboard move one index, and the adapter focuses
whatever it points at (`focusMenuItem`). The trigger opens with a press (focus on
the menu itself, nothing highlighted), with Enter, Space or ArrowDown (first item),
or with ArrowUp (last item). Arrows wrap, Home and End jump, a letter moves to an
item, and Enter or Space activates. Activation always goes through a click, so a link
navigates as a link does. Choosing an item reports it, closes the menu (`closeOnSelect`,
per menu or per item) and gives focus back to the trigger; so do Escape and Tab.

**Disabled items are stops.** Arrows land on them, and Enter and a click do nothing.
A user who cannot reach an item never learns the action exists. This is the APG's
guidance and Instrument's menu, and the opposite of Select, where a disabled option
is skipped the way a native `<select>` skips it.

**The owner holds the toggles.** A checkbox item reports the state it asks for, and a
radio item always asks for `true`; the page passes new items back. The custom element
reuses rows by value, so the focused row keeps focus when the items are replaced
under it.

**Submenus** are levels of the same machine, not menus of their own. The state
holds a path, one highlighted index per open level, and the level that has focus.
One keydown handler on the menu hears every level, because their keys bubble to it.
Only the menu itself is on the dismiss stack. Each submenu renders right after its
row, inside the menu, as the APG's menubar example nests them, so a press inside a
submenu counts as inside the menu. A press outside closes the whole tree; Escape
closes one level.

```ts
{ type: 'submenu', value: 'export', label: 'Export as', items: [{ value: 'pdf', label: 'PDF' }] }
```

- The keyboard: ArrowRight or Enter opens a submenu on its first row and moves focus
  in. ArrowLeft or Escape closes it and gives focus back to its row.
- A pointer on the row opens the submenu with focus left on the row, as desktop
  menus do. It opens beside the row, with its first row level with it, and flips to
  the other side when there is no room.
- **The corridor.** A pointer moving diagonally from the row to its submenu crosses
  the rows below it, which would each take the highlight and close the submenu. For
  300 ms after the pointer leaves the row, moves inside the triangle from where it
  left towards the submenu are ignored (`gracePolygon`, pure and unit-tested). The
  first version drew the triangle from the `pointerleave` event, but that event
  already carries the pointer's new position, so the very move that left the row
  always fell inside its own corridor. The real-browser test that jumps away from
  the submenu caught it. The triangle now starts where the pointer was last seen
  over the menu.
- **Keys faster than a render.** The first ArrowRight handler asked the rendered
  state whether the row had a submenu. Two keys in one frame, End then ArrowRight,
  met a state from before the End, and nothing opened. Only the sandbox showed it:
  the tests flush between keys. The reducer now decides, and a conformance test
  presses both keys in one batch; restoring the render-time check fails it in React
  and Svelte.

Two things only the browser runs caught:

- **React restores focus after a commit.** The menu's rows stay mounted while it is
  closed, and React puts focus back on the element that had it before a commit,
  after the layout cleanups run. A focus return from `attachPopover`'s cleanup
  landed back on the item. Popover never met it: its content unmounts. The React
  Menu attaches in passive effects, which run after that restore.
- **Placement is asynchronous.** Floating UI writes the height limit after the
  highlighted row has already been scrolled into view against the unlimited panel,
  so the last row of a long menu ended up below the fold. The positioner now takes
  `onPlaced`, and Menu and Select scroll again from it. Select had the same bug when
  opening on a selected option far down a long list; a browser test now covers both,
  and removing `onPlaced` fails both.

The first theme pass had two layer bugs of its own, both now measured in the rhythm
tests. Instrument laid the panel out with `display: flex`, which outranks the
browser's `display: none` for a closed popover, so every closed menu was drawn. And
auto margins in `@ggary/structure` lost to Instrument's `* { margin: 0 }` in a later
layer, so shortcuts sat next to the label. The label now takes the slack with `flex`.

### Menubar

The classic application menubar (WAI-ARIA APG menubar): File, Edit, View, for
desktop-style and hybrid apps. Each menu is the Menu above, with its bar item as
its trigger; the bar only decides which menu is open.

```tsx
<Menubar
  label="Application"
  mnemonics
  menus={[
    { value: 'file', label: '&File', items: [{ value: 'save', label: 'Save', shortcut: 'Ctrl+S' }] },
    { value: 'edit', label: '&Edit', items: [...] },
  ]}
  onSelect={(value, { menu }) => …}
/>
```

```html
<gg-menubar label="Application" mnemonics></gg-menubar>
<!-- bar.menus = [...]; itemselect ({ value, item, checked?, menu }), openchange ({ menu }) -->
```

- **One tab stop.** ArrowLeft and ArrowRight walk the bar, disabled menus included,
  and wrap. Enter, Space or ArrowDown opens a menu on its first row; ArrowUp opens it
  on its last.
- **Between open menus.** ArrowRight on a row with no submenu, at any depth, opens
  the next menu, skipping disabled ones. ArrowLeft on a menu's own level opens the
  previous one; in a submenu it closes the submenu first. While a menu is open,
  moving the pointer onto another bar item opens that menu. The menu reducer
  reports these keys by returning the same state, and the bar reacts to that, so
  no adapter decides it.
- Choosing an item, Escape and Tab close the menu and return focus to its bar item.
  `onOpenChange` reports the open menu's value, or `null`.
- **Access keys** are opt-in (`mnemonics`), because on a web page Alt and F10 may
  belong to the browser. `&File` marks F, and `&&` is a literal ampersand. The
  marker never shows. Alt+F opens File on its first row. A held Alt underlines the
  keys, and F10 moves focus to the first menu. A key matches by the character
  typed or by the physical key, so a Latin access key still works on a Cyrillic
  layout. A Cyrillic label (`&Файл`) works too. Items announce the key with
  `aria-keyshortcuts`.

Found on the way:

- **F10 from inside a menu** first landed back on the menu that closed. That menu's
  focus return ran after the bar's own move. Focus now moves to the bar before the
  menu closes, so there is nothing for the menu to hand back.
- **A closing menu handing focus to its own bar item** looked like the user moving
  the tab stop. While a menu is open the bar ignores focus arriving on its items.

## Display components

Nine components that show things rather than take input: Badge, Avatar and
AvatarGroup, Spinner, Skeleton, Card, Panel, Banner, Note and EmptyState. None has a
machine. Each is a `connect(props, normalize)` in core, like Button and Chip, so the
three adapters are thin. They are still real components in every adapter, not CSS
recipes: the roles, the heading levels, the icons and the live regions come from
core, and the conformance suite checks them under all three adapters.

```tsx
<Badge tone="ok">Passed</Badge>
<AvatarGroup label="Reviewers" people={people} max={3} />
<Spinner label="Loading runs" />
<Panel title="Runners" region actions={<Button size="sm">Add runner</Button>}>
  <Card title="runner-01" tone="ok">Idle</Card>
  <Note tone="warn">runner-02 has not reported for 5 minutes.</Note>
</Panel>
<Banner tone="error" title="Build failed" live="alert" onDismiss={hide}>3 tests failed.</Banner>
<EmptyState title="No artifacts yet" description="They appear after the first build." />
```

```html
<gg-panel heading="Runners" region>
  <gg-button slot="actions" size="sm"><button>Add runner</button></gg-button>
  <gg-card heading="runner-01" tone="ok">Idle</gg-card>
</gg-panel>
<gg-banner tone="warn" heading="Disk almost full" dismissible>Old snapshots are pruned tonight.</gg-banner>
```

Elements take `heading`, not `title`: `title` is a global HTML attribute, and it would
show as a tooltip on the whole host.

Status tones are shared vocabulary in core (`utils/tone.ts`): `neutral · running ·
ok · warn · error`, and the glyph for each. Toast, Badge, Banner and Note all read
it, so a warning looks the same wherever it is said.

- **Badge.** A status in words. The dot is decoration and hidden from assistive
  technology, and the label alone must carry the meaning. Variants: `solid`
  (a subtle plate), `outline`, and `count`. A running badge's dot pulses.
- **Avatar.** The initials are drawn first, and the picture covers them once it has
  loaded. A picture that fails is removed, so there is never a broken image. The
  avatar is `role="img"` named by the person, unless `decorative` is set because the
  name is already next to it. A browser test loads a real image and a broken one.
  **AvatarGroup** is a named group that shows `max` people and a `+N` for the rest.
- **Spinner** is `role="status"` with a name: "Loading" unless `label` says what is
  loading. **Skeleton** is hidden from assistive technology, so the page has to
  say what is loading somewhere else. Reduced motion slows both and does not stop
  them: an indicator that stops looks like a hang.
- **Card and Panel** share one channel of four values: ground, edge, title size and
  title ink. `rank` (`lead`, default, `support`), `plain`, `tone` and nesting set those
  values. A card is an object on the page: its title is an `h3` by default, and with
  `href` the whole card is an `<a>`. A panel is a place: an `h2`, `actions` at the end
  of the header, and a body that is `padded`, `flush` or `list`. `region` makes it a
  landmark named by its title. `scrollable` makes the body a named group you can
  reach with Tab, so a keyboard can scroll it. A panel is an inline-size container
  (`container: panel`), so its content can respond to the panel's width. A region
  inside a region recedes rather than rises. A tone tints the ground only; the edge
  stays.
- **Banner** is a message about the whole screen: a tone icon, a title, text and
  actions. `live="alert"` makes it `role="alert"`, and `live="polite"` makes it
  `role="status"`. Without `live` it is silent, which is right for a banner the page
  already had when it loaded. Closing is the owner's decision. In React and Svelte,
  `onDismiss` asks and the page removes the banner. `<gg-banner>` fires a cancelable
  `dismiss` event, and hides itself unless the event is prevented.
- **Note** is an aside with a bar at its leading edge. A toned note also carries the
  tone's icon, so warn and error never differ by colour alone.
- **EmptyState** says why a space is empty and what to do next. Its title is a
  paragraph unless `headingLevel` is set: an empty list is rarely a document section.

Found on the way:

- **Muted text missed 4.5:1 on GGarry's tinted grounds.** It measured 4.36:1 on the
  running banner and 4.35:1 on the error banner. GGarry has no text tier between
  muted and default, so banner text uses the default colour and the semibold title
  carries the hierarchy. Instrument has a secondary tier and keeps it.
- **A toned card inside a panel lost its tone.** The rule for nested regions had
  more specificity than the tone rule. The outer region is now matched with
  `:where`, so nesting ranks below rank, plain and tone.
- **An untoned note inside a toned card would wear the card's tone.** Tones are
  custom properties, and custom properties inherit. A banner or note without a tone
  resets them.
- **Instrument's reset zeroes margins** after structure, so an auto margin cannot
  push a panel's actions to the end of the header. The title takes the free space
  instead. The banner's 75ch measure moved from its body to its lines, so the body
  still fills the row and the actions sit at its end.

## SegmentedControl, Slider and NumberField

Three controls where the platform already has the behaviour, so the kit's job is
to stop reimplementing it.

```tsx
<SegmentedControl label="View mode" items={views} value={view} onValueChange={setView} />
<Slider label="Parallel agents" min={0} max={16} value={agents} onValueChange={setAgents} showValue
        formatValue={(n) => `${n} agents`} />
<NumberField axis="X" label="Position X" value={x} onValueChange={setX} />
```

```html
<gg-segmented-control label="View mode" name="view">
  <label><input type="radio" value="list" checked> List</label>
  <label><input type="radio" value="grid"> Grid</label>
</gg-segmented-control>

<gg-slider label="Parallel agents" show-value><input type="range" min="0" max="16" value="6"></gg-slider>
<gg-number-field axis="X" label="Position X"><input type="number" name="x" value="128"></gg-number-field>
```

- **SegmentedControl is native radios.** One value among equals is a radio group,
  so that is what it is: radios sharing a name are one tab stop, the arrow keys
  move and choose, and the value submits with the form — no roving tabindex, no
  key handling, nothing in core but the attribute contract. Instrument builds the
  same control from buttons with `role="radio"` and a script; the radios make the
  script unnecessary. Each radio covers its whole segment, transparent, so a press
  anywhere on the segment lands on the input; the segment draws the focus ring
  through `:has(> input:focus-visible)`. The chosen segment is a surface and a
  border, never colour alone, and it keeps its weight: Instrument measured a
  bolder label moving the width of the whole track by half a pixel.
- **Slider is a native range input.** The keyboard, the step, the `slider` role
  and the value announcement are the platform's. Two things are not. The track is
  filled up to the thumb — CSS cannot read an input's value, so `connect` hands
  the share to the theme as `--slider-fill` on the root, a data channel, as
  Instrument's `--fill` was. And the number beside the track is an `<output>` tied
  to the input by `for`, but `aria-hidden`: an output is a live region, and the
  slider already announces its value at every step. `formatValue` puts the value
  into words — "6 agents" — for both the output and `aria-valuetext`.
- **NumberField is a native number input** with the letter of an axis before it.
  The letter is a drag handle, not a `<label>`: as a label it would become the
  field's entire accessible name, "X" instead of "Position X". Dragging it
  sideways moves the value, Shift ×10 and Alt ×0.1 (`utils/scrub`); the spin
  buttons are removed by styling and the arrow keys are untouched. The wrapper is
  the visible control, so the focus ring goes round the letter and the digits
  together.

All three take an enclosing Field's label, ids and description; inside one they
carry no `aria-label` of their own. `<gg-field>` pushes its control props into
`<gg-slider>` and `<gg-number-field>` with `applyField()`, the way it already
does for a checkbox: these are several parts, not one element's attributes.

Two things this wave added to core itself:

- **`style` is a canonical prop**, an object of custom properties. React takes the
  object as it is, and the Svelte and DOM normalizers turn it into declaration
  text. It exists for data channels such as the slider's fill — never for a look.
- **`utils/scrub`.** `scrubValue()` is the arithmetic, tested without a DOM: two
  pixels to a step, the modifiers, and the float tail cut at the step's precision
  (0.1 + 0.2 is otherwise 0.30000000000000004). `attachScrub()` is the gesture.
  It writes the value through `HTMLInputElement.prototype`'s own setter and then
  dispatches `input`, which is the only way React's controlled input hears a
  change it did not cause — and Svelte's `bind:value` hears it too.

Found on the way:

- **A number field cannot be a controlled input in React's sense.** Typing "1."
  holds no new number, and writing the owner's `1` straight back would eat the dot
  under the caret. The owner's value is written to the element only when it
  differs from the number the input already holds.
- **`PageUp` does not step a number input** — that is a range input's behaviour. A
  browser test claimed it and failed, which is what a browser test is for.

## ChoiceCards, Search, InputGroup, FileDrop and ButtonGroup

The rest of the form vocabulary, and the same rule as the wave before it: where
the platform has the behaviour, the kit only dresses it.

```tsx
<ChoiceCardGroup items={modes} label="Run mode" name="mode" value={mode} onValueChange={setMode} />
<ChoiceCardGroup items={extras} type="checkbox" label="Also" value={also} onValueChange={setAlso} />
<Field label="Search the runs"><Search name="q" placeholder="worldgen" /></Field>
<InputGroup prefix="$" suffix="per hour"><Input type="number" name="budget" /></InputGroup>
<FileDrop name="import" accept=".json,.csv" multiple hint="Up to 20 MB" onFilesChange={keep} />
<ButtonGroup size="sm" label="Alignment">…</ButtonGroup>
```

```html
<gg-choice-cards label="Run mode" name="mode">
  <label><input type="radio" value="parallel" checked>In parallel<span slot="description">Up to 12 agents at once.</span></label>
</gg-choice-cards>

<gg-search><input type="search" name="q"></gg-search>
<gg-input-group prefix="$" suffix="per hour"><input type="number" name="budget"></gg-input-group>
<gg-file-drop hint="Up to 20 MB"><input type="file" name="import" multiple></gg-file-drop>
```

- **ChoiceCards** are RadioGroup and CheckboxGroup with room for consequences:
  "in parallel — up to 12 agents at once, more tokens, no guaranteed order". The
  card is the option's `<label>`, and the box inside it is the plain control's own
  parts, with the checkbox's or the radio's scope — so one theme rule draws both,
  and a card cannot drift from a toggle. The heading and the description are
  inside the label, which makes them the option's accessible name; an `aria-label`
  here would hide exactly what the user needs in order to choose. `type="radio"`
  is a radiogroup, `type="checkbox"` a plain group with an array for a value.
- **Search** is `type="search"`, so the clear cross and Escape are the browser's.
  The input inside is an `input` part, not a `search` one: the field look is
  input.css's, and search.css only makes room for the glyph and recolours the
  native cross. The magnifier is decoration and hidden from assistive technology.
- **InputGroup** puts "$" or "per hour" or a button flush against a field. The
  border belongs to the GROUP: two borders at the join give two lines, and focus
  would ring half the control — so the field inside hands its box outwards. In
  Instrument the affix's recess is relative and compounds by itself, which is how
  the source keeps one step under the field on a page, in a panel and in a modal.
- **FileDrop** is a `<label>` around a real `input[type=file]`, so a press
  anywhere opens the system dialog and Tab reaches the zone. The input is taken
  away by a clip, never by `display: none`, which would drop it out of the tab
  order. Instrument's zone has no script and cannot answer a drag; `utils/file-drop`
  adds one: a depth-counted drag state, and a drop that writes the files into the
  input through a DataTransfer, then sends the same `input` and `change` the
  dialog would — so a form submits them as if they had been chosen by hand.
- **ButtonGroup** is several actions standing flush, which is the whole difference
  from a SegmentedControl: no chosen one, and no roving tabindex — Tab goes through
  every button, because each does its own thing. It takes a role only when it is
  named. The corners follow the size the group is told its buttons are; Instrument
  reads that from the children with `:has()`, which cannot see through a
  `<gg-button>` wrapper, so here it is said out loud.

Found on the way:

- **A rule in `gg.structure` cannot undo a theme's field look.** The group's input
  kept its own border until the "hand the box outwards" rules moved into each
  theme's `input-group.css`: layer order is `tokens, structure, base, components`,
  and the field look is a component rule.
- **jsdom has no `DataTransfer`**, so a drop cannot even be staged there. Those two
  conformance cases skip under jsdom and run in the Chrome pass, where they check
  the real thing: the files land in the input, and the zone lights up for a drag.
- **`choice()` needed a wider generic.** It used to take only its own four parts,
  so an anatomy with a title and a description would not typecheck; it now takes
  any anatomy that includes them.

## Breadcrumbs, Nav, Pagination, Steps and Toolbar

Navigation is markup: links and ordered lists, which the browser already knows
how to traverse, open in a new tab and copy. So four of these five components
add no behaviour at all — they add the roles, the landmarks and the states that
the markup is supposed to carry and usually does not.

```tsx
<Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: 'Run #4127' }]} />
<Nav label="Sections" groups={[{ label: 'Work', items: [{ label: 'Runs', href: '/runs', icon: 'grid', count: 7, current: true }] }]} />
<Pagination items={paginationRange({ page, pages: 24, previousLabel: 'Back', nextLabel: 'Forward' })} onPageChange={go} />
<Steps items={[{ name: 'Source', state: 'done' }, { name: 'Check', state: 'current' }]} />
<Panel title="Runs" toolbar={<Toolbar label="Run tools">…<ToolbarSpacer /><Badge>7 running</Badge></Toolbar>}>…</Panel>
```

```html
<gg-breadcrumbs label="Breadcrumbs">
  <a href="/projects">Projects</a><span>Run #4127</span>
</gg-breadcrumbs>

<gg-nav label="Sections">
  <div data-group="Work"><a href="/runs" data-icon="grid" aria-current="page">Runs<span data-count>7</span></a></div>
</gg-nav>
```

- **Breadcrumbs** are an ordered list inside a named landmark: the order is part
  of the meaning, and a screen reader reads the length of the path from the list.
  The last crumb is the page itself — text with `aria-current="page"`, never a
  link, because a link to where you already are is a false action. The separator
  is a pseudo-element with a glyph token, so it reaches neither the accessibility
  tree nor a copy of the path: you get "Projects worldgen Run #4127".
- **Nav** is the side column, and every item is a real `<a href>`: a button
  breaks the middle click, "open in a new tab" and copying the address. The
  current item is `aria-current="page"` in the markup — the component never
  decides which page it is on — and the theme marks it with a bar at its inner
  edge as well as a surface. A group is a `group` only when it has a name.
- **Pagination** is links too, and `paginationRange()` builds the list: the ends,
  the current page with its neighbours, and an ellipsis for what is left out —
  but never for a single page, because a gap costs the same room as the page and
  takes away a destination. At the edges the link keeps its place in the tab
  order with `aria-disabled`; removing it would move the focus mid-journey.
- **Steps** is an ordered list, so "3 of 5" comes free, and every step carries
  both a bar and a WORD — "done", "now", "next". The word is the second carrier
  of the state: it survives a printout and a reader who cannot tell the shades
  apart. The current step is `aria-current="step"`.
- **Toolbar** is the one with behaviour, and it is opt-in. `role="toolbar"`
  promises one tab stop and arrow keys, so the role is only taken when the strip
  is named — then `utils/toolbar` keeps the promise: the arrows walk the tools,
  wrap at the ends, skip what is disabled, and the tab stop stays on the tool
  last used. Instrument leaves the role out entirely and says the behaviour
  belongs to the application; here the behaviour comes with the name. A field
  inside the strip keeps its own arrows, because there they move the caret.

`Panel` gained a `toolbar` slot for it: the strip stands between the header and
the body and brings the line below itself, so the header gives up its own.

Found on the way:

- **A gap that hides one page.** `paginationRange` drew an ellipsis wherever two
  shown pages were not adjacent, which at page 3 of 5 replaced page 4 with "…".
  The unit test was written for that rule and failed on the first run.
- **`data-icon` on a link hides the link.** A masked element clips everything
  inside it, glyph and text alike, so `<gg-nav>` reads the name off the anchor
  and takes the attribute away — the mask belongs on the icon's own span. The
  sandbox showed a column of icons with no words.
- **An auto margin cannot live in the structure layer.** Instrument's reset
  zeroes margins and stands above it, so the toolbar's spacer pushed nothing.
  The margin moved into both themes, and a browser test now measures the tail
  against the strip's own inset.

## DataGrid

A list people spend their day in, at any size. It was designed against a real
one: a sales team's leads registry of about 700,000 rows, where sorting quietly
reordered only the loaded page, "select all" and CSV export stopped at the page,
a selection survived filter changes invisibly, 36 columns scrolled the company
name out of view, headers were internal keys, and every reload swapped the table
for a spinner and lost the scroll position. Each of those is a thing this grid is
built not to do.

```tsx
<DataGrid
  columns={[
    { id: 'company', header: 'Company', pinned: 'start' },
    { id: 'sum', header: 'Paid', type: 'money', currency: 'RUB' },
    { id: 'status', header: 'Status', type: 'enum', options },
  ]}
  source={leadsApi}            // or rows={array}: the grid sorts and filters it itself
  rowKey={(lead) => lead.id}
  label="Leads"
  selectable
  onRowActivate={openLead}
  renderCell={(lead, column, text) => (column.id === 'status' ? <Badge tone={tone[lead.status]}>{text}</Badge> : text)}
/>
```

```ts
// A source answers a query; the grid never holds the dataset.
const leadsApi: GridSource<Lead> = {
  load: ({ sort, filters, search, range }, signal) =>
    fetch('/api/leads', { method: 'POST', body: JSON.stringify({ sort, filters, search, range }), signal })
      .then((response) => response.json()), // { rows, total }
}
```

**The grid holds a query, not the data.** Sort (several keys), typed filters
(text, set, number range, date range), free-text search and the range of rows on
screen go to a source; the source answers with those rows and the total. An array
in the page is one kind of source (`createArraySource`, which sorts once per
query, not once per scroll); a server is another. `applyQuery` is the reference
for what a query means, so the two cannot disagree about a filter.

**Only a screenful exists.** Rows load in blocks of 100 as they come into view;
neighbouring blocks travel in one request; a new query aborts the old requests,
and an answer that arrives late for an old query is dropped rather than drawn;
dragging the scrollbar across the list aborts the requests for rows scrolled
past; while a new query loads, the old rows stay on screen, dimmed, instead of a
spinner; memory is bounded by forgetting the blocks farthest from view.

**The scrollbar covers the whole list.** 700,000 rows of 36px is 25 million
pixels — past Firefox's height cap of about 17.9 million, where a scrollbar lies
and the last rows cannot be reached. Above 8 million pixels the scroll range is
scaled: a pixel of scroll stands for more than a pixel of rows, and rows are
still drawn at their real height. Rows have one fixed height (a theme sets it as
`--gg-grid-row-height`); variable heights would need every row measured to know
where row 500,000 is, which is where most virtual tables break.

**Selection is honest about what it covers.** It is either keys, or "everything
matching this query, except these" — so "select all 12,400" is one object, and a
bulk action receives the query and the exceptions (`selectionPayload`) and does
one request. A new query drops the selection: it was made on rows no longer shown.

**One tab stop.** The grid element keeps the focus and names the active cell
with `aria-activedescendant`, so recycling rows during a scroll cannot drop the
focus. Arrows move between cells; Home and End go along a row, Ctrl+Home and
Ctrl+End to the first and the last of 700,000; Page keys move by a screen;
Enter or Space on a header sorts (Shift adds a key); Space selects a row,
Shift+arrows extend, Ctrl+A selects everything matching, Escape clears; Enter on
a row opens it; Alt+Left and Alt+Right resize the column under a header. It is a
`role="grid"` with the true `aria-rowcount`, one sorted header marked with
`aria-sort`, and a live status that says how many rows match and how many are
selected. The status and the empty or error message live in a frame beside the
grid, because a grid may own only rows.

**Columns are for working in.** Pinned to the start or the end, resized by
dragging an edge or by keyboard, hidden and reordered through the state
(`SET_HIDDEN`, `MOVE`); widths clamp to each column's bounds and the last visible
column cannot be hidden. Numbers stand at the end of their cell with equal-width
digits; a cell with no value reads as a dash; money, percentages, dates and
enums are written by their type in the page's locale.

**A view is an address.** `queryToParams` and `queryFromParams` put a query in
the URL readably — `?sort=date:desc,name&f.status=in:new|won&f.sum=100..500` — and
a link naming a column since removed loses that part instead of showing an empty
grid. Column layout is personal and stays out of links: `columnLayout` and
`applyColumnLayout` store it and lay it over today's columns, new ones joining
and removed ones dropping.

### Around the grid

Four pieces share the grid's controller, and none of them holds any state of its own.

```tsx
const [grid, setGrid] = useState<DataGridController<Lead>>()

{grid && <GridFilters grid={grid} views={views} />}
{grid && <GridColumns grid={grid} />}
{grid && (
  <GridBulkBar grid={grid}>
    <Button onClick={() => {
      const { grid: state } = grid.getSnapshot()
      assign(selectionPayload(state.selection, state.query)) // keys, or the query and its exceptions
    }}>Assign to…</Button>
  </GridBulkBar>
)}
<DataGrid controllerRef={setGrid} … />
```

```svelte
<GridFilters {grid} {views} />
<DataGrid bind:controller={grid} … />
```

```html
<gg-grid-filters for="leads"></gg-grid-filters>
<gg-grid-bulk for="leads"><gg-button>Assign to…</gg-button></gg-grid-bulk>
<gg-data-grid id="leads"></gg-data-grid>
```

**Filters are chips you can read.** Each filter in force is a chip that says it in
words — "Status: New, Won", "Paid: $100.00 – $500.00", "Manager: Unassigned" —
with × to remove it. Pressing a chip opens its editor; "Add a filter" picks a
column first. The editor follows the column's type: a checkbox list for enums
and booleans, two number fields for a range, two dates, or text. An emptied
editor removes its filter, and a range typed backwards is turned round rather
than matching nothing. A column can refuse (`filter: false`) or ask for a
different editor (`filter: 'text'`). An option with the value `null` names the
empty value, and the cell and the chip both use that name.

**Views are saved queries.** A view is `{ id, label, query }`; picking one replaces
the whole query (sort, filters, search) and goes through the same URL as
everything else.

**The column picker** is a checkbox group over the columns: the last visible one
cannot be unchecked, and "Reset" brings back the defaults.

**The bulk bar appears with a selection** and says what it covers: "2 selected",
then "Select all 126" when more rows match, then "All 126 selected". Your actions
go in its slot and send `selectionPayload` — keys, or the query with its exceptions —
so an action on 104,802 rows is one request.

**Export follows the query, not the page.** `collectRows(source, query)` reads
the source in blocks of 5,000, with progress and an abort signal, and only the
selection when one is given; `toCsv` writes formatted or raw values, with a
choice of separator (`;` for Excel in much of Europe) and a BOM so Excel reads
UTF-8.

**The address and the layout are kept.** `attachQueryToUrl(grid)` puts the query
in the address and follows the back button; `attachColumnStorage(grid, key)` keeps
widths, order and hidden columns in `localStorage`, and a page with storage
blocked still works.

### From a row

Editing in place, a row's context menu and a detail sheet. The grid does the
work; the menu and the sheet are the kit's own Menu and Sheet, placed by it.

```tsx
<DataGrid
  columns={[
    { id: 'company', header: 'Company', editable: true, validate: (v) => (v ? null : 'A lead needs a company') },
    { id: 'sum', header: 'Paid', type: 'money', editable: (lead) => lead.status !== 'won' },
  ]}
  onCellEdit={({ key, column, value }) => api.patch(key, { [column.id]: value })}  // reject to roll back
  controllerRef={setGrid}
  …
/>
<GridRowMenu grid={grid} items={(target) => entries} onSelect={(value, target) => run(value, target)} />
<GridDetail grid={grid} title={(lead) => lead.company}>
  {(lead, index) => <LeadFields lead={lead} onStatus={(s) => grid.saveCell(index, 'status', s)} />}
</GridDetail>
```

**An edit shows at once and is taken back if the server says no.** A column
opts in with `editable` (a function decides per row). F2, Enter, a double click
or just typing opens the editor in the cell — a text field, a number field that
reads "1 250,5" as well as "1,250.5", a date, or a select of the column's
options. Enter saves, Escape puts the cell back, Tab goes on to the next
editable cell of the row, and a click elsewhere keeps what was typed. The new
value is drawn straight away and marked as saving; `onCellEdit` gets the row,
the value and the one before, and if it rejects, that cell — only that cell,
not the row — gets its old value back, is marked, and the status line says why.
A value the column refuses (`validate`, or "lots" in a number) keeps the editor
open with the reason under it. Saves are matched to rows by key, so a save that
comes back after the rows moved still lands on its row, and a late answer for
an edit since replaced says nothing. `grid.saveCell(index, column, value)` is
the same path for a form of your own.

**The row being edited is never recycled.** Rows are reused as they scroll;
the one with the editor is drawn even while it is out of view, so its focus and
its half-typed value survive a scroll of 700,000 rows.

**A right click, Shift+F10 or the menu key opens the row's menu** — at the
pointer, or under the active cell for the keyboard, and it gives the focus back
to the grid. The browser's own menu stays unless a row menu is on the page. On
a row inside a selection of several, `target.selection` carries the selection,
so an action can take all of it, as a file manager's does.

**The detail sheet shows one row and walks to the next.** Enter on a cell that
is not editable, a double click, or `grid.openDetail(index)` opens it beside
the grid; ↑ and ↓ step through the rows without closing, "6 of 104,802" says
where you are, and the row being shown is marked in the list. It is not modal:
the grid stays usable, and pressing another row — or moving with the arrow keys
— shows that one. A row stepped to that is not loaded yet is asked for and
shown when it arrives.

In the sandbox, each page carries the registry: 700,000 generated leads, answered
after 120ms as a server would. It has a search field, status badges in cells,
filters with four views, a column picker, "Assign to…" on any selection
including all matching, CSV export of the query or the selection, six editable
columns saved after 400ms (a sum typed on a Lost lead is refused, to show the
rollback), a row menu with Assign and Status submenus, and the lead in a sheet
with its status to change.

Found on the way:

- **React StrictMode killed the grid in the sandbox while every test passed.**
  StrictMode unmounts and remounts each component once in development, and the
  grid destroyed its loader on the first unmount, so it sat on "Loading…" forever.
  The conformance harness renders without StrictMode, which is why nothing
  caught it. A grid now aborts its requests when it detaches and asks again when
  it comes back, and `react-strict.dom.test.ts` renders it under StrictMode — it
  fails with the old code put back.
- **A checkbox click that was cancelled undid the grid's own drawing.** The
  browser reverts a cancelled checkbox click after every handler has run, which
  is after the elements and React adapters had already drawn the new state. The
  click is no longer cancelled; the box is set to what the grid decided.
- **Sorting depends on the language.** The first tests assumed Latin before
  Cyrillic; the machine's locale was Russian, where it is the other way round.
  The locale is now an option everywhere a sort or a format happens.
- **A plain click on a tie-breaker column** used to flip its direction as a
  tie-breaker; it now starts it afresh as the only key, which is what "sort by
  this" means.
- **The "Unassigned" view showed "Manager: empty".** The chip named a `null`
  value by the fallback word before looking for an option that names it, and the
  cells showed a dash. Both now use the column's own word.
- **Links were written in percent codes.** `URLSearchParams` escapes `:`, `|` and
  `~`, so `?f.manager=in:~` reached the address bar as `in%3A%7E`. The address is
  now written with those left as they are; they are legal in a query string.
- **A test typed into a hidden input.** gg-select carries a hidden input for its
  form value, and "the first input in the editor" found it. The tests now skip
  hidden inputs.
- **A non-modal sheet sat at the bottom of the page.** A dialog opened with
  show() is not in the top layer, and the browser places it absolutely, where
  it is in the page; the sheet layout had only ever met showModal(). A sheet is
  now fixed to the viewport's edge either way.
- **The custom element focused its editor before it was on the page.** The
  editor was created and focused while its row was still being put together,
  and focusing a detached field does nothing. It is focused once the row is in.
- **"Saving" in muted text failed contrast on a selected row** (4.36:1). A saving
  value is underlined, dotted, instead, and keeps its colour.
- **`controllerRef` could crash React.** The effect returned whatever the
  callback returned, and React calls a returned value as the cleanup: a
  callback written `(c) => (grid = c)` threw "destroy is not a function". The
  effect now returns nothing.
- **A `<gg-select>` built in script lost its value.** A value set before the
  element was on the page went to a machine that did not exist yet, and was
  dropped: the detail sheet's Status select came up empty on the vanilla page.
  The element now keeps it and starts from it; a test in `elements.dom.test.ts`
  fails without the fix.
- **Enter means "edit" on an editable cell.** It used to open the row
  everywhere. Open a row from a cell that is not editable, by a double click on
  one, or from the row menu.

## Layering inside core

```
components/<name>/machine.ts   pure reducer. No DOM. Node-testable.
components/<name>/connect.ts   state -> prop bags. Framework-neutral.
utils/*.ts                     DOM-aware, framework-free.
```

"SSR-safe" is not "no DOM" — it is *no DOM access at module scope*. `utils/` may
touch `document` freely inside functions. The machine tests run in vitest's
`node` environment specifically so a stray `document` reference in a reducer
fails the build.

The state machine is a 40-line reducer plus a subscription, not XState. The value
is in writing transitions down explicitly; the library is not the point, and
`core` stays cheap.

`@floating-ui/dom` is core's only dependency, deliberately. The rule is zero
*framework* dependencies, not zero dependencies — flip/shift against scroll
containers is a solved problem and reimplementing it is a multi-month detour.

## Four things the scaffold got wrong first, and what they cost

**Controlled mode was inert.** The first machine diffed `value` to decide when to
call `onValueChange`. In controlled mode the machine never writes `value`, so the
callback never fired and the component did nothing — while a `SYNC_VALUE` push
from the owner *did* fire it, echoing the owner's own write back at them. The fix
is a separate `intent: { value, nonce }` field: user intent always advances,
`value` advances only when the machine owns it. Decide this before component one;
retrofitting controlled mode onto a machine that assumed it owns its state is a
rewrite of every component at once.

**The vanilla renderer skipped the empty state.** React and Svelte rendered
`[data-part="empty"]` for an empty list; the custom element looped over items and
so rendered nothing. This is the standing risk of the architecture — adapter
drift — and it is exactly what a conformance suite is for. The suite had to grow
a test before it caught it.

**ChipGroup had no tab stop when items arrived late.** A custom element is
constructed empty and has `items` assigned afterwards, so `focus.index` stayed at
`-1` from the initial state and *every* chip got `tabindex="-1"` — the group was
completely unreachable by keyboard. `SYNC_ITEMS` now re-homes the tab stop. The
same bug hits any adapter that fetches its items. One failing assertion in the
conformance suite caught this and the next one together.

**Focus was moved in a passive effect, on every render.** Two faults in three
lines: `useEffect` runs after paint, so focus landed a frame late; and the dep
array contained a freshly-built `ids` object, so it re-ran on *every* render and
would drag focus back into the group from wherever the user had moved it. Fixed
with `useLayoutEffect` plus an explicit last-seen-nonce ref — and the same guard
in the Svelte and vanilla adapters, since all three had inherited the pattern.

## Theme checks

A theme can be wrong in ways that never throw: a custom property that resolves to
nothing paints nothing, a stylesheet nobody imports is dead, a component missing
from one theme renders unstyled only there, and a colour below threshold is found
by the person who cannot read it. `@ggary/checks` turns each of those into a
failing test. Themes are discovered from `packages/theme-*`; a theme without a
`theme.check.ts` fails rather than going unmeasured.

**The contract is data.** `packages/structure/contract.json` holds the layer
order, the public `--gg-*` names, the runtime-written variables, and the contrast
pairs every theme owes through those names. A pair can only measure a name the
contract defines, so the two cannot drift apart.

**Structure**, checked by reading the theme as shipped and following its imports:

| Check | Fails when |
|---|---|
| imports | an `@import` does not resolve |
| layers | the `@layer` order differs from the contract |
| orphans | a stylesheet in `src/` is not reachable from `index.css` |
| parity | core ships a component the theme has no stylesheet for |
| contract | a `--gg-*` name is not mapped on the root, or an unknown one is declared |
| variables | a `var()` with no fallback names a property declared nowhere the theme loads |
| selectors | a rule targets a class instead of `[data-scope][data-part]` and state |
| structure | the shared structure layer reads a theme-private token |

Variables are resolved per theme in isolation, which also catches one theme's
private token leaking into another's CSS.

**Contrast** is Instrument's Go gate (`tools/cmd/contrast`), ported to TypeScript
and generalised. Tokens are computed from the files as a browser computes them on
`<html>` — the cascade with layers, `var()` with fallbacks, `calc()`,
`light-dark()` by colour scheme, `color-mix(in oklab)`, OKLCH to sRGB, translucent
layers composited onto their base — in every context a theme declares:

| Theme | Contexts | Pairs | Measurements |
|---|---|---|---|
| GGarry | light, dark | 15 contract + 23 own | 76 |
| Instrument | 5 modes × 4 accents | 15 contract + 117 own | 2,640 |

Thresholds are WCAG's 4.5:1 for text and 3:1 for large text and meaningful
non-text (a control's own border, a state mark), plus Instrument's OKLCH
lightness step of 0.022 for surfaces that must read as separate — a ratio cannot
serve there, because WCAG's flare term squeezes every ratio towards 1 at the
dark end.

**The port was verified against the original**, not assumed: all 580 rows the Go
gate prints for the base accent, across five modes, match the TypeScript engine
within ±0.0005 — the rounding of Go's three-decimal output. One deliberate
difference: `color-mix(in oklab)` mixes in OKLab, where the Go code approximated
in sRGB; Instrument's tokens mix only against `transparent`, where the two agree.

**Coverage.** Every colour a theme's component CSS paints text with must be the
foreground of some pair. Instrument skipped relay variables (`--btn-fg`,
`--tone-ink`) by a hand-kept name pattern; here relays are followed instead —
a property never declared on the root is traced through every value it is given
down to the root tokens, and those must be covered.

**Waivers.** A theme may waive a known failure with a reason. A waived pair that
starts passing is itself a failure, so fixing a token forces the stale excuse out
with it. When GGarry's palette fixes landed, the gate flagged each waiver as
stale with its new value before the waivers were removed.

Every rule was proven able to fail: `tests/checks.contract.test.ts` builds a
throwaway workspace per rule with exactly one defect planted, and a planted
regression in Instrument's real `--text-muted` failed every row that reads it.

### What the first run found

**Instrument passes everything.** Its tightest pass is `stack: panel over page`
at ΔL 0.023 against 0.022 — exactly as tight as its own notes describe.

**GGarry had nine real failures.** They were first waived, each with a measured
candidate fix, then fixed. GGarry now passes all 76 measurements with no waivers:

| Failure | Before | Fix | After |
|---|---|---|---|
| placeholder and empty state on subtle text | 2.56:1 light · 3.75:1 dark | read text: `text-muted` | 4.76:1 · 6.96:1 |
| `--gg-text-faint` below the decoration threshold | 2.56:1 light | `text.subtle` → new `slate-450` `#8492a6` | 3.16:1 |
| select trigger border, its only boundary | 1.48:1 light · 2.36:1 dark | new `border.control`: slate-450 · slate-500 | 3.16:1 · 3.75:1 |
| white label on the dark accent fill | 3.58:1 | `bg.accent` dark → brand-600 | 5.23:1 |
| dark accent hover went *lighter*, towards the label | 2.48:1 | `bg.accent-hover` dark → brand-700 | 7.31:1 |
| white label on the dark danger fill | 3.76:1 | `bg.danger` dark → danger-600 | 4.83:1 |
| red text on the low-emphasis danger tint | 4.14:1 light | `text.danger` light → danger-700 | 5.54:1 |

Two of the fixes are structural rather than a colour swap. The select trigger got
its own **`border.control`** token instead of darkening `border-strong`: a
trigger's border is its only boundary and owes 3:1, while a button's outline is
decoration — its label identifies it — so outlined buttons and chips keep the
quieter border, exactly the load-bearing/decorative split Instrument draws. And
subtle text is now **decoration only** (a disabled option, measured at 3:1);
anything read uses `text-muted`.

`text.danger` changed globally in light mode, not only on the low-emphasis
button: every red label is now 6.5:1 on white instead of 4.8:1, rather than
keeping two reds.

## Props after mount

A machine is built once, from the props as they are at mount. Every prop that can
change afterwards reaches it as a `SYNC_*` event — never by the machine reading
props — and each component documents which props those are:

| Component | Synced after mount | Read once, by definition |
|---|---|---|
| Select | `items`, `disabled`, `value` | `defaultValue` |
| ChipGroup | `items`, `disabled`, `value`, `mode`, `orientation`, `removable` | `defaultValue` |

`mode`, `orientation` and `removable` share one `SYNC_OPTIONS` event that carries
the whole option set, with an absent option meaning its default: removing a prop
reverts it, and no adapter has to know the defaults. They were first read only at
construction and silently ignored afterwards, in all three adapters — the
conformance suite now changes each one on a live group and checks the behaviour
follows.

In Svelte the one-time construction is wrapped in `untrack`, which states the
intent and is what clears the compiler's `state_referenced_locally` warnings; the
sandbox build prints none.

## Two custom-element patterns, on purpose

`<gg-button>` **enhances** existing light-DOM markup:

```html
<gg-button tone="danger"><button>Delete</button></gg-button>
```

The server renders a real, working button; the element only decorates it. Nothing
to hydrate, no layout shift, works with a Go template or any other server
renderer.

`<gg-select>` **renders** its own light DOM, because a listbox has no meaningful
no-JS equivalent to enhance. Give it a min-height in CSS if it sits above the
fold, or you get layout shift on upgrade. `<gg-chip-group>` renders too.

The rule decides new elements: anything with a working native form — field,
input, textarea, checkbox, switch, radio group — enhances. `<gg-checkbox>` and
`<gg-radio-group>` take a `<label>` around the input where the markup has one and
build it where it does not. The native state stays the truth, so they never write
`checked` back as an attribute. For the same reason `<gg-button>` keeps the
markup's button type: core defaults to `type="button"`, right for a framework
component, but a bare `<button>` in server markup submits its form, and the first
version of `<gg-button>` silently stopped every such form from submitting.

`<gg-dialog>` renders its `<dialog>` around the author's children, because opening
one needs JS anyway; the children themselves stay the author's.

## Testing

| Project | Env | Files | What it covers |
|---|---|---|---|
| machine | node | `*.machine.test.ts` | 255 tests. Every transition of every machine, pure, milliseconds; `mergeProps`; the choice and group connects; tooltip timing with fake timers; the menu's highlight, selection, item roles, submenu levels and pointer corridor; the menubar's bar, menu switching and access keys; tabs' selection and closing; the toast queue and its clock, with fake timers; the grid's query, loader and selection; filter chips and drafts, views, the bulk bar, the column picker, export and CSV, the URL and column storage; drafts and their parsing, saves shown at once and rolled back per cell, the detail following the grid, the row menu's target. |
| contract | node | `icons.contract.test.ts` | 258 tests. Core names only real glyphs, adapters draw none. |
| contract | node | `themes.contract.test.ts` | 7 tests. Every discovered theme: structure, contrast, coverage. |
| contract | node | `checks.contract.test.ts` | 24 tests. The gates themselves: each rule fires on a planted defect; the colour engine. |
| dom | jsdom | `conformance.dom.test.ts` | 942 tests, 26 of them skipped where an adapter or the environment cannot express the case. One contract × three adapters. |
| dom | jsdom | `layers.dom.test.ts` | 8 tests. The dismiss stack: which layer hears Escape and an outside press. |
| dom | jsdom | `elements.dom.test.ts` | 33 tests. What only custom elements have: properties, events, attribute fallbacks, enhancement. |
| browser | Chrome | `conformance.browser.test.ts` | 942 tests, 17 skipped. The conformance suite again, in a real browser through Playwright: real layout, focus, events and top layer. |
| browser | Chrome | `dialog.browser.test.ts` | 8 tests. What only a browser has: `:modal`, inert page, scroll lock, real keys and clicks, the dismiss stack, form closes. |
| browser | Chrome | `rhythm.ggarry.browser.test.ts`, `rhythm.instrument.browser.test.ts` | 5 tests. The form rhythm — Field's label and hint included — the listbox and menu corners, a closed menu not drawn, a menu row's shortcut at its edge, and a sheet flush with each edge, measured in pixels, per theme, mode and density. |
| browser | Chrome | `overlay.browser.test.ts` | 18 tests. Popover placement and flipping, the top layer escaping a clipping ancestor, Select unclipped inside `overflow: hidden` and a short dialog, a long Select and a long Menu keeping their row in view, real hover and Tab for tooltips, a menu driven by the real keyboard and pointer, submenu placement, flipping and the pointer corridor, a menubar by real keys (Tab, arrows, Alt+key, F10) and pointer, nested and passive layers. |
| browser | Chrome | `tabs.browser.test.ts` | 4 tests. One tab stop under the real Tab key, vertical tabs beside their panel, a long strip scrolling to the focused tab, a real click closing a tab without losing focus. |
| browser | Chrome | `toast.browser.test.ts` | 4 tests. The region in its corner over a clipping ancestor, presses passing through its empty stretch, a real pointer holding a toast, the keyboard reaching its action. |
| browser | Chrome | `data-grid.browser.test.ts` | 9 tests. The grid at 700,000 rows: a screenful drawn, the true count announced, the scaled scrollbar reaching the last row flush with the bottom, Ctrl+End with the focus surviving recycled rows, a pinned column staying put, resizing by drag, a scroll step inside a frame, requests aborted for rows scrolled past, and React under StrictMode and Svelte reaching the end too. |
| browser | Chrome | `data-grid-rows.browser.test.ts` | 6 tests. A double click and a click elsewhere saving, Tab walking the editable cells, an edit surviving its row scrolled out of view (elements, and React under StrictMode), the row menu standing at the pointer and handing the focus back, a press on another row while the sheet is open. |
| dom | jsdom | `react-strict.dom.test.ts` | 1 test. The grid under React StrictMode, which unmounts and remounts once, still loads. |
| browser | Chrome | `navigation.browser.test.ts` | 8 tests. A toolbar under the real Tab and arrow keys — wrapping, skipping what is disabled, returning to the tool last used — a field inside it keeping its own arrows, the spacer measured against the strip's inset, the drawn chevron that is in no text, and a step's bar spanning its item. |
| browser | Chrome | `controls.browser.test.ts` | 5 tests. One tab stop and the arrow keys on a segmented control, a radio really covering its segment, a range input stepped by the keyboard with the fill following as a computed property, and a real pointer dragging an axis letter under capture. |
| browser | Chrome | `display.browser.test.ts` | 3 tests. An avatar's picture really loading over the initials, a broken one removed, and a picture not drawn while it loads. |
| dom | jsdom | `autosize.dom.test.ts` | 11 tests. Auto-resize against a simulated layout: grow, shrink, cap, and re-measure when the page changes. |
| dom | jsdom | `svelte-bind.dom.test.ts` | 3 tests. `bind:value` on Select, ChipGroup, RadioGroup and CheckboxGroup writes back to the owner and follows it. |

**Machine tests** cover behaviour in depth, once, where it is cheap. They run with
no DOM at all, which is also what keeps reducers from touching one.

**Contract tests** check the architecture itself: core names only glyphs that
exist, adapters contain no SVG, every theme loads the base glyph set and overrides
only known names, and the glyph compiler rejects bad input. Each was verified by
planting the violation and watching it fail.

**Conformance** is where adapter drift gets caught. Each spec in
`tests/conformance/*.spec.ts` is written once against a small harness
(`harness.ts`) that hides the three things that differ between frameworks — how a
component mounts, how new props reach it, and when its effects have flushed:

| Adapter | Props | Flush |
|---|---|---|
| elements | attributes and properties; callbacks are DOM events | synchronous |
| react | `root.render` with new props | `act()` |
| svelte | a `$state` props object, mutated in place | `flushSync()` |

A failure names the adapter that drifted — `svelte > chip group > roving tabindex
> wraps at both ends`. The suite was checked by planting a different bug in React
and in Svelte: each failed under its own adapter's name and nowhere else. A spec
skips what an adapter's API cannot express and says so (custom elements have no
controlled mode), rather than faking it.

Custom elements are also tested for being MOVED — detached and re-attached, as a
sorted list or a drag-and-drop does. Disconnecting unsubscribes from the machine,
so reconnecting has to subscribe again; the first version of every stateful
element returned early instead and went dead. An open `<gg-select>` closes when
it leaves the document.

Every mount is tracked and unmounted after each test. Detaching a component's DOM
does not unmount it: an open Select keeps its document-level Escape listener, and
the first run of the suite had the next test's keypress driving the previous
test's machine.

The browser project runs the identical suite (`tests/conformance/suite.ts`) in the
Chrome installed on the machine — Playwright drives it, and nothing is downloaded.
Set `GG_BROWSER_CHANNEL=msedge` for Edge, or `chromium` after
`npx playwright install chromium`. jsdom stays for speed and for machines with
no browser (`npm run test:fast`), but it has no layout, no `<dialog>` methods,
no Popover API and no `inert`: anything that depends on those is only proven in
the browser run.

Floating UI is mocked in the jsdom suite. jsdom reports every rect as 0x0, so
flip/shift/size churn against degenerate input — the suite took 216 seconds
before the mock and 0.9 seconds after. Positioning is a visual concern; verify it
in Playwright.

## Known gaps

Real, and deliberately left open:

- **No build pipeline.** Packages export raw `src/*.ts` and Vite compiles from
  source, which is why edits in `packages/` hot-reload with no build step. Add
  tsup and point `exports` at `dist` before publishing. The per-component
  `exports` entry points are already in place.
- **Select's form participation is a hidden `<input>`.** It submits and resets
  correctly, but there is no `required`/constraint validation; that needs a hidden
  `<select>` instead.
- **No SSR test.** Core should be import-safe on a server; unverified.
- **A Svelte Select or ChipGroup cannot refuse a choice.** They support
  `bind:value`, so a pick moves them and writes the binding; only a controlled
  React owner can show a value other than the one picked.
- **The chip dismiss "x" is not a button.** A chip that is itself a `<button>`
  cannot legally nest one, and two tab stops per chip wrecks roving tabindex. So
  it is a pointer affordance, `aria-hidden`, with `aria-keyshortcuts="Delete"`
  advertising the keyboard path. A screen-reader user has to discover that
  shortcut. If your chips are removable but *not* selectable, invert it: make the
  dismiss a real button and drop the chip's own interactivity.
- **ChipGroup uses `role="toolbar"` with `aria-pressed` chips.** Right for filter
  chips, which deselect on re-click. Exclusive choice that cannot be undone wants
  a real `radiogroup` instead.
- **In Instrument a destructive primary does not look destructive.** High emphasis
  + danger keeps the accent fill, by Instrument's rule that a solid fill belongs
  to the accent alone. Faithful to the language, but a real loss of meaning: a
  project on Instrument should not rely on colour for a dangerous primary.
- **Instrument's private tokens are unprefixed** (`--text-primary`, `--border`).
  They can collide with an application's own custom properties. Prefixing 2,000
  lines was out of scope for a first port.
- **`data-accent` on a subtree is unverified in Instrument.** Its semantics are
  declared on `:root`; the port only exercised the attribute on `<html>`.
- **A tooltip on a disabled button never shows.** A disabled button fires no
  pointer or focus events; wrap it in a focusable element, or say why it is
  disabled in visible text.
- **No arrows** on popovers or tooltips, and no CSS anchor positioning: Floating
  UI places everything, which works in every browser the kit targets.
- **No exit animation.** A dialog's body unmounts as it closes, so there is nothing
  left to animate out; opening fades in. Popover and Tooltip, likewise.
- **Svelte and the custom elements cannot refuse a close.** `bind:open` and the
  `open` attribute follow the dialog; only a controlled React owner can keep it
  open against a request.
- **A dialog inside a `display: none` ancestor never shows,** top layer or not.
- **A non-modal dialog does not keep focus.** By design — it floats over a page
  that stays usable — but Tab walks out of it.
- **Platform close requests** (a back gesture) are cancelled through the `cancel`
  event, which browsers may refuse to let a page cancel without recent user
  activation; the dialog then closes natively and reports `native`.
- **Not ported from Instrument:** everything beyond these thirty components —
  prose, the rest of forms (number field, slider, choice cards), tables,
  the agent components (including the composer, a textarea with a toolbar in one
  frame) and print styles.
- **One cell at a time.** No pasting a block of cells, no fill-down, and no undo
  beyond the rollback of a failed save.
- **An edit to `rows` is yours to keep.** With an array in the page, the grid
  shows the edit and calls `onCellEdit`; write the value into your array there,
  or the next query reads the old one. A server source has the same rule: save
  it, and the next answer carries it.
- **The detail sheet does not close from the grid.** Escape in the grid clears
  the selection; the sheet closes from its ✕ or Escape inside it.
- **Columns are reordered only through the state.** The picker hides and shows;
  there is no dragging of headers yet.
- **Export is CSV.** No XLSX: that would add a dependency for a format Excel
  already opens.
- **Instrument does not style the data grid.** It is frozen; with Instrument
  selected, the sandbox's grid shows the structure layer only.
- **The grid's rows have one height.** By design (see DataGrid), not by accident.
- **A toolbar's role is opt-in.** An unnamed strip is a row of ordinary buttons
  with a tab stop each; that is Instrument's position, and it stays available.
- **No Shell.** The side column, the drawer and the responsive strip Instrument's
  shell provides are layout, and this kit has no layout components yet.
- **An affix names nothing.** "$" and "per hour" are text beside the field, not a
  label: a screen reader announces the field's own name, so put the unit in the
  label or the hint as well.
- **FileDrop shows what was chosen and nothing else.** No progress, no removing one
  file of several, no upload: the component chooses files, the page sends them.
- **No Cascader and no Inserts** from Instrument's inputs yet.
- **A segmented control cannot be links.** Instrument's variant carries the state
  on `aria-current="page"` when the options are addresses. Here the options are
  radios, so a row of links is a nav, not this component.
- **The slider is one value.** No second thumb, and no range; a pair of number
  fields says "from" and "to" better anyway.
- **Instrument's Tag is Chip.** A static chip is a tag, so there is no separate
  component.
- **`<gg-card>` cannot be a link card.** A custom element cannot become an `<a>`.
  Put the link inside the card, or use React or Svelte, where `href` renders the
  card as an anchor. The conformance test for link cards skips the elements adapter
  and says why.
- **A dismissed banner is hidden in elements, and removed in React and Svelte.**
  An element cannot remove itself from markup that someone else owns. It sets
  `hidden` unless the `dismiss` event is prevented.
- **Instrument's support rank uses `--surface-recessed`.** The port has no separate
  support film token for the region channel, and a nested region takes the same
  recess.
- **`onValueChange` fires when the user re-picks the already-selected value.**
  Intent semantics, not value-diff semantics. Correct for controlled components,
  mildly surprising otherwise.
- **Instrument's other gates are not ported:** tap targets (`cmd/targets`),
  proportions (`cmd/proportion`), and the component registry (`cmd/registry`).
  Forced-colors behaviour is styled but not checked.
- **The browser's validation bubble shows alongside the inline error** on a form
  without `novalidate`. Suppressing it in the field would also suppress the
  browser scrolling to and focusing the first invalid control, so it is left to
  the form (see Field and Input).
- **Select does not consume a Field or a Fieldset.** It is a listbox with its own
  label, not a native control. Option groups belong in a Fieldset; `<gg-field>`
  should not wrap one — it would treat the first option as its control.
- **CheckboxGroup has no select-all.** A parent checkbox that is indeterminate
  while some are checked is still built by hand, as the sandbox's Checkbox demo does.
- **Fieldset has no framed variant** (Instrument's `.inst-fieldset--framed`) and no
  side-by-side label layout.
- **A dialog or popover title's distance to its content is not on the rhythm
  tokens.** It is still each theme's own.
- **Menu has no leading icons** and no second line of description on an item
  (Instrument's `.inst-menu-item-sub`).
- **Submenus are left-to-right only.** They open to the right, and ArrowRight opens
  them, whatever the document's direction.
- **A menu item cannot keep the menu open from `onSelect`.** Whether it closes is
  decided up front, by `closeOnSelect` on the menu or the item.
- **`<gg-menu>` items are data only** — the `items` property or a JSON attribute.
  There is no markup form (`<button>` children) to enhance.
- **Menu item values must be unique.** Rows are keyed and reused by value.
- **Menubar is uncontrolled.** `onOpenChange` reports the open menu, but there is no
  prop that opens one.
- **Access keys cover the bar only.** Inside an open menu a letter moves to the item it
  starts, as typeahead; it does not activate an item marked with `&`.
- **A toast is not seen over an open modal dialog.** The top layer orders by entry, and
  a modal holds above a popover opened later (Instrument measured the same). Report a
  result inside the dialog, or show the toast after it closes.
- **One `Toaster` per toaster.** Two regions on one queue render every toast twice.
- **No context menu yet.** The Menu machine and content are ready for one opened at
  the pointer; the trigger is not built.
- **No option descriptions.** A radio or checkbox with a second line of help
  text (Instrument's choice card) is not built.
- **No character counter.** `maxLength` is enforced by the browser, silently; a
  "12 / 280" readout (with a polite live region) belongs to Field.
- **No affixes.** No icon, prefix, suffix or clear button inside an input.
- **`minlength` only applies after a real edit.** Browsers report `tooShort` for
  user edits, not for a value set from script — native behaviour, but it means a
  pre-filled short value passes until touched.
- No Changesets, no docs site.

## Scope

"Like antd" is a scope trap. Antd is ~70 components with a decade of edge cases
and a full-time team. A genuinely useful 20-component kit is months of focused
work, and date pickers and data tables are each their own project. Build the
components your own projects need, keep the contract clean enough that the next
one is mechanical, and stop.

## Notes

npm workspaces, not pnpm. Turborepo only once builds get slow enough to annoy
you, not before.
