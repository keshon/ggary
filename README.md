# ggary-ui

A UI kit scaffold: one framework-agnostic core, two sibling renderers (React 19
and Svelte 5), and one design language, GGarry, on top of it.
Ninety-five components — DataGrid, Kanban, Gantt, CommandPalette, Run, Queue, History, Budget, Step, Log, Diff, Lanes, Turn, Composer, Thinking, Approval, Failure, Sparkline, Legend, Meter, Ring, Share, Heatmap, Metric, MetricRow, KeyValueList, FileChange, Timeline, StatusDot, Caret, CodeBlock, Copyable, Inserts, Form, FormSummary, Combobox, DatePicker, Calendar, Cascader, Accordion, Tree, Progress, Shell, Split, Rail, StatusBar, PageHeader, Section, Container, Stack, Cluster, Grid, Button, ButtonGroup, Chip, ChipGroup, Select, Field,
Fieldset, Input, InputGroup, Search, Textarea, Checkbox, CheckboxGroup, Switch,
RadioGroup, ChoiceCardGroup, SegmentedControl, Slider, NumberField, FileDrop, Tabs,
Breadcrumbs, Nav, Pagination, Steps, Toolbar, Dialog, Sheet, Popover, Tooltip, Toast,
Menu, Menubar, Badge, Avatar, AvatarGroup, Spinner, Skeleton, Card, Panel, Banner,
Note and EmptyState — built end to end to prove the architecture holds.

**Retired on 2026-09-18: the vanilla custom-elements adapter (`@ggary/elements`,
the `gg-*` tags) and the Instrument theme**, a second language ported from
[keshon/instrument](https://github.com/keshon/instrument). The kit is React and
Svelte with one theme; keeping the two cost a third adapter's worth of tests and
a second theme's parity for every component. Both live in git history — the last
commit that has them is `88bdb06`. Instrument's lessons were kept: its
forced-colours layer, tap targets and tabular figures moved into GGarry, and its
rules are written down under "Theme principles".

```bash
npm install
npm run dev      # http://localhost:5180 — React and Svelte, same demo
npm test         # 3505 tests, 1309 of them in headless Chrome
npm run test:fast  # the same without the browser: node and jsdom only
npm run typecheck
npm run check:themes   # the theme gates as a readable report; -- -v for every row
```

`react.html` is React and `svelte.html` is Svelte; `index.html` sends you to
the React page. Each page draws its own chrome with its own framework's
components (see Themes), and the colour mode chosen there persists across both
pages.

## Layout

```
packages/
  core/              machine + connect + anatomy. No framework imports. One dependency.
  structure/         CSS a component needs to WORK, shared by every theme
  theme-ggarry/      GGarry: JSON tokens -> CSS, component CSS, the --gg-* contract
  icons/             glyph SVGs -> --gg-icon-* tokens; the shared glyph compiler
  checks/            the theme gates: structure and contrast, run on every theme
  react/             <Button>, <Chip>, <ChipGroup>, <Select>, <Field>, <Input>, <Textarea>,
                     <Checkbox>, <Switch>, <RadioGroup>, <Dialog>, <Sheet>, <Popover>, <Tooltip>,
                     <Menu>, <Menubar>, <Fieldset>, <CheckboxGroup>, <Tabs>, <Toaster>,
                     <Badge>, <Avatar>, <AvatarGroup>, <Spinner>, <Skeleton>, <Card>,
                     <Panel>, <Banner>, <Note>, <EmptyState>, <SegmentedControl>,
                     <Slider>, <NumberField>, <ChoiceCardGroup>, <Search>, <InputGroup>,
                     <FileDrop>, <ButtonGroup>, <Breadcrumbs>, <Nav>, <Pagination>,
                     <Steps>, <Toolbar>
  svelte/            the same components as React
apps/sandbox/        the two demo pages, React and Svelte
tests/               machine (node) · contract (node) · conformance (jsdom and Chrome) · browser (Chrome)
```

## How one component reaches two frameworks

`core` exports a `connect(state, send, normalizeProps)` that turns machine state
into plain prop bags. Each adapter passes its own normalizer and spreads the
result into its own markup.

```
connect() ----+-- reactNormalizer  --> <button {...api.triggerProps}>     (React)
              +-- svelteNormalizer --> <button {...api.triggerProps}>     (Svelte)
```

`normalizeProps` is the piece that makes this work at all. Prop bags do not
spread cleanly across frameworks — React wants `onClick`/`className`, Svelte 5
wants `onclick`/`class`. `connect()` emits one canonical shape and the
normalizer translates. Without it you get divergent copies of `connect()`, which
is the thing this architecture exists to prevent. A third, `domNormalizer`,
splits a bag into attributes and listeners for plain DOM: tests read a
connect's props through it.

Markup is still written once per framework. That duplication is the deliberate
price of not using a compiler — about 60 lines per component per adapter, all of
it readable. Two adapters are also what keeps core honest: React and Svelte
differ enough that core leaning on either shows up as the other failing.

## The contract

Four rules every component obeys, so themes and third-party components can
participate without importing any JS:

1. Every node carries `data-scope` and `data-part`. No theme stylesheet targets a
   class name, and the components emit none — `tests/conformance/select.spec.ts` asserts
   this.
2. Every state is a data attribute: `data-state="open"`, `data-highlighted`,
   `data-disabled`. CSS is a pure function of DOM state. Notably the Select's
   highlight is driven by machine state, never `:hover`, so mouse and keyboard
   cannot disagree about which option is active.
3. Every visual value comes from a token. Components hardcode no colors or sizes.
   Per-component custom properties (`--button-height`, `--btn-bg`) are the
   override surface.
4. Variants are named by **intent**, never by look: `emphasis: high | medium |
   low | minimal`, `destructive` for what an action does. A look-named variant like `outline`
   is a lie in any theme whose language forbids outlines; an intent is a question
   every theme can answer its own way.

Names follow three more rules, so a new component's API is predictable:

- **A state prop `x` pairs with `defaultX` and `onXChange`**: `value`,
  `open`, `checked`, `page`, `scale`, `collapsed`. An event about a thing
  is named for the thing: `onTaskChange`, `onCellEdit`, `onMove`.
- **`tone` is a state** — `neutral | running | ok | warn | error` — and only a
  state. What an action does is its own flag: `destructive` on a button or a
  menu item.
- **Everything a component says is in one `words` object**, each entry with
  an English default: `words.empty`, `words.retry`, `words.saveFailed`.

No shadow DOM. `data-scope` gives most of the encapsulation without breaking
theming, global CSS, or SSR.

## Themes

A theme is a package that owns **tokens and component CSS**. GGarry is the only
one, but the seams are kept as if there were others — the theme checker still
discovers themes rather than naming one. A theme shares with the rest of the kit
exactly three things, and nothing else:

1. **The DOM contract** — anatomy parts and state attributes, emitted by core.
2. **The cascade layers**:
   `gg.tokens, gg.structure, gg.base, gg.components, gg.forced, gg.motion`.
   Application CSS lives outside every layer and so always wins, with no
   `!important`.
3. **The public contract** — a short list of `--gg-*` custom properties
   (`--gg-page`, `--gg-surface`, `--gg-text`, `--gg-border`, `--gg-accent-text`,
   `--gg-font-sans`, …) that the theme maps onto its own private tokens.
   Application layout reads only these. The sandbox chrome is written against
   nothing else, which is how the contract is tested: it stays readable in every
   mode.

A theme's private tokens can have any shape. GGarry's are `--ggarry-*`, generated
from JSON.

**A project picks the theme** by importing one stylesheet. Its one axis is a
runtime attribute on any subtree: `data-mode`, light or dark (default: the
system's).

**A mode island repaints its own ground.** `data-mode="dark"` on an element that
is not a component's own — `:where([data-mode]:not([data-scope]))` — sets the
base text colour and the canvas there, so the page's own text inside a dark
panel is not dark on dark. A component's own `data-mode` (the calendar's
"range") is left alone.

**GGarry draws its own scrollbars**: thin, a thumb in the strong border's grey,
no track and no arrows — a board's scrolling column reads as part of the board,
not as a window's chrome. It uses the standard `scrollbar-width` and
`scrollbar-color`, not `::-webkit-scrollbar`, so Chrome and Firefox draw them
and a browser that has neither keeps its own bar. The colour is set on the root
and on every `[data-mode]` island, so a dark island has dark bars; the width is
set on the kit's own elements and the page's root, and a scroller of the page's
own keeps whatever the page gives it. (A headless browser draws overlay bars
that hide when idle, so the look is checked by computed style, not by a
screenshot.)

The sandbox imports GGarry once, as a project would, and sets nothing but
`data-mode`. Each page draws its own chrome with its own framework's
components — `apps/sandbox/src/Chrome.tsx` on the React page, `Bar.svelte` and
`Navigator.svelte` on the Svelte one, sharing what needs no framework in
`page-chrome.ts`: a SegmentedControl for the framework, one for the colour mode
(System, Light, Dark), a Nav for the page and a Button to open it. The bar
sticks to the top with the mark — two G's sharing a crossbar, wide open and cut
square so they do not read as an "@" — and the name.

The demo explains nothing. It shows the components working — the reasoning
lives here, in this file, and a page that carried both had two copies of it
to keep true. What the sandbox holds beside a component is its own state,
read back: the value a select chose, the query a grid built.

The page is laid out from one map, `apps/sandbox/src/sitemap.ts`: seven
numbered categories (Actions, Inputs, Overlays, Navigation, Layout, Data,
Display and feedback), the components in each, and a component's variants
where it has several. The page follows its order and the navigator is drawn
from it, so the two cannot disagree: a category is a Nav group, a component an
item, its variants the item's sections, opened while one is being read. The
one being read is the last whose top has reached the bar — a link lands its
section just under it, so the one clicked is the one marked. The navigator is
a column at the page's left edge, under the bar, where there is room, and a
popover from a button at the corner — "Data · Gantt" — where there is not. The
bar stands under the kit's own layers: a sheet beside the page covers it.

### `@ggary/structure`

The CSS a component needs to function in every theme: the positioner's absolute
placement and closed state, the listbox scroll, the chip list's flex and
orientation. It exists because porting a second theme found these rules
duplicated inside both themes' component CSS. The test for a rule belonging
here: would the component be *broken* without it in any theme? A closed listbox that still takes space is
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
the text around it, and a theme recolours it the way it recolours text. A theme
may draw its own glyphs on its own grid and stroke; GGarry uses the defaults.
Adding a glyph is one SVG file — no adapter changes.

**A mask clips everything on its element, pseudo-elements included** — learned
from Instrument the hard way. A part that carries an enlarged tap area in
`::before` cannot also be the glyph. That is why chip has `remove` (the target)
and `remove-icon` (the drawing), and the tab's close button likewise.

`npm run assets` compiles the glyph sets and GGarry's tokens; `dev`, `test` and
`typecheck` run it first.

### What Instrument left behind

Porting Instrument, a second and stricter language, changed the spine, and those
changes outlived it:

- **Loading is not disabled.** A busy button stays focusable; disabling it drops
  it out of the tab order under the fingers of whoever pressed it from the
  keyboard. Core emits `aria-busy` without `disabled`.
- **Variants became intents.** Instrument's measured "weights" answer *how loudly
  does this ask to be pressed*. GGarry's old `solid/subtle/outline/ghost/danger`
  answered *what does it look like*, and could not be mapped onto a theme that
  forbids outlines.
- **Structural CSS moved out of the themes** into `@ggary/structure`.

When it was retired, what GGarry lacked and Instrument had moved across:

- **Forced colours** (`a11y/forced.css`, in the `gg.forced` layer). The layer
  is declared after the components, so it wins by layer order, not by
  `!important`. Under forced colours every fill and shadow resets; what a fill
  alone said is said again in system colours. Surfaces a shadow lifted —
  tooltip, popover, menu, the select and combobox lists, toast — get a
  `CanvasText` border. Checkbox, radio and switch inputs and the grid's
  checkbox get a `CanvasText` border, and checked or on is `Highlight`, with
  `forced-color-adjust: none`; the radio's dot and the switch's thumb say their
  state in `CanvasText` or `HighlightText`. A highlighted list row (select,
  menu, combobox, cascader, command palette), an open menubar item and a
  selected chip in a group are `Highlight` and `HighlightText`. The busy
  button's spinner keeps a turning arc: a `ButtonFace` ring, a `ButtonText` arc.
- **A tap target.** `--ggarry-size-tap`, 24px (`size.tap` in
  `tokens/primitives.json`), sizes the checkbox's invisible target, and new
  invisible 24px targets on the chip's remove button (14px drawn) and the tab's
  close button (20px drawn). Both sit on the target part, not the icon: a mask
  would clip them.
- **A checked checkbox keeps an edge** half a step darker than its fill (its
  border is `bg-accent-hover`), so a 16px solid square does not blur into its
  own antialiasing.
- **Tabular figures** (`base/reset.css`) on grid cells, a progress bar's value
  text, pagination links, the number field's input, the slider's output, nav
  counts and status-bar items: figures that change in place or stand in a
  column keep their width.
- **Mode islands** repaint their ground (see Themes).

`tests/forced-colors.browser.test.ts` emulates forced colours in Chrome and
checks the boxes, the switch, the radio's dot and the busy ring; each fails with
the `gg.forced` layer removed.

Found on the way:

- **A transition hid the answer.** Right after forced colours came on, the
  checkbox still showed its accent, midway through its background transition.
  The test waits for the running CSS transitions before it reads a colour.

## Theme principles

What Instrument measured, kept as rules for GGarry and for any theme after it.

- **Radii are even,** so they land on whole pixels at 150% scaling. GGarry's
  are 4, 6 and 10.
- **A control's radius is about a quarter of its height,** and its padding is
  derived from its height, not set beside it.
- **A glyph under 8px** — a dot, a tick — gets a 2px radius. A browser silently
  turns a radius too large for its box into a circle.
- **An icon beside a label is sized by its ink** against the text's cap height;
  a lone icon against its box, at about 0.5 to 0.76 of it.
- **Text and marks are separate tokens.** Text needs 4.5:1; a mark needs 3:1,
  and must also clear the track beneath it.
- **The focus ring is kept apart from a solid fill by its 2px gap,** not by its
  colour.
- **A translucent recess measures depth from whatever is under it.** One fill
  per region; nested recesses compound.
- **A shadow means one of two things:** it floats, or it has thickness.
- **Hover moves a fill away from its label's colour,** never towards it.
- **Translucent tints stack.** Only an audit of rendered pixels catches where
  they fail; the token table cannot.
- **A control resolves within 140ms.**
- **A section gap is about four scale steps,** roughly four times the row gap.
- **A label column grows with type, never with density.**
- **Busy is not disabled.** A busy control stays focusable and says `aria-busy`.
- **A mask clips its own pseudo-elements,** so a tap area and a glyph need
  separate parts.
- **Auto margins and `display` must not rely on layer luck.** A reset in a later
  layer beats the structure layer; a rule that must hold goes where it cannot
  lose.
- **Every gate is proven by planting a defect.** A check that has never failed
  has not been shown to check anything.

**The scales.** Every family a component draws from has a token in
`tokens/primitives.json`, and the literal gate (see Theme checks) holds the
component CSS to it:

| Family | Tokens |
|---|---|
| space | `space-1` … `space-8`, on a 4px grid |
| radius | `mark` 2 (a glyph under 8px), `sm` 4, `md` 6, `lg` 10, `full`; `control-sm/md/lg` by a control's size |
| type | `font-size-2xs` 11 (the floor: a rail's labels, a count on a dot) … `xl`, three weights; `line-height-tight` 1.3 (titles), `snug` 1.4 (labels), `normal` 1.5 (body), `relaxed` 1.6 (long reading), `row` 20px (a one-line list row, whose height is this and its padding), `caption` 16px (a readout's small line) |
| size | `control-sm/md/lg` 28/34/40, `row` 32 (a list row), `icon-button-sm` 24 (closes a message, sits in a field), `icon-button-md` 28 (a surface's own tool), `tap` 24, `edge` 3 (an accent edge), `indicator` 2 (a chosen tab's line, a thumb's border) |
| opacity | `disabled` 0.55, `stale` 0.6 (content being replaced, or waiting on its owner), `quiet` 0.6 (a secondary glyph at rest), `area` 0.12 (a series' fill under its line) |
| motion | `duration-fast` 120ms (a control), `normal` 200ms (a surface moving); loops: `spin` 600ms, `blink` 1s, `pulse` 1.6s, `calm` 3s (a loop slowed under reduced motion); `easing-standard` (ease), `settle` (ease-out, a value arriving), `breathe` (ease-in-out, a loop) |
| z | `sheet` 10, `drawer` 30, `skip-link` 40, `popover` 50 — public as `--gg-z-*`, and the only levels structure stacks at |

Colours are semantic: `bg.*`, `text.*`, `border.*`, and `mark.*` for the
five state tones (neutral, running, ok, warn, error), which a dot, a meter, a
ring and a share bar read through `--ggarry-tone-mark`. Marks equal their
text colours today; they are separate so a mark can move to 3:1 without
moving a label. A component never reads a colour primitive. Shadows are
`sm`, `popover`, `modal` and `thumb` (a switch's or a slider's knob, which has
thickness).

Found on the way:

- **Hover drew nothing in dark mode.** `bg.subtle` and `bg.muted` were both
  slate-800, so every quiet control that rests on subtle and hovers to muted —
  the segmented control, the tab chips, a step's head, the rail, the board's
  add button, the copy buttons — had a hover that repainted the same colour.
  Dark `bg.muted` is now a new `slate-750` `#283548`, and a pair holds
  muted a lightness step off subtle.
- **The same pair was short in light mode**: slate-50 to slate-100 is ΔL
  0.016 against the 0.022 step, and light hovers were faint. Muted cannot
  simply go a step darker: a chip hovers from muted to `border.default`, and
  that pair needs its step too. Light `bg.muted` is a new `slate-150`
  `#ecf1f6`, the middle of the window both pairs leave (ΔL 0.028 and 0.027).
- **Four controls had four rules for their corners.** Button and Input kept
  6px at every size while ButtonGroup, InputGroup and NumberField stepped
  4/6/10. Every sized control now reads `radius-control-sm/md/lg` — 4, 6
  and 10 — and the field triggers (Select, Combobox, Cascader, DatePicker)
  the medium one.
- **The same status had two reds.** Progress painted an error fill with
  `bg.danger`, Meter and Ring with the danger text colour. All three read
  `mark.*` now.
- **Three group-label looks** — the menu's small medium, the nav's extra-small
  semibold, the palette's uppercase tracked — are one: the nav's.
- **Controls that resolved in 200ms**: the switch's thumb, the accordion's and
  the thinking block's chevrons. They take `duration-fast` now; the select's
  chevron also stops turning under reduced motion. The split's separator had
  no focus ring, only its hover line; it has the kit's ring.

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

**Composition is a prop bag, merged.** Field publishes `control` — canonical,
un-normalized props: the control's id, `aria-describedby`, `aria-invalid`, and
blur/input/invalid handlers — through context. Input merges it with its own using `mergeProps` from core, then
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
validated form does exactly that — and `Form`, below, does it for you.

## Textarea

Input's shape — no machine, the value in the native element, Field props merged
in — plus the two things only a textarea has:

```tsx
<Field label="Notes" hint="Grows with the text, up to 8 lines">
  <Textarea rows={2} autoResize maxRows={8} />
</Field>
```

**A resting height.** GGarry sizes a textarea from the control height of its
size — two and a half controls tall, Instrument's definition — so it keeps scale
with the inputs and buttons in its row. `rows` can make it taller, not shorter.
One rule set draws the field look: `input.css` styles
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
ways those change fire nothing on the textarea: switching the mode, a
stylesheet loading, a web font arriving after the first paint. The sandbox
showed it — type five lines, switch the theme it then had, and the old height
stayed. So one
shared watcher (attributes on `<html>`, stylesheet changes in `<head>`,
`document.fonts`) re-measures every live instance in a microtask. A change scoped
to a subtree is not watched; call `update()` after one.

## Checkbox, Switch and RadioGroup

All three are native inputs, so keyboard, form submission, label clicks and what
a screen reader announces come from the browser. None has a machine: the checked
state is the input's, owned by the adapter the way Input's value is.

```tsx
<Checkbox checked={all} onCheckedChange={setAll}>All notifications</Checkbox>
<Switch defaultChecked>Wi-Fi</Switch>
<RadioGroup label="Plan" name="plan" items={plans} defaultValue="free" />
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
without it when unchecked is not controlled. Plain DOM (`domNormalizer`) still
drops it, because there it would be the `checked` attribute — the default a
reset restores.

**Field.** Checkbox and Switch consume a Field like Input: the field's label, hint,
error timing and flags reach the native input, and readonly arrives as the
substitute above rather than as an attribute the browser ignores. A group of options is not a Field control; it goes in a Fieldset, below.

## Fieldset, CheckboxGroup, and the form's rhythm

A popover with two checkboxes above a radio group showed the checkboxes 16px apart
and the radios 8px apart, with the group label as far from the last checkbox as the
checkboxes were from each other. The radios' spacing came from the theme; nobody
owned the checkboxes' — the page's wrapper supplied a gap meant for fields. Two
option lists, two rhythms.

**CheckboxGroup** is RadioGroup's shape with a value array: `items`, a shared
`name`, `value` / `defaultValue` / `onValueChange`, orientation. The two share one
frame in core (`utils/choice-group.ts`) and one rhythm in the theme, so they cannot
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

**The rhythm is two public tokens,** in `contract.json`, so a theme must map
them and an application can lay out with them:

| Token | Between | GGarry |
|---|---|---|
| `--gg-space-option` | the options of one group; a group label or legend and what follows | 8px |
| `--gg-space-group` | groups and fields stacked in a form | 20px |

The second is always larger than the first, so a group reads as one thing.
`tests/rhythm.ggarry.browser.test.ts` measures it in Chrome, in each mode: label
to first option, option to option, legend to content and group to group, in real
pixels. Putting the old 16px checkbox gap back fails it.

The same test holds the **listbox corners**. GGarry rounds a list's rows with the
field's own corner, 6 pixels, and makes them 32 pixels tall: an option as tall as
the field that opens it, filled in the accent, reads as a second field, and a
heavy one, and the eye holds its corner against the field's, not the panel's.
(Instrument made a highlighted row concentric with its panel instead — the
panel's radius less its padding and border — which suits a lighter row.)

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
`tests/conformance/reset.spec.ts` covers it for both adapters; making
`onFormReset` a no-op fails all of it, and dropping the Svelte write-back fails
the default-checked test alone.

A controlled React owner is not told: its value is the value, and the component
renders it again over the reset.

## Tabs

Tabs follow the WAI-ARIA APG pattern: a tab list with one tab stop, where the arrows
move along it and each tab controls a panel. There are two jobs and two looks,
after Instrument:

| Variant | For | Marked by |
|---|---|---|
| `sections` | views of one screen: few, fixed, never closed | a bar under the selected tab; its weight does not change, so the tabs after it do not shift |
| `documents` | open items: any number, opened and closed as work goes on | a raised chip on a recessed track, and weight |

```tsx
<Tabs items={files} variant="documents" label="Open files" onClose={(value) => setFiles(files.filter((f) => f.value !== value))}>
  {(item) => <Editor file={item.value} />}
</Tabs>
```

- **Activation.** `automatic`, the default: the arrows select as they move. `manual`:
  the arrows move focus, and Enter or Space selects, for panels that are expensive to
  show. `orientation="vertical"` walks with ArrowUp and ArrowDown and stands the
  list beside the panel.
- **Panels.** React renders the selected panel from `children(item)` and Svelte from a
  `panel` snippet; `keepMounted` renders all of them, hidden, to keep their state.
  Without panels, the tabs are a switch for something rendered elsewhere, and
  they don't point `aria-controls` at nothing.
- **Closing is a request.** A closable tab carries a close button with an
  `aria-label`, kept out of the tab order, drawn at 20px with an invisible 24px
  target. Delete and a middle click close it too; `onClose` asks, and the owner removes the item. When the selected
  tab goes, its neighbour is selected and reported, as in an editor. Focus on the
  closing tab is aimed at that neighbour. A dot marks `modified` in place of the
  cross, until the pointer reaches it.
- A tab is a `div role="tab"`, not a button, so it can hold its close button: a
  button inside a button is invalid HTML.

A long strip of documents scrolls, with its scrollbar hidden, and the keyboard
keeps the focused tab in sight; a browser test proves it, and fails without the
scroll.

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
they would overwrite the button's own and it would lose its styling.

```tsx
<Dialog title="Delete project?" role="alertdialog" closeOnEscape={false} closeOnOutside={false}
  trigger={(props) => <Button destructive {...props}>Delete…</Button>}
  footer={<form method="dialog"><Button type="submit" value="delete">Delete</Button></form>}
  onOpenChange={(open, { reason, returnValue }) => …}>
  Everything in "Atlas" goes.
</Dialog>
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
narrow screen. As Instrument had it, it is the modal dialog in a different layout, not a
different component. The parts, focus, Escape, the backdrop and the scroll lock are
all Dialog's. `Sheet` is Dialog with `placement` set from `side` (`end` by default,
or `start`). The sides are logical, so a sheet mirrors in a right-to-left page.

```tsx
<Sheet side="end" title="Run parameters" trigger={(props) => <Button {...props}>Parameters…</Button>}>…</Sheet>
```

The theme lays it out: full height with `100dvh`, so a phone browser's toolbar
doesn't hide the footer. It sits flush with its edge, with no radius, and a border
only on the side that faces the page. On a narrow screen it is full width. The
rhythm test opens one at each edge and measures it.

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

### Toast

The result of an action whose result has no place on the screen: "the run is
queued", "could not send". A toast is called, not written: the queue is a store in
core that belongs to no framework, so `toast()` works from anywhere, including an
event handler, a fetch or a store. One region per page renders it.

```tsx
import { Toaster, toast } from '@ggary/react'   // or '@ggary/svelte'
<Toaster placement="bottom-end" />
toast({ tone: 'ok', title: 'Saved' })
const id = toast({ tone: 'running', title: 'Saving…', duration: 0 })
toast({ id, tone: 'ok', title: 'Saved' })     // the same id updates it in place
```

- **Tones** are `neutral · running · ok · warn · error`, after Instrument. Each
  tone is an icon in its colour next to text on the surface, never a fill. GGarry
  gained `--ggarry-text-success` and `--ggarry-text-warning` for it, and the
  contrast gate checks every pair.
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
    { value: 'delete', label: 'Delete', destructive: true },
  ]}
  onSelect={(value, { item, checked }) => …}
  trigger={(props) => <Button {...props}>Actions</Button>}
