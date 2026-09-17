# ggary-ui

A UI kit scaffold: one framework-agnostic core, three sibling renderers (vanilla
custom elements, React, Svelte 5), and two complete design languages on top of it.
Fifteen components — Button, Chip, ChipGroup, Select, Field, Fieldset, Input,
Textarea, Checkbox, CheckboxGroup, Switch, RadioGroup, Dialog, Popover and
Tooltip — built end to end to prove the architecture holds.

The two themes are **GGarry**, the kit's own neutral language, and
**Instrument**, ported from [keshon/instrument](https://github.com/keshon/instrument)
to test whether a strict, opinionated language can live on this spine without
becoming a monolith again.

```bash
npm install
npm run dev      # http://localhost:5180 — three pages, same demo
npm test         # 1204 tests, 468 of them in headless Chrome
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
                     <gg-textarea>, <gg-checkbox>, <gg-switch>, <gg-radio-group>, <gg-dialog>,
                     <gg-popover>, <gg-tooltip>, <gg-fieldset>, <gg-checkbox-group>
  react/             <Button>, <Chip>, <ChipGroup>, <Select>, <Field>, <Input>, <Textarea>,
                     <Checkbox>, <Switch>, <RadioGroup>, <Dialog>, <Popover>, <Tooltip>,
                     <Fieldset>, <CheckboxGroup>
  svelte/            the same ten as React
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
| machine | node | `*.machine.test.ts` | 111 tests. Every transition of every machine, pure, milliseconds; `mergeProps`; the choice and group connects; tooltip timing with fake timers. |
| contract | node | `icons.contract.test.ts` | 97 tests. Core names only real glyphs, adapters draw none. |
| contract | node | `themes.contract.test.ts` | 7 tests. Every discovered theme: structure, contrast, coverage. |
| contract | node | `checks.contract.test.ts` | 23 tests. The gates themselves: each rule fires on a planted defect; the colour engine. |
| dom | jsdom | `conformance.dom.test.ts` | 447 tests. One contract × three adapters. |
| dom | jsdom | `layers.dom.test.ts` | 8 tests. The dismiss stack: which layer hears Escape and an outside press. |
| dom | jsdom | `elements.dom.test.ts` | 32 tests. What only custom elements have: properties, events, attribute fallbacks, enhancement. |
| browser | Chrome | `conformance.browser.test.ts` | 447 tests. The conformance suite again, in a real browser through Playwright: real layout, focus, events and top layer. |
| browser | Chrome | `dialog.browser.test.ts` | 8 tests. What only a browser has: `:modal`, inert page, scroll lock, real keys and clicks, the dismiss stack, form closes. |
| browser | Chrome | `rhythm.ggarry.browser.test.ts`, `rhythm.instrument.browser.test.ts` | 5 tests. The form rhythm and the listbox corners, measured in pixels, per theme, mode and density. |
| browser | Chrome | `overlay.browser.test.ts` | 8 tests. Popover placement and flipping, the top layer escaping a clipping ancestor, Select unclipped inside `overflow: hidden` and a short dialog, real hover and Tab for tooltips, nested and passive layers. |
| dom | jsdom | `autosize.dom.test.ts` | 11 tests. Auto-resize against a simulated layout: grow, shrink, cap, and re-measure when the page changes. |

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
- **Form participation is a hidden `<input>`.** It submits correctly, but native
  `reset` does not clear the Select and there is no `required`/constraint
  validation. Both need a hidden `<select>` instead.
- **No positioning test in CI.** See above — needs Playwright.
- **No SSR test.** Core should be import-safe on a server; unverified.
- **Svelte Select and ChipGroup have no `bind:value`.** Their API mirrors React
  (`value` + `onValueChange`). Input has one; the other two should follow.
- **The chip dismiss "x" is not a button.** A chip that is itself a `<button>`
  cannot legally nest one, and two tab stops per chip wrecks roving tabindex. So
  it is a pointer affordance, `aria-hidden`, with `aria-keyshortcuts="Delete"`
  advertising the keyboard path. A screen-reader user has to discover that
  shortcut. If your chips are removable but *not* selectable, invert it: make the
  dismiss a real button and drop the chip's own interactivity.
- **ChipGroup uses `role="toolbar"` with `aria-pressed` chips.** Right for filter
  chips, which deselect on re-click. Exclusive choice that cannot be undone wants
  a real `radiogroup` instead.
- **Subtle chips are low-contrast in GGarry's dark mode.** `--ggarry-bg-muted`
  sits close to `--ggarry-bg-surface` there. A one-line token change.
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
- **Popover and Tooltip have no exit animation**, for the same reason as Dialog.
- **No exit animation.** A dialog's body unmounts as it closes, so there is nothing
  left to animate out; opening fades in.
- **Svelte and the custom elements cannot refuse a close.** `bind:open` and the
  `open` attribute follow the dialog; only a controlled React owner can keep it
  open against a request.
- **A dialog inside a `display: none` ancestor never shows,** top layer or not.
- **A non-modal dialog does not keep focus.** By design — it floats over a page
  that stays usable — but Tab walks out of it.
- **Platform close requests** (a back gesture) are cancelled through the `cancel`
  event, which browsers may refuse to let a page cancel without recent user
  activation; the dialog then closes natively and reports `native`.
- **Not ported from Instrument:** everything beyond these fifteen components —
  prose, the rest of forms (number field, slider, choice cards), tables, the sheet
  and toast overlays,
  the agent components (including the composer, a textarea with a toolbar in one
  frame) and print styles.
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
- **Form `reset` does not clear a field's error state.** The machine has a
  `RESET` event; nothing listens for the form's `reset` yet.
- **Select does not consume a Field or a Fieldset.** It is a listbox with its own
  label, not a native control. Option groups belong in a Fieldset; `<gg-field>`
  should not wrap one — it would treat the first option as its control.
- **CheckboxGroup has no select-all.** A parent checkbox that is indeterminate
  while some are checked is still built by hand, as the sandbox's Checkbox demo does.
- **Fieldset has no framed variant** (Instrument's `.inst-fieldset--framed`) and no
  side-by-side label layout.
- **The rhythm tokens cover options and groups only.** Field's own label-to-control
  gap and a dialog or popover title's distance to its content are still each
  component's.
- **No option descriptions.** A radio or checkbox with a second line of help
  text (Instrument's choice card) is not built.
- **After a native form reset, React and Svelte state is stale.** The boxes look
  right — the theme follows `:checked` — but the adapters' own state, the
  `data-state` attributes and a controlled owner never hear of it.
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