/>
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
radio item always asks for `true`; the page passes new items back.

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

Porting a second theme found two layer bugs, both now measured in the rhythm
test. A theme that lays the panel out with `display: flex` outranks the
browser's `display: none` for a closed popover, so every closed menu was drawn.
And auto margins in `@ggary/structure` lost to a theme's `* { margin: 0 }` in a
later layer, so shortcuts sat next to the label. The label now takes the slack
with `flex`.

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
adapters are thin. They are still real components in both adapters, not CSS
recipes: the roles, the heading levels, the icons and the live regions come from
core, and the conformance suite checks them under both.

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

Status tones are shared vocabulary in core (`utils/tone.ts`): `neutral · running ·
ok · warn · error`, and the glyph for each. Toast, Badge, Banner and Note all read
it, so a warning looks the same wherever it is said.

- **Badge.** A status in words. The dot is decoration and hidden from assistive
  technology, and the label alone must carry the meaning. `emphasis` is
  `medium` (a subtle plate) or `low` (the tone on the border alone), in
  Button's words; `count` makes it a round number over a glyph. A running
  badge's dot pulses.
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
  `onDismiss` asks and the page removes the banner.
- **Note** is an aside with a bar at its leading edge. A toned note also carries the
  tone's icon, so warn and error never differ by colour alone.
- **EmptyState** says why a space is empty and what to do next. Its title is a
  paragraph unless `headingLevel` is set: an empty list is rarely a document section.

Found on the way:

- **Muted text missed 4.5:1 on GGarry's tinted grounds.** It measured 4.36:1 on the
  running banner and 4.35:1 on the error banner. GGarry has no text tier between
  muted and default, so banner text uses the default colour and the semibold title
  carries the hierarchy.
- **A toned card inside a panel lost its tone.** The rule for nested regions had
  more specificity than the tone rule. The outer region is now matched with
  `:where`, so nesting ranks below rank, plain and tone.
- **An untoned note inside a toned card would wear the card's tone.** Tones are
  custom properties, and custom properties inherit. A banner or note without a tone
  resets them.
- **A reset that zeroes margins** after structure (Instrument's did) stops an
  auto margin from pushing a panel's actions to the end of the header. The title takes the free space
  instead. The banner's 75ch measure moved from its body to its lines, so the body
  still fills the row and the actions sit at its end.

## The agent layer: Run, Queue, History, Budget, Step, Log, Diff, Lanes, Turn, Composer, Thinking, Approval and Failure

Thirteen components for one job: showing a person the work of a machine that
is going on now. They differ in the UNIT of work, not the look — a phase, a
task, a tool call, a line, an edit, a worker, an attempt, a decision.

```tsx
<Run units={shards} label="Shards" />                    // 4 of 7 done, 1 with a remark
<Queue tasks={tasks} bind:value={chosen} />              // hundreds of flat rows, one tab stop
<History ticks={attempts} label="The last 20 nights" />
<Budget value={184200} max={250000} rate={tokensPerHour} label="Tokens" />

<Step name="edit_file" argument="src/grid/filters.ts" state="ok" duration={412}>
  <Diff path="src/grid/filters.ts" before={was} after={now} />
</Step>
<Log lines={lines} label="The run" />
<Lanes lanes={shards} label="Six shards on one axis" />

<Turn who="Claude" time="14:32" tokens={1284} duration={4.1} streaming>…</Turn>
<Thinking duration={6}>…</Thinking>
<Approval what="rm -rf ./build" effects={[{ text: 'Deletes 2,318 files', tone: 'warn' }]} onDecide={decide} />
<Failure title="Could not read the file" code="ENOENT" reason="…" tried={['retried twice']} onRetry={retry} />
<Composer label="Ask" busy={running} onSend={send} onStop={stop} />
```

Each was weighed against what the kit already had, and composed rather than
copied where the answer was yes:

- **Budget** is the **Meter** with a forecast. Everything else it draws —
  the label, "184,200 of 250,000", the bar — is the Meter's, so it renders
  one. What it adds is the exhaustion a rate implies, which the Meter cannot
  have from one value and one ceiling. Without a `rate` it says so plainly:
  a budget with no forecast is a meter with a longer name.
- **Step** and **Thinking** take a disclosure's *shape* — a button owning a
  region — without the **Accordion**'s promises. Accordion is a group: one
  machine over a list, a single-open policy, a heading level per item and
  arrows roving between siblings. A transcript has none of those: steps
  arrive one at a time and each opens alone. Step is a native
  `<details>`, so find-in-page opens it for free.
- **Lanes** is not a small **Gantt**. The Gantt is a treegrid with a name
  column, days as its atom, dependency arrows, groups that close and a
  machine holding drafts. Lanes has no column, no dependencies and nothing
  editable: what is left is arithmetic over one window, handed to CSS as two
  custom properties.
- **Queue** is a `listbox`, not a grid. A grid compares records field by
  field; a queue exists so one of hundreds can be **chosen**. One tab stop,
  arrows, and a polite live region saying which phase just turned over.
- **Failure** is not a **Banner** with a retry. What does the work is the
  list of what was already tried, the machine code as a plate a person can
  search a log for, and the fact that it stays afterwards as a record — a
  banner that has served its purpose is dismissed.
- **Run**'s unit *is* the **StatusDot**: core calls the dot's own connect, so
  the pulse, the tones and the forced-colours rules come from one place.
  **Turn** asks for the **Caret** rather than drawing one; **Composer**
  arranges the **Textarea**, **Button** and **Toolbar** and owns only the
  frame and the sending rules.

The vocabulary is the kit's one set of tones. A component with a phase of
its own — queued, skipped, cancelled — carries `data-state`, but its colour
comes through a tone, so a queue row, a badge and a dot never disagree on
one screen.

Found on the way:

- **Three branches writing one file cut it at the seams.** Batch C's
  worktrees each created `packages/structure/src/agent.css`, `agent.spec.ts`
  and a browser suite of the same name; joining them by hand left rules and
  test blocks unclosed, and every browser test failed to load rather than
  failing. They are rebuilt from each branch's own version — a file two
  authors wrote at once is merged whole, not stitched.
- **A machine outruns speech.** The Log's live region is off by default,
  against `role="log"`'s implied polite: a hundred lines a second is not
  something to read aloud, and the run's own status does the announcing.
- **A muted line number on a deleted line measured 4.35:1.** The gate caught
  it; a changed line's numbers take the full ink.

## Charts: Sparkline, Legend, Meter, Ring, Share and Heatmap

Six readings of numbers, ported from Instrument and drawn in GGarry's own
palette. Core computes every geometry — the path, the percentages, the arc's
dash, the grid — and the theme owns the colours and the sizes.

```tsx
<Metric label="Run time" value={42} unit="s" delta="18% faster" direction="down" tone="ok" />
<Sparkline values={nights} area describe={false} />          // the number beside it already says it

<Sparkline values={unit} series={1} label="Unit tests" />
<Sparkline values={browser} series={2} label="Browser tests" />
<Legend items={[{ label: 'Unit tests', series: 1, value: '18.2 s' }, { label: 'Browser tests', series: 2, value: '11.5 s' }]} />

<Meter label="Disk on the runner" value={237} max={240} unit="GB" tone="warn" />
<Ring value={74} label="Of the window used" size="lg" />
<Share items={[{ label: 'up', value: 22.1, tone: 'ok' }, { label: 'down', value: 0.4, tone: 'error' }]} unit="h" />
<Heatmap days={year} unit="runs" />
```

**The palette.** Six series colours, `--gg-chart-1..6`, public so an
application can key a measure to a number once. They are GGarry's own hues,
chosen against the theme's: every one stands 25° or more from red (27),
amber (58), green (149) and the accent (260), so a series never reads as
"it failed" or "done", and they climb a ladder of lightness (0.52 to 0.66)
so they survive colour blindness and a black-and-white print. Each holds
3:1 on the surface and on the canvas in both modes, measured by the gate.
A series is a **category**, never a state: a status tone may not colour one,
a series colour may not be used for text, and `--gg-series` lets an
application override one. A chart of one series takes the accent, because
there is nothing to tell apart; at two or more a Legend is obligatory.

- **Sparkline** is the shape of a change beside a number: no axes, no grid,
  no labels. Core turns the values into the line, the optional area and the
  last point over a fixed 120×32 box; the theme sizes it at that proportion,
  so the last value's dot stays a circle rather than stretching into an
  ellipse. A flat series still draws a line; one value draws nothing and says
  so with `data-empty`. `describe` names the picture in words by default and
  is turned off where the number already stands beside it.
- **Legend** is the key: a swatch, the name in words and an optional value,
  as a list. The swatch is 8px and square — the state dot is 6px and round,
  so the two marks never read as each other — and hidden from a screen
  reader, which hears the name.
- **Meter** is one quantity against its own ceiling, so it takes one tone and
  never a series. `role="meter"` with the reading in `aria-valuetext`; the
  figure stands in words above the bar, because a length and a colour are not
  a number. Past the ceiling the fill stops square at the end of the track and
  the words keep the figure that was given. The native `<meter>` is not used:
  its bar is drawn by the platform and cannot be held to 3:1.
- **Ring** is the same reading where a bar has no room — beside a card's text.
  An SVG arc whose dash core computes, at three sizes; the figure sits inside
  only at the largest, where the type scale still fits. `decorative` hides it
  when the count already stands next to it in words.
- **Share** is what a period was made of: one bar divided by each part's share
  of the whole. Core rounds by largest remainder so the parts total exactly
  100 and the bar is always full, and a part with a value of its own never
  falls to nothing — it takes its point from the largest. Outcomes take tones,
  categories take series; more than two parts want a Legend.
- **Heatmap** is how much happened per day across a year. Its axis is
  intensity, not category, so it takes four steps of one hue rather than the
  palette, cut by rank over the days that have something on them — one
  release day cannot flatten a year. A column is a week, seven rows are the
  days, the blanks at either end keep the weeks true, and a month is labelled
  only where it owns two columns. It scrolls rather than wraps: a wrapped
  year is two pictures. The grid is one named picture and its cells are
  hidden — a screen reader cannot usefully walk 365 of them.

Found on the way:

- **A word boundary written through a heredoc is a backspace.** `\b` inside a
  Python string is 0x08, and two of this repo's own contract regexes ended up
  holding that byte instead — the rule "no `<svg>` in an adapter" was checking
  nothing but `createElementNS` for an hour. Both are word boundaries again,
  and the rule fails on a planted `<svg>`.
- **A chart's barrel draws nothing.** `index.ts` re-exports, so it answers to
  the ordinary rule rather than to the charts' exception.
- **A stretched viewBox turns a dot into an ellipse.** `preserveAspectRatio:
  none` scales the last value's circle with the box; the sparkline keeps its
  own proportion, and a width an application sets still draws an undistorted
  line through `vector-effect: non-scaling-stroke`.
- **A scaled fill stretches its own rounded end.** The meter sizes its fill
  rather than scaling it, unlike Progress.

## Readouts: Metric, KeyValueList, FileChange, Timeline, StatusDot and Caret

Ported from Instrument's display set, drawn in GGarry's own terms. None has a
machine; each is a `connect()` in core.

```tsx
<MetricRow joined headline>
  <Metric label="Success rate" value="94.2" unit="%" delta="1.8 points down in a week" direction="down" tone="warn" />
  <Metric label="In the queue" value={37} />
</MetricRow>
<KeyValueList items={[{ label: 'Runner', value: 'eu-west-3' }, { label: 'Commit', value: <Copyable value={sha} /> }]} />
<FileChange change="deleted" /> src/legacy/csv.ts
<Timeline label="The nightly run" locale="en-GB" items={events} />
<StatusDot tone="running" /> Agents at work
<p>Streaming the answer<Caret /></p>
```

- **Metric** is one watched number: a label, the value, a unit set smaller and
  quieter, and the change in words. **Which way it moved** (`direction`, an
  arrow) and **whether that is good** (`tone`, the colour) are separate props —
  time going down is good, warnings going up are bad, and one attribute for both
  is a mistake waiting to be made. The words carry the sign; the arrow is hidden
  from a screen reader. Numbers are formatted in the locale and set tabular. A
  value is 22px in a tile and 28px in the headline band — sizes of their own,
  above the text scale: a figure is not a heading, and at 16px the numbers read
  timid beside their labels. The unit is a little over half the value's size.
  **MetricRow** is separate tiles on the subtle ground, never bordered cards, or
  `joined`, one ground divided by hairlines: "one fact about this screen" rather
  than "a set of numbers". `headline` is the band under a page header, one per
  screen.
- **KeyValueList** is a real `<dl>`: the name and its value are tied by the
  markup, not by two columns that happen to line up. The name column is one
  width across lists (`--ggarry-size-label-col`, 120px), so lists line up with
  each other; `tight` sizes it to its longest name for a narrow card. Svelte
  takes string values and a `value` snippet for rich ones.
- **FileChange** is what happened to a file: `added · modified · deleted ·
  renamed · conflict`, a closed set. A sign (`+ M − R !`) in an outline — the
  outline is a mark at 3:1, the sign is text at 4.5:1 — and the word, visually
  hidden, for a screen reader. Colours follow GGarry: added green, modified
  accent, deleted red, renamed muted, conflict warning.
- **Timeline** is an ordered list — the order means something — with a real
  `<time datetime>` at each event's end, formatted in the locale. The dots are
  joined by a line drawn from centre to centre, decorative and not spoken. Each
  dot takes its event's tone; a running one pulses. The dot is hidden, so an
  event's title must say its tone in words: "Run failed", not "Run".
- **StatusDot** is the 6px mark of a state, always beside a word. It reads its
  colour from the nearest tone — its own, or an ancestor's — so a dot in a
  badge, a timeline row and on its own agree. Badge's dot now reads the same
  channel. A running dot pulses and, under reduced motion, slows to 3s rather
  than stopping.
- **Caret** is the cursor of text still arriving: 0.45em by 1.05em, flush
  against the last character, blinking in steps. Reduced motion stops the blink
  and keeps it shown; print leaves it out.

Found on the way:

- **An `aria-label` on a plain `<span>` names nothing.** ARIA forbids it, and
  some screen readers say nothing. FileChange shows its sign hidden and its word
  visually hidden instead: it reads the same, and it is allowed.
- **The theme's reset gave every root part the base font size,** which broke the
  caret's em sizing; it inherits its line's size now. A browser test measures it
  at 14px and 28px.
- **Muted text on the muted ground is 4.34:1** in light mode, so a metric stands
  on the subtle ground.

## CodeBlock, Copyable and Inserts

```tsx
<CodeBlock label="the terrain generator" code={source} numbered start={12} />
<Copyable value="a4f7c2e" copyValue="a4f7c2e91b0d5537" />
<Field label="Notification template">
  <Textarea rows={3} />
  <Inserts items={[{ value: '{{name}}' }, { value: '{{time}}', hint: 'The time of the event' }]} />
</Field>
```

- **CodeBlock** never wraps — a wrap can change a command's meaning — so it
  scrolls sideways, with `scrollbar-gutter: stable` so a bar appearing does not
  shift the code. The scrolling part is a named region with a tab stop, so the
  keyboard can reach it; the frame around it holds the copy button, so the
  button stays in its corner while the code scrolls. `numbered` adds a 5ch
  column of line numbers, hidden from a screen reader and left out of a copy.
- **Copyable** is one line — a hash, an id, a path — with an in-flow button,
  always shown (touch has no hover), its name carrying the value: "Copy
  a4f7c2e", so a column of them is not ten identical "Copy" buttons. Its 24px
  target is an invisible area on the button, not the glyph.
- **Copying** (`utils/copy.ts`) writes to the clipboard and falls back to a
  hidden field and `execCommand('copy')` when the API is missing or refuses.
  The button shows a tick for 1.5s and a polite live region inside the
  component says "Copied" — or "Could not copy". `onCopy` returning `false`
  means "I copy it myself". `copyValue` copies the full value behind an
  abbreviation.
- **Inserts** are real buttons for a field — the variables of a template. A
  press puts the value where the caret is, replacing a selection, leaves the
  caret after it and hands the focus back to the field, then fires a native
  `input` so a controlled React or Svelte field keeps its state. Without a
  `target`, inserts take the text field of the Field they stand in; `target`
  names another by id or getter. `onInsert` returning `false` cancels.

Found on the way:

- **A Field gives its control an id of its own,** so an insert aimed at the
  textarea's id found nothing inside a Field. Inserts now default to the
  Field's own text field, as Instrument's did.
- **A copy button inside the scroller scrolled away** with the code. The frame
  and the scroller are two parts.
- **No hover highlight on numbered lines:** muted numbers on the hover fill
  measured 4.34:1.

## SegmentedControl, Slider and NumberField

Three controls where the platform already has the behaviour, so the kit's job is
to stop reimplementing it.

```tsx
<SegmentedControl label="View mode" items={views} value={view} onValueChange={setView} />
<Slider label="Parallel agents" min={0} max={16} value={agents} onValueChange={setAgents} showValue
        formatValue={(n) => `${n} agents`} />
<NumberField axis="X" label="Position X" value={x} onValueChange={setX} />
```

- **SegmentedControl is native radios.** One value among equals is a radio group,
  so that is what it is: radios sharing a name are one tab stop, the arrow keys
  move and choose, and the value submits with the form — no roving tabindex, no
  key handling, nothing in core but the attribute contract. Instrument built the
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
carry no `aria-label` of their own.

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
  would ring half the control — so the field inside hands its box outwards.
- **FileDrop** is a `<label>` around a real `input[type=file]`, so a press
  anywhere opens the system dialog and Tab reaches the zone. The input is taken
  away by a clip, never by `display: none`, which would drop it out of the tab
  order. Instrument's zone had no script and could not answer a drag; `utils/file-drop`
  adds one: a depth-counted drag state, and a drop that writes the files into the
  input through a DataTransfer, then sends the same `input` and `change` the
  dialog would — so a form submits them as if they had been chosen by hand.
- **ButtonGroup** is several actions standing flush, which is the whole difference
  from a SegmentedControl: no chosen one, and no roving tabindex — Tab goes through
  every button, because each does its own thing. It takes a role only when it is
  named. The corners follow the size the group is told its buttons are, said out
  loud rather than read from the children with `:has()`.

Found on the way:

- **A rule in `gg.structure` cannot undo a theme's field look.** The group's input
  kept its own border until the "hand the box outwards" rules moved into the
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
  Groups are told apart by where they stand, not by how loud their names are:
  a hairline and air above each, the name semibold and close to its own
  items, and never in capitals — a label has no right to sound louder than
  what it labels. (The sandbox adds each category's number in the accent, as
  its heading on the page has.)
  An item may have `items` of its own, one level down — a component's
  variants, a settings page's panes. It stands in a branch beside a real
  button (`aria-expanded`, named "Button, sections") that opens them, and the
  sections are a group named by the item's link. They are open while the
  item or one of its sections is current, and closed otherwise, unless the
  reader set them; `open` and `onOpenChange` hand that to the owner. Only the
  section itself is current; the item holding it is marked in the default ink
  without the bar, and the sections step in on a guide line the current one's
  bar sits on. Deeper levels are not drawn: a column that nests further is a
  Tree. A label that wraps keeps its icon and count on its first line, and the
  row grows by its lines with the same air above and below.
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
  last used. Instrument left the role out entirely and said the behaviour
  belonged to the application; here the behaviour comes with the name. A field
  inside the strip keeps its own arrows, because there they move the caret.

`Panel` gained a `toolbar` slot for it: the strip stands between the header and
the body and brings the line below itself, so the header gives up its own.

Found on the way:

- **A gap that hides one page.** `paginationRange` drew an ellipsis wherever two
  shown pages were not adjacent, which at page 3 of 5 replaced page 4 with "…".
  The unit test was written for that rule and failed on the first run.
- **`data-icon` on a link hides the link.** A masked element clips everything
  inside it, glyph and text alike, so the mask belongs on the icon's own span,
  never on the link. The sandbox showed a column of icons with no words.
- **An auto margin cannot live in the structure layer.** A theme's reset that
  zeroes margins stands above it — Instrument's did — so the toolbar's spacer
  pushed nothing. The margin moved into the theme, and a browser test now
  measures the tail against the strip's own inset.

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

**The detail sheet shows one row and walks to the next.** A row's **Open**
button — at the end of its first cell, shown while the row is pointed at or
has the keyboard, always on a screen with no hover — Shift+Enter on any cell,
Enter or a double click on a cell that is not editable, or
`grid.activate(index)` opens it beside the grid (and calls `onRowActivate`); ↑ and ↓ step through the rows without closing, "6 of 104,802" says
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
  is after an adapter had already drawn the new state. The
  click is no longer cancelled; the box is set to what the grid decided.
- **The grid's boxes were the browser's.** A row's and the header's
  checkboxes were native inputs tinted with `accent-color`: another shape,
  another mark, and a white box in the dark. They are drawn as the Checkbox
  draws its own now — a control, the input, a mark over it (a dash while some
  rows but not all are chosen) — in the grid's own parts, and GGarry's
  checkbox rules take them in.
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
- **A test typed into a hidden input.** Select carries a hidden input for its
  form value, and "the first input in the editor" found it. The tests now skip
  hidden inputs.
- **A non-modal sheet sat at the bottom of the page.** A dialog opened with
  show() is not in the top layer, and the browser places it absolutely, where
  it is in the page; the sheet layout had only ever met showModal(). A sheet is
  now fixed to the viewport's edge either way.
- **"Saving" in muted text failed contrast on a selected row** (4.36:1). A saving
  value is underlined, dotted, instead, and keeps its colour.
- **`controllerRef` could crash React.** The effect returned whatever the
  callback returned, and React calls a returned value as the cleanup: a
  callback written `(c) => (grid = c)` threw "destroy is not a function". The
  effect now returns nothing.
- **Enter means "edit" on an editable cell.** It used to open the row
  everywhere. Open a row with its Open button, Shift+Enter, from a cell that
  is not editable, or from the row menu.
- **A grid whose cells all edit had no way to open a row but its checkbox.**
  A double click edits an editable cell, so in the sandbox, where nearly every
  column edits, the only cell left to double-click was the selection box. The
  Open button and Shift+Enter open a row from anywhere.
- **The grid's checkbox took no press.** Drawn as the Checkbox's, it took the
  Checkbox's invisible 24-pixel target too — which works there because a label
  hands the press to the input. The grid has no label, so the target took the
  press itself. The grid's box has no such target; a test presses it with a
  real pointer, and fails with the target put back.

## Shell, Split, Rail and StatusBar

The frame of an application, the part Instrument called the tier that was missing:
the kit could draw anything inside a panel and could not place the panels.

```tsx
<Shell
  brand={<a href="/">Leads</a>}
  aside={<Nav label="Sections" groups={groups} />}
  header={<Breadcrumbs items={crumbs} />}
  footer={
    <StatusBar label="Registry status">
      <StatusBarItem>main</StatusBarItem>
      <StatusBarItem tone="error">3 failed saves</StatusBarItem>
      <StatusBarSpacer />
      <Button size="sm" emphasis="minimal">Sync</Button>
    </StatusBar>
  }
>
  <Split label="Resize the lead list" collapsible defaultSize={320} min={200} max={560}>
    <LeadList />
    <Lead />
  </Split>
</Shell>
```

**Shell** is a side column, a header, the work area and a status strip, each
scrolling on its own: the navigation does not move while a table is read. The
work area is the page's `main`, and a skip link — the first thing a keyboard
meets — moves the focus there. It has the kit's one breakpoint, 60rem; under it
the column becomes one of two things, and which one depends on how long the
navigation is:

- **a drawer** (the default) behind a button in the header, for a navigation of
  groups and many items. It behaves as the modal it looks like: the rest of the
  frame is inert, so Tab cannot walk out under the scrim; Escape or a press
  outside closes it and gives the focus back to the button; following a link
  closes it. A window that grows past the breakpoint with the drawer open closes
  it, so it is not found open the next time the window narrows.
- **a bar** (`collapse="bar"`) under the header, for a short navigation: it needs
  no script and cannot fail to open.

The breakpoint is written twice, in core's `SHELL_NARROW` and in the structure
layer's `@media`, because a media query cannot read a custom property; a test
holds the two to the same number.

**Split** is two panes and the line between them — the window splitter of the
ARIA practices. The separator is a focusable `separator` whose value is the
primary pane's size in pixels, between its minimum and maximum. Arrows move it
(Shift, four steps), Home and End go to the bounds, Enter folds a `collapsible`
pane away and back, a double click puts it where it started, and a pointer drags
it with the line staying under the pointer. A drag well past half the minimum
folds a collapsible pane rather than stopping at a minimum the person is plainly
trying to get past. The other pane never falls under `restMin`, however far the
line is pulled, and when the frame narrows the sized pane gives way first. The
size is `--gg-split-size` on the frame; `onSizeChange` reports every change, for
a page that keeps the layout.

**Rail** is the sections as a narrow column. Instrument named each glyph for a
screen reader only; here the name stands under the glyph in small type, so
nobody has to learn twelve pictures. The current item has a fill and a mark at
its edge, and items marked `end` stand at the bottom.

**StatusBar** is one line of readings — a branch, a count of errors, an
encoding — not a toolbar: a toolbar holds controls and is as tall as they are,
and this strip has to stay one line or it eats the screen of the tool it serves.
A reading that can be pressed is a small low Button; one that is only read is an
item, with a tone when it is news. When the strip is too narrow it pans sideways
rather than cutting off its end, which is often the one control on it.

Found on the way:

- **A page's own style replaced core's.** A `style` prop on DataGrid replaced
  the grid's own custom property; React's and Svelte's DataGrid now merge them.
- **`onDoubleClick` never fired outside React.** The Svelte and DOM normalizers
  lower-cased handler names into events, and `doubleclick` is not one — it is
  `dblclick`. Such names now go through a table.
- **The drawer refused the focus it was given.** Its `visibility` transition
  started at `hidden`, and a hidden element cannot take the focus, so the first
  frame of every opening lost it. Opening is now visible at once, closing hides
  after the slide, and the drawer asks again on the next frame should a theme
  fade it in.
- **A button in the status strip filled it edge to edge.** A small button is as
  tall as the strip, so the strip grew to it and left no air. Inside the strip a
  button now takes the strip's own measure: small type, a box one line tall.
- **The conformance harness declared the same interfaces five times over.**
  Earlier patch scripts had pasted blocks that were already there; TypeScript
  merges identical interface declarations, so nothing complained. Thirty-two
  duplicates are gone.

## DatePicker and Calendar

A field for a day, or a range of days, and the month behind it.

```tsx
<DatePicker label="Follow up on" min={todayISO()} name="follow" />
<DatePicker label="Registered between" mode="range" onValueChange={({ start, end }) => filter(start, end)} />
<Calendar isDateDisabled={isWeekend} onValueChange={({ start }) => book(start)} />
```

**Days, not instants.** A value is `YYYY-MM-DD`: a day on a wall calendar, the
same 18 September in Moscow and in Vladivostok. The arithmetic is done in UTC,
where no day is 23 or 25 hours long, so a clock change never moves one; 31
January plus a month is the last day of February, not 3 March. A range submits
as one ISO 8601 interval, `2026-09-01/2026-09-18`.

**The field is the quick way.** Type a day the way the locale writes it —
`18.09.2026`, `9/18/2026`, `18 Sep 2026`, `18 сентября 2026`, or ISO — and press
Enter or move on; the order of day, month and year is read from the locale, a
month may be a word in the locale's language (its genitive too), and a
two-digit year is this century's. The field then shows the day in the locale's
own words. Text that is not a day — or is one the picker refuses — marks the
field invalid and says how to write one, with an example in the locale's order.

**The calendar is the browsing way**: the date grid of the ARIA practices, in a
non-modal dialog under the field. One tab stop, on the chosen day or today.
Arrows move a day or a week and carry the focus into the next month, Home and End
go to the ends of the week, PageUp and PageDown a month (Shift, a year), Enter
chooses and brings the focus back to the field; Escape and a press outside close
without choosing. The week starts where the locale's does, from `Intl.Locale`'s
week info or, where the platform lacks it, a list of the regions that start on
Sunday or Saturday. Each day is named in full for a screen reader — "Friday, 18
September 2026" — today is `aria-current="date"`, and a day outside `min` and
`max` or refused by `isDateDisabled` is `aria-disabled`, faded and struck through,
and still reachable, so the arrows do not skip it without a word.

**A range** is two presses in either order. Between them, the range a second
press would make is drawn under the pointer — a band of tint with a disc at each
end — and a range typed backwards is turned round.

Found on the way:

- **The focus fell out of the calendar at the end of the month.** Arrowing past
  the last day turned the page, the focused day went with the old month, and the
  focus dropped to the page — where the rule "only refocus a grid that has the
  focus" then refused to put it back. A key the grid acts on now marks it, and
  the focus follows the day onto the new page; a Tab out, which the grid does not
  act on, marks nothing, so turning the page with the buttons leaves the focus
  on the button.
- **A range drew half-discs.** The band and the disc were painted on one box, and
  a round clip cut the band while the band's gradient cut the disc. The cell now
  carries the band and a layer behind the number carries everything round: the
  disc, today's ring, the focus ring.
- **The discs kissed.** Each filled its 36-pixel cell to within a pixel, so a
  chosen day beside today read as one lump, fill against ring. The disc is now 6
  pixels short of the cell, drawn at a fixed size in its middle — round even if
  a table stretches the cell — and a range's band is the disc's height, so its
  ends sit in it flush.
- **`isISODate` narrowed a string to nothing.** A type guard `text is ISODate`,
  where `ISODate` is `string`, made TypeScript read the text after it as `never`.

**Presets** stand beside the month, with `presets`: a column of buttons, after
the calendar in the reading order, each a range — or a function of today
returning one. `rangePresets()` gives the ones a report asks for: today,
yesterday, the last 7 and 30 days (today included), this month so far, and
the whole of last month, with `words` for another language. One press
chooses and closes; the preset the value stands on is `aria-pressed`, and
one that would reach outside `min` and `max` or onto a disabled day is
disabled.

**The grid's date filter is this picker now.** A date column's chip opens two
of them, From and To, each bounding the other: To cannot go before From. They
take the grid's locale, so a filter is typed and read the way the rest of the
page writes a day. The chip still reads "Sep 1, 2026 – Sep 5, 2026", and the
query still carries two ISO days.

## Cascader

A choice from a tree, one level to a column: country, region, city; a team
inside a department.

```tsx
<Cascader label="City" items={regions} defaultValue={['ru', 'tat', 'kzn']} name="city" />
<Cascader label="Team" items={teams} selectParents onValueChange={(path) => assign(path.at(-1))} />
```

**The value is the path**, root first — `['ru', 'tat', 'kzn']` — because a leaf's
value is only unique under its parent. The button reads the whole path, the
levels above the last muted, and a form gets the leaf. Leaves only, unless
`selectParents` lets a branch be the answer.

**A button and a dialog of listboxes.** The button is `aria-haspopup="dialog"`
and is named by the label and the path together, so a screen reader hears
"City, Russia Tatarstan Kazan, button". The dialog holds one listbox per level,
the first named by `rootLabel` (or the label), each other by its parent. It
opens on the chosen item, or the first. Up and Down walk a column, Home and End
go to its ends, Right goes into the children and Left back out (swapped in
right-to-left), Enter or Space chooses — on a branch, it opens it — and typing
jumps to a label. A press on a branch opens it; on a leaf, it chooses. Escape and
a press outside close without choosing, and the focus goes back to the button.
A disabled item is passed over and cannot be chosen.

**A branch's chevron is a press target of its own**: it opens the branch's
column without choosing it. That matters with `selectParents`, where a press
on the branch chooses it: a pointer can hover to open a branch, a finger
cannot, and the chevron — drawn at 12 pixels, pressed at 28 — is the way to
a chosen-able branch's children on a touch screen.

**The focus moves, not a highlight.** Each column is its own listbox, and
`aria-activedescendant` cannot point across them, so the item itself takes the
focus, and the one tab stop inside the dialog is the item the keyboard is on.

Found on the way:

- **The third column fell off a phone.** Three columns of 180 px are wider than a
  414 px screen. The card already scrolled sideways, but the focus moved with
  `preventScroll`, so the column the keyboard went into stayed out of view. The
  focus now brings the item into its column and the column into the card,
  without ever scrolling the page.
- **Svelte read the path with spaces in it.** Markup across lines left
  whitespace between the levels, so the button's name was " Russia Tatarstan
  Kazan" in Svelte and "RussiaTatarstanKazan" in React. The value's markup is
  one line.
- **A ring over the fill.** The theme's global focus ring drew over the accent
  fill of the focused item, and the card's scroll clipped it at the edge. The
  fill marks the focus; in forced colours, an inset ring does.

## Combobox

A text field with a list under it: type to narrow the list, choose with the
arrows and Enter or a press. For the choices a Select is too long for — a
manager out of forty, a company out of 700,000.

```tsx
<Combobox label="Manager" items={managers} onValueChange={([id]) => assign(id)} />
<Combobox label="Tags" items={tags} multiple defaultValue={['renewal']} name="tags" />
<Combobox label="Company" load={(query, signal) => api.companies(query, signal)} />
```

**The field keeps the focus.** It is the editable combobox of the ARIA
practices, with list autocomplete: `aria-activedescendant` names the
highlighted option, and a press on the list is cancelled so the field never
loses the focus to it. Home and End stay the field's, for the caret. Escape
closes an open list and, on a closed one, empties the field; leaving without
choosing puts the field back to the chosen value's label, because an unfinished
search is not a value. A live status says how many matched, that it is
searching, or that the search failed.

**A list in the page is filtered as you type,** case, accents and "ё" not
counting, and ranked: a label that starts with the query first, then one with a
word that does, then one that contains it — its description included. Only
`limit` options (50) are drawn; the rest are reached by typing more, and the
list says how many there are, so a list of thousands costs a list of fifty.

**A server list** is `load(query, signal)`. It is asked when the list is open and
the typing pauses (`debounce`, 200 ms); a new question aborts the one in flight,
and an answer to a question no longer asked is dropped, not drawn. While it
waits, the last answer stays on screen, dimmed. A failure says why and is asked
again when the list opens next — not on a timer. A chosen value keeps its label
when the next answer no longer holds it.

**An option can be created** with `onCreate`: typed text that matches no
option's label exactly — case and accents not counting — is offered as
"Create “…”" at the end of the list, in the accent's ink, highlighted when it
is all there is, so Enter creates. The owner makes the option (a promise of
it, if a server must) and it is chosen; with several values it joins the
chips and the field empties for the next. While it waits the option says
"Creating “…”" and the field is busy; a refusal chooses nothing and the live
status reads out why. Nothing returned makes the text its own value.

**Several values** (`multiple`) stand as chips in the field. The list stays open
between picks, choosing a chosen one takes it back, each chip's remove button is
named and is not a tab stop — the field is the one stop — and Backspace in an
empty field removes the last. With a `name`, each value submits as its own field.

Found on the way:

- **The field drew a ring inside the box's ring.** The box shows the focus for
  the input inside it, and the theme's own focus rule, in a later layer than the
  structure's, gave the bare input a second one.
- **`spellCheck` reached Svelte as a camel-cased attribute.** It joins the
  normalizers' table of DOM names beside `autoComplete` and `inputMode`.

## Accordion, Tree and Progress

```tsx
<Accordion items={sections} defaultValue={['contact']}>{(item) => body[item.value]}</Accordion>
<Tree items={boards} label="Boards" defaultExpanded={['sales']} onValueChange={([board]) => open(board)} />
<Progress label="Importing leads" value={done} max={120} valueText={(n) => `${n} of 120`} />
```

**The accordion** is the APG's: each section's button stands in a heading
(`headingLevel`, default 3), says whether it is open, and controls its section.
One section at a time; `multiple` lets several stand open, `collapsible: false`
keeps one always open — and then its button says `aria-disabled`, as the APG
asks, rather than doing nothing silently. Up and Down move between the buttons,
passing over a disabled one; every button is still a tab stop. A section is a
`region` named by its button, unless there are more than six: a page of
landmarks is as hard to move through as none. A description under a label is
the button's description (`aria-describedby`), not part of its name.

**A closed section can still be found.** Where the browser supports it, a closed
section is `hidden="until-found"`: find-in-page searches it, and a match opens
it (`beforematch`). So the content of a closed section is kept in the page by
default (`keepMounted`), and the section's own box carries no padding — a
section hidden until found is laid out, only not painted, and a padding would
stand open under a closed button. The body inside it carries the room.

**The tree** is drawn flat: one row per visible node, and `aria-level`,
`aria-posinset` and `aria-setsize` say where each stands, so a framework renders
a list and a long tree could one day be windowed like the grid's rows. The
indent is one number the core sets on each row, `--gg-tree-level`, and the theme
multiplies it. The keys are the APG's: Up and Down walk the visible rows, Right
opens a branch and then steps onto its first child, Left steps up and then
closes, Home and End, `*` opens every sibling, typing jumps to a name. One tab
stop. A press anywhere on a branch's row opens or closes it, as a file tree's
does, and chooses it; Enter does the same. The chevron is a target of its own
that only opens and closes, so a branch can be opened without being chosen —
on a touch screen too, as the cascader's chevron does. In a multiple tree a
press on a row only adds or takes it back: opening the branch on each press
would fight the choice, so there the chevron opens it.
`selectionMode` is `single`, `multiple` (each row then says whether it is
chosen, and the tree that it takes several) or `none`, a tree to walk and open.
Closing a branch with the focus inside it brings the focus up to the branch,
rather than dropping it on the page.

**Progress** is a `progressbar` with its range, value and a spoken text — a
percentage in the locale's form by default, or your own words ("35 of 120").
With no value it is indeterminate and says no amount: a bar sends a piece of
its fill across, a ring turns. The drawn amount is one number, `--gg-progress`
from 0 to 1, on the track: the bar's fill scales by it from the start edge (the
right one, right to left), the ring's is a conic sweep of it cut to a band by a
mask, so the value in the middle is untouched. `tone` says how a job ended —
`ok`, `warn`, `error` — beside the running accent. `hideLabel` names it without
drawing the name, for a ring in a button or a bar in a table row.

Found on the way:

- **React cannot say `until-found`.** React 19.3 writes a `hidden` of any value
  as the bare attribute. The core gives `hidden`, and a small helper,
  `findableContent`, raises it to `until-found` after each render and listens
  for the match — in both frameworks, for the same behaviour.
- **The accordion's button read "ShippingWhere and how fast".** Named by its
  content, the label and the description ran together without a space in
  React; Svelte's whitespace happened to part them. The label now names the
  button and the description describes it, in both.
- **A branch opened only from its chevron.** The first tree chose a branch on a
  press and opened it only from the chevron or a double press — a small target
  for the common case. A press on the row now opens it, as in a file tree; the
  double press is gone, since each of its presses already toggles.
- **The progress track vanished on white.** The first fill of the room, the
  subtle background, was all but invisible in light mode, so a bar at 42% did
  not say how far there was to go. It is the default border now, the same
  weight as the accordion's hairlines.

## Kanban

Columns of cards, and a card moved from one to another — by the keyboard,
dragged by a pointer, or sent from its menu — and a card added at a column's
foot.

```tsx
<Kanban
  columns={stages}
  cards={deals}
  onMove={async (move) => {
    await api.moveDeal(move.card.id, move.to)   // a rejection puts the card back
    setDeals((current) => applyMove(current, move))
  }}
  onOpen={(deal) => openSheet(deal)}
  onAdd={async (column, title) => {
    const deal = await api.createDeal(column, title)
    setDeals((current) => [...current, deal])
  }}
  cardMenu={(deal) => [{ value: 'archive', label: 'Archive', destructive: true }]}
  onCardMenuSelect={(value, deal) => archive(deal)}
>
  {(deal) => <DealMeta deal={deal} />}
</Kanban>
```

**One tab stop, on a card.** There is no APG pattern for a board; this is what
the accessible ones agree on. The arrows walk the cards — up and down a
column, across to the nearest card of the next column that has any. **Space
picks the focused card up**, and then the arrows carry it: up and down, across
into the next column (an empty one too), Home and End to the ends of its
column. Space or Enter drops it; Escape puts it back where it was, and so
does Tab, the focus going on. Enter on a card that is not held opens it, as a
press does — unless the press is on a control inside the card. A card is a
`listitem` in its column's `list`, named by its title, with `aria-roledescription`
"card", and described by what it shows and by the instructions. At each step
a live region says where the held card is: "Picked up Call Aigul. To do, 1 of
3", "Doing, 2 of 3", "Dropped Call Aigul in Doing, 2 of 3". The words are
`words`, for another language.

**A move stands at once, and waits for its answer faded.** `onMove` gets the
card, where it was and where it went. Return a promise: a rejection puts that
card back — that card only — and the live region reads out the error's
message: "Warehouse automation was not moved: a deal needs an amount before
it is won". An answer to a move since overtaken by another of the same card
says nothing. Meanwhile the board shows the cards it is given, with the moves
still out laid over them, so a refresh of the cards does not undo a move in
flight. When a move holds, apply it to your cards — `applyMove` places the
card in the array so that its column's order puts it where it was dropped.
The DataGrid's cell saves work the same way.

**Dragged by a pointer**, a card comes up once the press has moved four
pixels, so a press that does not move still opens it. A copy of it follows
the pointer, tilted a degree, in the top layer above everything; the card
itself stays in the list as a dashed slot, standing where it would land, and
the cards around it slide aside. Where it would land is read from layout
positions, not drawn ones, so a card in the middle of sliding does not make
the slot flicker. Near the board's left or right edge the board scrolls,
near the window's top or bottom the page does, faster the nearer. Escape, or
a pointer the browser takes back, puts the card back; on release the copy
flies to where the card landed, and the press that ended the drag does not
open it. On a touch screen a card is held still for 300 ms before it comes
up: a finger that moves first is scrolling, and scrolls. `canDrag` keeps a
card from being dragged; the keyboard can still move it. A keyboard move
slides the cards too, and under reduced motion nothing slides.

The drag is one DOM helper in the core, `attachKanbanDrag(root, send)`, which
both adapters attach: it reads where the pointer is, and the machine holds
where the card is — a drag is the keyboard's pick-up, carry and drop, with a
pointer choosing the places.

**A board given a height holds its columns to it**, and each column scrolls
its own cards: the arrows and a moved card bring the card into view in its
column, and a card dragged to a column's top or bottom scrolls it. Given no
height, a column is as tall as its cards and the page scrolls. A column's
list is out of the tab order — Chrome makes a scroller a tab stop of its own
when nothing in it is — since its cards scroll it.

**A card's menu** opens on a right click at the pointer, on Shift+F10 or the
menu key under the card, and from the card's ⋯ button — the way on a touch
screen, which has no right click; the button is quiet until the card is
hovered or focused, and always shown where nothing hovers. The board puts
its own items first: Move to each other column (to its end), Move to top,
Move to bottom, the ones that would do nothing disabled. `cardMenu` adds
yours after a separator, and `onCardMenuSelect` hears them. A move from the
menu is a move like any other — shown at once, handed to `onMove`, taken
back if refused — and says "Call Aigul moved to Done, 2 of 2". It is the
move for someone who never learns Space.

**Add a card**, with `onAdd`: a column's foot opens a field in place. Enter
sends the title and leaves the field open and empty, the focus in it, for
the next card; Escape closes it and gives the focus back to the column's
button; leaving an empty field closes it, a field with a title in it stays.
A card sent stands at the column's end, faded and `aria-busy`, until `onAdd`
answers; add it to your cards and resolve. The stand-in gives way when your
new cards arrive — not before, so the card is never shown twice nor missing
for a frame. A rejection takes the stand-in away, puts the title back in the
empty field, and reads out why.

**A limit is soft.** A column with `limit` shows its count against it, "4 / 3",
and turns the count red past it; a move past it is not refused, since a
kanban's limit is a signal to the team, not a lock. A move the server refuses
is refused by the server.

Found on the way:

- **Every column became a tab stop.** Holding columns to a height made their
  lists scroll, and Chrome makes a scroller whose content is out of the tab
  order a tab stop of its own: Tab from a card went to a column's list, not
  on out of the board. The lists are `tabindex="-1"`.
- **A stand-in could leave a gap or a double.** An added card's answer and the
  owner's new cards arrive separately, in either order. The stand-in now
  waits for new cards when the answer comes first, and goes at once when they
  came first — measured in the browser, frame by frame, with no double shown.
- **A key moved the card the board last heard about, not the one it came
  from.** Focusing a card from a script in a window without system focus
  fires no focus event, so the board still thought the first card had it,
  and Space picked that one up. A key now brings the board's focus to its
  own card before it acts.
- **A held card did not look held in dark mode.** The popover's shadow is lost
  on a dark page, and a one-pixel accent edge is easy to miss. A held card
  now has a doubled accent edge and rises two pixels.
- **The slides restarted on every pointer move.** Each move re-measured the
  cards and started their slide over, so while the pointer moved the cards
  crawled and never settled. A slide now starts only when the slot's place
  changes.
- **A dropped card's copy could stay on the page.** It flies home on the next
  animation frame, and a frame never comes in a hidden tab or a frame the
  browser throttles; the copy stood over the board. A timer now takes it
  away if the frame does not come.
- **A drag lost its card on a blur.** The card's element is re-rendered in its
  new place, which drops the focus for a moment, and the board took that for
  leaving and put the card back. A blur now puts back only a card the keyboard
  holds.
- **jsdom has no `scrollIntoView`.** The focus-and-reveal after a move went
  into one core helper, `focusKanbanCard`, which both adapters call and which
  checks before it scrolls.

## CommandPalette

Ctrl+K (⌘K on a Mac) from anywhere on the page: a field that finds what to
do — an action, a place, a record — and Enter does it.

```tsx
<CommandPalette
  commands={[
    { id: 'new', label: 'New deal', group: 'Actions', shortcut: 'N', run: openNewDeal },
    { id: 'mode', label: 'Colour mode', group: 'Actions', children: modes },
    { id: 'go:reports', label: 'Reports', group: 'Go to', keywords: ['analytics'], run: () => navigate('/reports') },
  ]}
  load={(query, signal) => api.searchLeads(query, signal)}
  trigger={(props) => <Button {...props}>Search…</Button>}
/>
```

**A modal dialog holding the APG's editable combobox, its list always
shown.** The focus stays in the field; the arrows move a highlight that
`aria-activedescendant` names, and loop; PageUp and PageDown go to the ends;
Enter runs it, and so does a press, which never takes the focus from the
field. The dialog sits high in the viewport, where the eye already is, over
the page's scrim, with the page behind it inert.

**What it finds** is matched on the label, its words, `keywords` and the
description, case and accents not counting: a label that starts with the
query first, then a word of it, then a keyword — "settings" finds
Preferences — then anywhere. The commands stand under their `group`
headings, and a heading stands where its best match falls, so the best
match of all is first. A live status says how many there are.

**A command with `children` opens a level of its own** — Colour mode ›
Dark, Move card › a column — shown as a chip before the field, with its own
placeholder. Backspace in the empty field or Escape goes back up, onto the
command that opened it; Escape at the top closes.

**Records from a server**, with `load(query, signal)`: asked on the top level
when the typing pauses (150 ms) and two letters are typed; a new question
aborts the one in flight, and an answer to a question no longer asked is
dropped. They stand under their own heading, "Results".

**A command runs after the palette has closed** and given the focus back —
so a command that opens a dialog of its own gets the focus, rather than
losing it to the element the palette returns to. `run` on the command, or
`onRun` for all of them.

Found on the way:

- **Svelte detached and attached every popover on every key.** An effect
  that attaches on open read `snapshot.open`, and the snapshot is a new
  object on every change, so the effect ran again for any change at all:
  the palette closed on its first level, and the cascader sent the focus to
  its button and back on each arrow — twice in a three-key walk, which a
  test now counts. Eight components read `open` through a `$derived` now,
  which only tells its readers when the value itself changes.
- **An owner's answer was heard by nobody.** The combobox sent the created
  option back to its machine from inside its own effect — to the machine
  underneath the effects, not the one wrapped by them — so the choice was made
  and `onValueChange` never heard it. The board's answers went the same way,
  harmlessly so far. Both send to the wrapped machine now.
- **Escape never reaches the field.** The dismiss stack takes Escape on the
  document before any element sees it, so the field cannot decide "back up a
  level" itself. The dialog's dismiss hands the palette an ESCAPE, and the
  palette decides: up a level, or closed.
- **The field drew a ring inside its header.** The theme's own focus rule,
  in a later layer, outlined the bare input, as it once did the combobox's.
- **The grid's search had a NUL byte in its source.** A separator written as
  the character itself made tools read the file as binary; it is `\u0000`,
  the same string.

## Form and FormSummary

A form that checks itself on submit, in three layers, each over the one
before.

```tsx
<Form
  validate={(data) => ({
    confirm: data.get('confirm') !== data.get('password') ? 'The passwords differ' : null,
    role: data.get('role') ? null : 'Choose a role',
  })}
  onSubmit={async (data) => {
    const answer = await api.signUp(data)
    if (!answer.ok) return { errors: answer.errors, message: 'The account was not created.' }
  }}
>
  <FormSummary />
  <Field name="email" label="Email"><Input type="email" name="email" required /></Field>
  <Field name="password" label="Password"><Input type="password" name="password" required minLength={8} /></Field>
  <Field name="confirm" label="Confirm password"><Input type="password" name="confirm" /></Field>
  <Select name="role" label="Role" items={roles} />
  <Button type="submit">Create account</Button>
</Form>
```

1. **The browser's own constraints** — `required`, `type="email"`,
   `minlength` — read from each control's validity, as Field already does,
   with the browser's own words in the page's language.
2. **Rules**, `validate(data)`: errors by field name for what the browser
   cannot say — two passwords that differ, a choice required of a Select,
   Combobox or DatePicker, whose hidden input the browser does not check.
   A rule may return a promise (is this address taken?); the form waits.
3. **The server's**, from `onSubmit`: errors by name and a message for the
   whole form.

**A submit that finds errors is stopped.** Each field says what is wrong; a
Field with a `name`, or a Select, Combobox or DatePicker, shows the form's
error for that name, its control `aria-invalid` and described by it. The
summary — `FormSummary`, anywhere in the form — lists every error in the
page's order as a link to its control, and takes the focus, so its heading is
read first; without one, the focus goes to the first field in error. The
summary reads what each field says off the page, so it and the field never
word the same error twice.

**Errors leave as they are fixed.** An edit takes that field's rule or server
error away; once a submit has been tried, the rules run again as the person
edits, so "The passwords differ" appears and leaves with the typing. A
composite whose hidden input fires nothing says it was edited itself.

**Without `onSubmit`, a valid form submits natively**, to its `action`, as
plain HTML does: to a server that renders pages the kit only adds the
checking, and an asynchronous rule holds the form until it answers, then
lets it go. With `onSubmit`, the form is `aria-busy` while it waits, and a
second press sends nothing more.

Found on the way:

- **An edited Select brought its error straight back.** The Select says it was
  edited as its value changes, before React or Svelte has drawn the new value
  into its hidden input, so the rules read the old, empty value and put the
  error back. A composite's edit is taken once the page has caught up.
- **The summary would not take the focus in Chrome.** It is `hidden` until its
  items arrive, and it was focused in the same turn that filled it, before it
  was drawn; jsdom, with no layout, did not mind. The focus now waits for the
  drawing.
- **A Select in error kept its accent border under the pointer.** Its hover rule
  was more specific than the error's; the error now holds on hover too.
- **`Form.svelte` and `form.svelte.ts` are one file on Windows.** The helper
  module is `context.svelte.ts`.

## Gantt

Tasks as bars on a time scale, their names beside them, moved and resized
by a pointer or the keyboard, arrows running from each task to the ones
that wait for it, and tasks gathered in groups that close.

```tsx
const [scale, setScale] = useState<GanttScale>('day')

<SegmentedControl items={scales} label="Scale" value={scale} onValueChange={setScale} />
<Gantt
  tasks={plan}
  groups={[{ id: 'phase-setup', title: 'Setup' }]}   // a task joins with group: 'phase-setup'
  scale={scale}
  onScaleChange={setScale}
  onOpen={(task) => openTask(task)}
  onTaskChange={async ({ task, to }) => {
    await api.reschedule(task.id, to)   // a rejection puts the bar back
    setPlan((current) => current.map((item) => (item.id === task.id ? { ...item, ...to } : item)))
  }}
/>
```

A task is an id, a title, its first and last day (`YYYY-MM-DD`, the last
included), how far along it is, whether it is a `milestone` — a point in
time, drawn as a diamond on its day — the ids it `dependsOn`, and the
`group` it is listed under.

**Everything is counted in days.** Where a bar starts, how many days it spans,
how many the chart shows, where today falls: the core hands them to CSS as
`--gg-gantt-start`, `--gg-gantt-span`, `--gg-gantt-days`, and the theme says
how wide a day is — GGarry's is 32 pixels at the day scale, 14 at the week
scale, 4 at the month scale. The core never knows a pixel, and a theme can
make the same chart a fortnight on a laptop or a year on a wall. The chart
fits its days to the tasks with room around them, lined up on the scale's
own unit — a week's first day, the locale's — or shows the `range` it is
given. Its header is two rows: months over days, months over weeks, years
over months; a month's name stays in view while its cell scrolls past, and
a month cut to a day at the chart's edge keeps its name to itself.

**One scroller**, the task list stuck to its left edge and the scale to its
top, so the rows of the list and of the timeline can never drift apart. It
opens on today, a third of the way into the timeline — or on the first task,
when today is not in the chart — and again at each new scale.

**To a screen reader it is a grid**: a header row, then a row per task, its
name the row's header, its schedule a cell that says the dates in words —
"10 Sept – 18 Sept 2026, 9 days, 40% done", "Milestone, 21 Sept 2026" — while
the bar shows them to the eye and is hidden from it. One tab stop, on a
schedule cell; Up and Down walk the tasks, Home and End, PageUp and PageDown;
Enter or a double press opens one. The row the keyboard is on is tinted,
name and all, its bar ringed, and a bar out of sight is scrolled into view
clear of the list — the theme's scroll padding keeps it from landing under.

**With `onTaskChange`, the bars move.** A pointer takes a bar's body to move it
and either end — a grip eight pixels wide — to resize it, in whole days, a
day's width read off the page; Escape in the middle puts it back, and the
release that ends a drag is not a press. The keyboard does the same on the
focused task: Left and Right move it a day, with Shift a week, and with Alt
they move its end; each step is said — "Design the flow: 12 Sept – 20 Sept
2026" — and the steps add up to one change, handed over when the keys rest
(700 ms), on Enter, or on moving to another task, so holding an arrow sends
one change, not twenty; Escape puts it back. An end never passes the other,
a milestone only moves, and a `locked` task has no grips and ignores the
keys. The schedule cell describes the keys to a screen reader.

A change stands at once, faded until `onTaskChange` answers. A rejection puts
that task back — that change only — and reads out why; one that holds waits
for your tasks to show it, so the bar never jumps back for a frame. The
Kanban's moves and the DataGrid's cell saves work the same way.

**An arrow for each dependency**, from where the task waited for ends to
where the waiting one starts — a milestone's tips, not its middle. With room
between them it runs across, down and in; with none it steps out, runs along
the seam between the rows, and comes back in, so it never doubles back
through a bar. The room it needs is in days, more at the coarser scales. The
core gives each corner in days across, rows down and a small gap either
side; the theme says how many pixels a gap is and draws each straight run
as the edge of a box — no SVG, and nothing to measure. The arrows lie under
the bars and over the grid, take no pointer, and follow a bar as it is
dragged. A task that starts on or before the last day of one it waits for is
a conflict, its arrow red; a milestone is a moment, so a task may start on
its day. The arrows of the task the keyboard is on are drawn in the accent.
They are hidden from a screen reader, which hears them in the schedule
instead: "10 Sept – 18 Sept 2026, 9 days, 40% done, after Write the brief",
and "; starts before Write the brief ends" when it does.

**Groups** are headings, `{ id, title }`, with no dates of their own. The
rows keep the tasks' order: a group's heading stands where its first task
would, all its tasks under it, stepped in; a group with none comes last. Its
row has a summary bar from its first task's start to its last one's end,
filled as far as they have got — each task weighed by its days — and it
follows a task being dragged. A press on its name closes and opens it; on
its row Right opens it, Left closes it, Enter does either, and Left from a
task goes up to its heading when the bars stay put. Closing the group the
keyboard is in takes the keyboard to the heading, keeping a change being
made. `collapsed` or `defaultCollapsed`, with `onCollapsedChange` (Svelte:
`bind:collapsed`), say which are closed. A task may depend on a group, its
arrow from the summary's end; a closed group's tasks send and take their
arrows at its row, at their own days, and none is drawn between two tasks it
hides. With groups the chart is a treegrid: each row has its level, each
heading says whether it is open, and its cell says the summary — "2 tasks,
7 Sept – 18 Sept 2026, 12 days, 55% done". The ids of groups and tasks are
one set: none may be both.

Found on the way:

- **A closed group said nothing.** `aria-expanded: false` was dropped as a
  false attribute is, so a closed heading read as one that never opens; it
  is set as the string, as the Tree's is.
- **A month's name stuck inside its own cell.** The header cells clipped their
  text with `overflow: hidden`, which makes an element a scroll container —
  so a name meant to stick at the chart's left edge stuck at the list's width
  inside its cell instead, and October's was pushed out of sight. The cells
  clip with `overflow: clip`, which is not a scroll container.
- **An answer the owner gave was one the chart could lose.** A change that
  holds is taken off the list of changes out once the owner's tasks show it
  — not when the promise resolves, since the tasks may arrive after: the bar
  would have jumped back to its old dates for a moment.
- **The arrows were drawn and painted over.** Each row's schedule cell is
  positioned, so it painted its grid over the arrows laid before it. The
  body is its own stack now: the arrows over the grid, the bars over the
  arrows, the task list over them all.
- **A focus ring as wide as the chart.** The schedule cell spans the whole
  timeline, and ringing it drew two lines across it. The bar is ringed
  instead, and the row tinted.
- **The weeks lost their names.** "Too narrow to name" was measured on both
  header rows, and a week, at seven days, was under the week scale's limit.
  Only the top row is cut short at the chart's edges.

## PageHeader, Section, Container, Stack, Cluster and Grid

What goes inside the work area: the top of a screen, the stretches under it,
and the four primitives a screen is laid out with.

```tsx
<Container>
  <PageHeader
    context={<Breadcrumbs items={crumbs} />}
    title="Leads"
    description="Everyone the sales team is talking to."
    actions={<Button emphasis="high">New lead</Button>}
  />
  <Section title="This week" actions={<Button size="sm" emphasis="minimal">All weeks</Button>}>
    <Grid columns="tight">{tiles}</Grid>
  </Section>
  <Section title="Your details" rank="support" description="Shown to the leads you write to.">
    <Stack>
      <Field label="Signature"><Input /></Field>
      <Button emphasis="high">Save</Button>
    </Stack>
  </Section>
</Container>
```

**PageHeader** says where you are (breadcrumbs in `context`, above), what this
is (the title — an `h1` by default — and a line the title is described by), and
what can be done with it (`actions`, at the far edge). When the screen is too
narrow for both, the actions fall under the title rather than squeezing it. It is
a `div`, not a `header`: outside a `main` a `header` would be the page's banner,
and the shell's header already is.

**Section** is a stretch of the page under a heading, with no box — where a
Panel is a place with an edge. Its heading reads rank as a panel's does, so a
section and a panel of the same rank sound alike. Two sections stand a full loose
step apart, farther than any rows inside one, or the boundary between them would
not read. It is a landmark only when asked (`region`): a screen of ten sections
is not ten regions.

**Stack**, **Cluster**, **Grid** and **Container** hold no state. Each has three
steps of gap named by intent — tight, default, loose — and nothing between:
Instrument's refusal of spacing utilities, kept. A stack is a column; a cluster a
row that wraps, with a `ClusterSpacer` to send the rest to the far end; a grid
fills the width with columns no narrower than `tight`, `default` or `wide` allows,
and falls to fewer as it narrows, with no breakpoint; a container keeps the
content's width under a ceiling (`narrow` for a form, `prose` for reading, `full`
for a board) and is the region the components inside answer to with container
queries.

A stack stretches what it holds to its width — fields, panels and cards want
exactly that — except what is sized by its content: a button, a badge, a chip,
a button group keeps its own width. The column says so on a channel, not a list:
it sets `--gg-flow-self: start` on each child, a custom property registered as
not inheriting, so it reaches the child and not the child's insides, and the
components sized by their content read it for their `align-self`. A button in a
row inside a stack is centred in its row, not sent to the row's top. Outside a
column the channel is unset and nothing changes.

Found on the way:

- **A section's line stood beside its heading.** The description was given the
  whole row to force a line break, and also a reading cap of 68 characters, which
  made it narrow enough to fit next to the title after all. A section is only as
  wide as its column; the cap is gone, and a browser test checks the line is
  under the heading.

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

**One adapter skipped the empty state.** React and Svelte rendered
`[data-part="empty"]` for an empty list; the custom elements, since retired,
looped over items and so rendered nothing. This is the standing risk of the architecture — adapter
drift — and it is exactly what a conformance suite is for. The suite had to grow
a test before it caught it.

**ChipGroup had no tab stop when items arrived late.** A group constructed empty
and given `items` afterwards — as the custom elements were — kept `focus.index` at
`-1` from the initial state and *every* chip got `tabindex="-1"` — the group was
completely unreachable by keyboard. `SYNC_ITEMS` now re-homes the tab stop. The
same bug hits any adapter that fetches its items. One failing assertion in the
conformance suite caught this and the next one together.

**Focus was moved in a passive effect, on every render.** Two faults in three
lines: `useEffect` runs after paint, so focus landed a frame late; and the dep
array contained a freshly-built `ids` object, so it re-ran on *every* render and
would drag focus back into the group from wherever the user had moved it. Fixed
with `useLayoutEffect` plus an explicit last-seen-nonce ref — and the same guard
in the Svelte adapter, since every adapter had inherited the pattern.

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
| structure | the shared structure layer reads a theme-private token, or stacks at a literal `z-index` of 10 or more instead of a `--gg-z-*` level |

Variables are resolved per theme in isolation, which also catches one theme's
private token leaking into another's CSS.

**Contrast** is Instrument's Go gate (`tools/cmd/contrast`), ported to TypeScript
and generalised. Tokens are computed from the files as a browser computes them on
`<html>` — the cascade with layers, `var()` with fallbacks, `calc()`,
`light-dark()` by colour scheme, `color-mix(in oklab)`, OKLCH to sRGB, translucent
layers composited onto their base — in every context a theme declares:

| Theme | Contexts | Pairs | Measurements |
|---|---|---|---|
| GGarry | light, dark | 15 contract + 241 own | 512 |

Thresholds are WCAG's 4.5:1 for text and 3:1 for large text and meaningful
non-text (a control's own border, a state mark), plus Instrument's OKLCH
lightness step of 0.022 for surfaces that must read as separate — a ratio cannot
serve there, because WCAG's flare term squeezes every ratio towards 1 at the
dark end.

**The port was verified against the original**, not assumed: while Instrument was
in the kit, all 580 rows the Go gate printed for its base accent, across five
modes, matched the TypeScript engine
within ±0.0005 — the rounding of Go's three-decimal output. One deliberate
difference: `color-mix(in oklab)` mixes in OKLab, where the Go code approximated
in sRGB; Instrument's tokens mixed only against `transparent`, where the two agree.

**Coverage.** Every colour a theme's component CSS paints text with must be the
foreground of some pair. The Go gate skipped relay variables (`--btn-fg`,
`--tone-ink`) by a hand-kept name pattern; here relays are followed instead —
a property never declared on the root is traced through every value it is given
down to the root tokens, and those must be covered.

**Waivers.** A theme may waive a known failure with a reason (GGarry has none). A waived pair that
starts passing is itself a failure, so fixing a token forces the stale excuse out
with it. When GGarry's palette fixes landed, the gate flagged each waiver as
stale with its new value before the waivers were removed.

**Literals.** A value that has a token is written as the token. The gate reads
the theme's own CSS (everything but the tokens layer and rules under forced
colours) and puts each raw value into the family whose scale it skipped:

| Family | A literal | Let through |
|---|---|---|
| colour | `#b00`, `rgb()`, `color-mix(in srgb …)` | named and system colours, a mask's `#000` |
| primitive | `var(--ggarry-color-white)` | — a component reads the semantic layer |
| radius | `2px`, `999px` | `0` |
| line-height | `1.6`, `20px` | `1` for a glyph box, a `1px` hairline in `calc()` |
| opacity | `0.55` | `0` and `1` |
| font-size, font-weight | `11px`, `600` | `em` and `%` |
| motion | `120ms`, `ease` | `linear` and `steps()` |
| focus | `outline-offset: -2px` | `0`, and a 1px hairline: an edge drawn with an outline is not a ring |
| edge | a border wider than 1px | the hairline |
| z-index | 10 and above | stacking inside one component |

The gate cannot tell a deliberate value from an accident, so it counts, per
file and per family, against a ledger the theme keeps:
`packages/theme-ggarry/literal-debt.json`, one line per file. A count above
the ledger is new drift and fails at its line. A count below it fails too until
the ledger is lowered — `npm run check:themes -- --pay` lowers it and never
raises it — so a paid debt cannot quietly come back. GGarry opened the ledger
at 201 literals in 72 files and paid it to zero in the next step; its ledger
is now `{}`, and every raw value in a family is a failure.

Every rule was proven able to fail: `tests/checks.contract.test.ts` builds a
throwaway workspace per rule with exactly one defect planted; a planted
regression in a real theme's muted text (Instrument's, at the time) failed every
row that reads it.

### What the first run found

**GGarry had nine real failures.** They were first waived, each with a measured
candidate fix, then fixed. GGarry then passed all 76 measurements with no waivers:

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
quieter border, exactly the load-bearing/decorative split Instrument drew. And
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
construction and silently ignored afterwards, in every adapter — the
conformance suite now changes each one on a live group and checks the behaviour
follows.

In Svelte the one-time construction is wrapped in `untrack`, which states the
intent and is what clears the compiler's `state_referenced_locally` warnings; the
sandbox build prints none.

## Testing

| Project | Env | Files | What it covers |
|---|---|---|---|
| machine | node | `*.machine.test.ts` | 661 tests. Every transition of every machine, pure, milliseconds; `mergeProps`; the choice and group connects; tooltip timing with fake timers; the menu's highlight, selection, item roles, submenu levels and pointer corridor; the menubar's bar, menu switching and access keys; tabs' selection and closing; the toast queue and its clock, with fake timers; the grid's query, loader and selection; filter chips and drafts, views, the bulk bar, the column picker, export and CSV, the URL and column storage; drafts and their parsing, saves shown at once and rolled back per cell, the detail following the grid, the row menu's target; the cascader's columns, its walk down and across, and choosing a leaf or a branch; the accordion's one-or-several rules; the tree's rows, keys and three ways of choosing; progress numbers in the locale's words; the board's walk, carry, drop and put-back by keyboard and by pointer, its card menu and cards added and answered, moves shown at once and taken back per card, what the live region says; the palette's ranking, levels, a command run after closing and a server's late answer dropped; a form's errors by name, what an edit keeps and where the focus goes; the Gantt's range, its header's cells, its bars in days and its walk; nudges adding up and kept when the keys rest, a drag's ends never crossing, a refused change going back; each dependency's arrow, its corners with room and without, out of and into a milestone, the room growing with the scale, an arrow up the chart; conflicts; the schedule saying what a task waits for, and a change moving its arrows; groups: rows in the tasks' order, a treegrid with levels, the summary's days and weighed progress following a change, closing and opening by the owner or not, the keyboard taken to the heading, keys on a heading, arrows from a group and from a closed group's row.; the readouts: a metric's formatting, direction and tone apart, key–value pairs, file changes' closed set and words, a timeline's times in the locale, the dot's and caret's parts; code lines and the copier's states and fallback, inserts at the caret and cancelled |
| contract | node | `icons.contract.test.ts` | 399 tests. Core names only real glyphs, adapters draw none. |
| contract | node | `themes.contract.test.ts` | 5 tests. Every discovered theme — GGarry, now the only one: structure, literals, contrast, coverage. |
| contract | node | `checks.contract.test.ts` | 30 tests. The gates themselves: each rule fires on a planted defect — the literal families and their ledger among them; the colour engine. |
| dom | jsdom | `conformance.dom.test.ts` | 1078 tests, 8 of them skipped where an adapter or the environment cannot express the case. One contract × two adapters. |
| dom | jsdom | `layers.dom.test.ts` | 8 tests. The dismiss stack: which layer hears Escape and an outside press. |
| browser | Chrome | `conformance.browser.test.ts` | 1078 tests, 2 skipped. The conformance suite again, in a real browser through Playwright: real layout, focus, events and top layer. |
| browser | Chrome | `data-display.browser.test.ts` | 10 tests. A metric's unit at a little over half its value, the headline band's 28px, a joined row's hairlines not hanging when it wraps; two key–value lists lining up on the shared column, a tight one sizing to its longest name; a file change's 16px box with its sign centred. |
| browser | Chrome | `states.browser.test.ts` | 10 tests. The caret in em at two sizes, its stepped blink, stopped but shown under reduced motion, left out of print; a dot's colour following its own or an ancestor's tone, and a badge's, a timeline's and a lone dot agreeing; the running pulse slowing under reduced motion; Highlight under forced colours; the timeline's line from centre to centre and none after the last. |
| browser | Chrome | `code.browser.test.ts` | 7 tests. A long line not wrapping, the copy button staying in its corner while the code scrolls, a 5ch number column, a 24px target; copying through a stubbed clipboard, the fallback when it refuses, a failure, the live region's words and the tick resetting. |
| browser | Chrome | `inserts.browser.test.ts` | 4 tests. A controlled React textarea typed into, the caret put mid-text, an insert landing there with the caret after it, the focus back and React's state updated; a selection replaced; Enter on an insert; inserts inside a Field finding its field with no target. |
| browser | Chrome | `charts.browser.test.ts` | 9 tests. A sparkline's line drawn where its numbers are, its last dot on the final value, a flat series still drawn, its natural proportion kept so the dot stays a circle; a legend wrapping, its swatch square and 8px. |
| browser | Chrome | `meter.browser.test.ts` | 10 tests. A meter's fill measured against its track at a reading and past the ceiling, its reading in words above it; a ring's arc as a dash of its circumference, the figure inside only at the large size, and the three sizes' boxes. |
| browser | Chrome | `share.browser.test.ts` | 5 tests. The parts filling the bar exactly, a part too small to see still drawn, the whole named in words. |
| browser | Chrome | `heatmap.browser.test.ts` | 6 tests. A column a week with the blanks kept, the four steps by rank, the months labelled only where one owns two columns, a year scrolling rather than wrapping. |
| browser | Chrome | `agent.browser.test.ts` | 6 tests. A history clipped at its leading edge, batches dividing the width they were given, a queue's dots on one vertical whatever the titles, one Tab into the queue and the arrows moving real focus, a run's room drawn before it begins. |
| browser | Chrome | `agent-stream.browser.test.ts` | 11 tests. A log holding the bottom as lines arrive and letting go the moment the reader scrolls up; a diff copying clean code with no numbers or signs in the text, its sign drawn in the gutter, a long line scrolling rather than wrapping; a step opened by find-in-page; lanes measured against one axis. |
| browser | Chrome | `chat.browser.test.ts` | 8 tests. The composer's field growing and its frame holding one line at rest, Enter sending and Shift+Enter breaking the line, nothing sent while busy; a turn's actions appearing under the pointer; an approval and a failure keeping their record once answered. |
| browser | Chrome | `forced-colors.browser.test.ts` | 12 tests. Forced colours emulated through Playwright (`page.emulateMedia({ forcedColors })`): a checked box and a switch that is on keep their state as `Highlight` with a border, a checked radio's dot shows against its box, and a busy button's ring keeps a turning arc. Each fails with the `gg.forced` layer removed. |
| browser | Chrome | `dialog.browser.test.ts` | 8 tests. What only a browser has: `:modal`, inert page, scroll lock, real keys and clicks, the dismiss stack, form closes. |
| browser | Chrome | `rhythm.ggarry.browser.test.ts` | 2 tests. The form rhythm — Field's label and hint included — option rows with the field's 6px corner and 32px tall, the menu's corners, a closed menu not drawn, a menu row's shortcut at its edge, and a sheet flush with each edge, measured in pixels, in light and dark. |
| browser | Chrome | `overlay.browser.test.ts` | 18 tests. Popover placement and flipping, the top layer escaping a clipping ancestor, Select unclipped inside `overflow: hidden` and a short dialog, a long Select and a long Menu keeping their row in view, real hover and Tab for tooltips, a menu driven by the real keyboard and pointer, submenu placement, flipping and the pointer corridor, a menubar by real keys (Tab, arrows, Alt+key, F10) and pointer, nested and passive layers. |
| browser | Chrome | `tabs.browser.test.ts` | 4 tests. One tab stop under the real Tab key, vertical tabs beside their panel, a long strip scrolling to the focused tab, a real click closing a tab without losing focus. |
| browser | Chrome | `toast.browser.test.ts` | 4 tests. The region in its corner over a clipping ancestor, presses passing through its empty stretch, a real pointer holding a toast, the keyboard reaching its action. |
| browser | Chrome | `data-grid.browser.test.ts` | 13 tests. A row's checkbox pressed by a real pointer, React and Svelte; its Open button shown under the pointer and opening the row without selecting or editing it, and Shift+Enter opening it from a cell that edits. The grid at 700,000 rows: a screenful drawn, the true count announced, the scaled scrollbar reaching the last row flush with the bottom, Ctrl+End with the focus surviving recycled rows, a pinned column staying put, resizing by drag, a scroll step inside a frame, requests aborted for rows scrolled past, and React under StrictMode and Svelte reaching the end too. |
| machine | node | `layout.machine.test.ts` | 10 tests. The drawer's state and what its toggle says, the split's size inside its bounds and what the frame leaves, the fold, the rail's ends, and the breakpoint agreeing with the structure layer's. |
| browser | Chrome | `date-picker.browser.test.ts` | 4 tests. The calendar under the field over an ancestor that clips, on the chosen day; the keyboard turning pages with the focus riding along and Enter choosing; a typed day committed on Tab; a range drawn under a real pointer before the second press. |
| browser | Chrome | `gantt.browser.test.ts` | 9 tests. A group's summary measured to the pixel, closed by a press on its name, its chevron turned, a hidden task's arrow leaving the heading's row. An arrow out of a bar's last day, a gap out, down to the rows' seam; into a milestone at its tip; behind a bar it crosses; a conflict in another colour. A bar dragged three days' worth moving three days and the owner hearing it on release; its end resized by the grip, and Escape in the middle putting it back; a refused move springing back. Also Bars measured to the pixel at the day and the week scale, a milestone on its day; the list at the left edge and the scale at the top as the chart scrolls; a task reached by the keyboard brought into view clear of the list; the chart opening on today, a third of the way in. |
| browser | Chrome | `form.browser.test.ts` | 4 tests. The real keyboard submitting and walking the summary to a field; a valid form going on to its action natively; a rule that asks a server holding the form, then letting it go; a second press while a submission is out sending nothing. |
| browser | Chrome | `command-palette.browser.test.ts` | 4 tests. The real Ctrl+K opening it modal, high in the viewport, and closing it back to the element before; the list scrolling to keep the highlight in view; a server's records under their heading after the typing pauses; a command that opens a dialog of its own keeping the focus. |
| browser | Chrome | `kanban.browser.test.ts` | 13 tests. The column's thin themed bar following a dark island; a board given a height holding its columns and a column scrolling to the focus; a drag at a column's edge scrolling it; a real right click opening the card's menu at the pointer and Move to › Done moving it; a card typed with real keys standing faded and giving way to the owner's card with no double. Also A real mouse dragging a card into an empty column, the owner hearing it and the card not opening; a short press still a press; mid-drag, the slot where the card would land and a copy under the pointer, and Escape putting it back; the board scrolling at its edge; a finger that moves scrolling and one held still picking the card up; real keys carrying a card across a board narrower than its columns, the board scrolling to keep it in sight and the card drawn held; Tab out with a card up putting it back and the focus going on; a press on a control inside a card left to the control. |
| browser | Chrome | `disclosure.browser.test.ts` | 6 tests. A closed section hidden until found, taking no room, and opened by the page's search; a real Space and Enter, the chevron turned; a tree given a height scrolling to the focus under the real keyboard, each level stepped in by 16 pixels with a leaf lined up; a bar's fill measured to the pixel from the start edge in both directions; a ring's sweep and turn. |
| browser | Chrome | `cascader.browser.test.ts` | 2 tests. The columns side by side under the button over an ancestor that clips, the card keeping to a phone's screen with the focused item scrolled into view; the real keyboard walking down and across, Enter choosing and the focus back on the button. |
| browser | Chrome | `combobox.browser.test.ts` | 4 tests. Real typing; the list under the field, lined up with it, over an ancestor that clips; Enter choosing and Tab moving on with the list gone; a press outside putting the field back; chips wrapping in the box with room left to type. |
| browser | Chrome | `layout.browser.test.ts` | 16 tests. The column beside the work on a wide screen with only the work scrolling, the drawer out of the tab order until opened and then over an inert page, the window growing past the breakpoint closing it, a bar lying down under the header, a separator dragged by a pointer with its line under it and stopping for the other pane, the keyboard moving it, a status strip staying one line with air around a button in it, a button group standing flush; a stack stretching a field and not a button, a grid falling to fewer columns, a container centred under its ceiling, a page header's actions falling under its title, a section's line under its heading, and sections farther apart than their rows. |
| browser | Chrome | `data-grid-rows.browser.test.ts` | 6 tests. A double click and a click elsewhere saving, Tab walking the editable cells, an edit surviving its row scrolled out of view (also React under StrictMode), the row menu standing at the pointer and handing the focus back, a press on another row while the sheet is open. |
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
| react | `root.render` with new props | `act()` |
| svelte | a `$state` props object, mutated in place | `flushSync()` |

A failure names the adapter that drifted — `svelte > chip group > roving tabindex
> wraps at both ends`. The suite was checked by planting a different bug in React
and in Svelte: each failed under its own adapter's name and nowhere else. A spec
skips what an adapter's API cannot express and says so, rather than faking it.

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
- **A tooltip on a disabled button never shows.** A disabled button fires no
  pointer or focus events; wrap it in a focusable element, or say why it is
  disabled in visible text.
- **No arrows** on popovers or tooltips, and no CSS anchor positioning: Floating
  UI places everything, which works in every browser the kit targets.
- **No exit animation.** A dialog's body unmounts as it closes, so there is nothing
  left to animate out; opening fades in. Popover and Tooltip, likewise.
- **Svelte cannot refuse a close.** `bind:open` follows the dialog; only a controlled React owner can keep it
  open against a request.
- **A dialog inside a `display: none` ancestor never shows,** top layer or not.
- **A non-modal dialog does not keep focus.** By design — it floats over a page
  that stays usable — but Tab walks out of it.
- **Platform close requests** (a back gesture) are cancelled through the `cancel`
  event, which browsers may refuse to let a page cancel without recent user
  activation; the dialog then closes natively and reports `native`.
- **No prose styles, charts (meter, sparkline, ring, heatmap), agent components
  (including a composer, a textarea with a toolbar in one frame) or print
  styles.** Instrument had them; they were never ported.
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
- **The grid's rows have one height.** By design (see DataGrid), not by accident.
- **A toolbar's role is opt-in.** An unnamed strip is a row of ordinary buttons
  with a tab stop each; that was Instrument's position, and it stays available.
- **The date picker has no time.** A day or a range of days; a time of day, and
  the time zone that comes with it, are not built. Nor are two months side by
  side.
- **Form errors reach Field, Select, Combobox and DatePicker.** A RadioGroup or
  CheckboxGroup in a Fieldset keeps the browser's own `required`; a Cascader,
  Tree or Slider does not yet show a form's error by name. Nor is there a
  submit button that shows the form is busy by itself: the form is
  `aria-busy`, and `onStatusChange` says so.
- **The Gantt's groups are one level deep, and do not move.** A group
  inside a group, dragging a whole group, and a group depending on another
  are not there; nor is windowing for a plan of thousands of rows. Only
  finish-to-start dependencies are drawn, and an arrow takes the plainest
  route — it may cross the bars of tasks between the two, under them; it is
  never moved aside for another. Dependencies are given, not drawn with the
  pointer, and moving a task does not move the ones waiting for it. A
  task's start is moved with its whole bar or by its grip — the keyboard has no key for the
  start alone. The weekend is Saturday and Sunday wherever the chart is read.
- **The palette keeps no history.** Recent commands, frecency and a
  "did you mean" are yours to put in `commands`; nothing is remembered
  between openings. A level's children are given up front, not loaded.
- **The board does not window its columns, or move them.** A column of a few
  hundred cards renders them all; a column is not dragged to another place;
  several cards are not moved at once; there are no swimlanes.
- **A card's layout is yours.** The board gives a card its title and a body
  you fill; labels, an owner, a due date and a checklist are composed from
  Badge, Avatar and Progress, as the sandbox does, not built in.
- **"Move to" sends a card to a column's end.** Choosing a place inside another
  column from the menu is not built; the keyboard and the pointer can.
- **A tree does not load its children on demand, drag, or rename.** The whole
  tree is given up front; moving a node by dragging and renaming it in place
  are not built. Nor is a range chosen with Shift in a multiple tree.
- **The accordion does not animate its height.** A section opens at once; the
  chevron turns. Animating to `auto` needs `interpolate-size`, which only
  Chromium has.
- **A cascader does not search.** Typing jumps within a column; a search across
  every level, answering with whole paths, is not built. Nor are children loaded
  on demand: the whole tree is given up front.
- **The flow channel knows eight components.** Button, badge, chip, button group,
  avatar, avatar group, spinner and segmented control read `--gg-flow-self`; a
  component of your own sized by its content should read it too, or a stack will
  stretch it.
- **A grid's column widths are three steps.** No arbitrary minimum: a width that
  is not a step is a decision the kit does not offer.
- **The drawer's breakpoint is fixed at 60rem.** A media query cannot read a
  custom property, so a theme cannot move it; change `SHELL_NARROW` and the
  structure layer's `@media` together.
- **A split has two panes.** Three columns are two splits, one inside the other.
- **An affix names nothing.** "$" and "per hour" are text beside the field, not a
  label: a screen reader announces the field's own name, so put the unit in the
  label or the hint as well.
- **FileDrop shows what was chosen and nothing else.** No progress, no removing one
  file of several, no upload: the component chooses files, the page sends them.
- **A segmented control cannot be links.** The options are radios, so a row of
  links, with the state on `aria-current="page"`, is a nav, not this component.
- **The slider is one value.** No second thumb, and no range; a pair of number
  fields says "from" and "to" better anyway.
- **`onValueChange` fires when the user re-picks the already-selected value.**
  Intent semantics, not value-diff semantics. Correct for controlled components,
  mildly surprising otherwise.
- **Forced colours are half tested.** `a11y/forced.css` styles them; the boxes,
  the radio, the switch and the busy ring are tested under emulation, but the
  highlighted list rows and the bordered floating surfaces are styled and not
  tested. **Tap targets are styled but not measured**: the 24px targets exist,
  and nothing proves they stay 24px. Instrument's proportion gate and component
  registry were not ported.
- **The browser's validation bubble shows alongside the inline error** on a form
  without `novalidate`. Suppressing it in the field would also suppress the
  browser scrolling to and focusing the first invalid control, so it is left to
  the form (see Field and Input).
- **Select does not consume a Field or a Fieldset.** It is a listbox with its own
  label, not a native control. Option groups belong in a Fieldset, not a Field.
- **CheckboxGroup has no select-all.** A parent checkbox that is indeterminate
  while some are checked is still built by hand, as the sandbox's Checkbox demo does.
- **Fieldset has no framed variant** and no side-by-side label layout.
- **A dialog or popover title's distance to its content is not on the rhythm
  tokens.** It is still the theme's own.
- **Menu has no leading icons** and no second line of description on an item.
- **Submenus are left-to-right only.** They open to the right, and ArrowRight opens
  them, whatever the document's direction.
- **A menu item cannot keep the menu open from `onSelect`.** Whether it closes is
  decided up front, by `closeOnSelect` on the menu or the item.
- **Menu items are data only** — the `items` prop. There is no form written as
  children.
- **Menu item values must be unique.** Rows are keyed and reused by value.
- **Menubar is uncontrolled.** `onOpenChange` reports the open menu, but there is no
  prop that opens one.
- **Access keys cover the bar only.** Inside an open menu a letter moves to the item it
  starts, as typeahead; it does not activate an item marked with `&`.
- **A toast is not seen over an open modal dialog.** The top layer orders by entry, and
  a modal holds above a popover opened later (Instrument measured the same). Report a
  result inside the dialog, or show the toast after it closes.
- **One `Toaster` per toaster.** Two regions on one queue render every toast twice.
- **The only context menu is the grid's row menu.** Menu content can stand at a
  point now (`anchor`), but there is no general `ContextMenu` for any element yet.
- **No option descriptions on a plain radio or checkbox.** A second line of help
  text is ChoiceCards' alone.
- **No character counter.** `maxLength` is enforced by the browser, silently; a
  "12 / 280" readout (with a polite live region) belongs to Field.
- **`minlength` only applies after a real edit.** Browsers report `tooShort` for
  user edits, not for a value set from script — native behaviour, but it means a
  pre-filled short value passes until touched.
- **Instrument's inspector is not ported.** KeyValueList shows values; editing
  them in a two-column property sheet (Instrument's `inst-props`) is not here.
- **The grid's frame budget is timing-sensitive under load.** "A scroll step
  costs a frame's share" asks for under 40ms a step and measures about 21ms
  alone; deep in a full run on a busy machine it has measured 42–45ms, on
  the commit before the token sweep as well as after it.
- **One Kanban browser test is timing-sensitive under load.** "Held at the
  board's edge, the board scrolls toward it" failed once in a full run and
  passed in the next and three times alone: it waits on real frames of
  auto-scroll.
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
