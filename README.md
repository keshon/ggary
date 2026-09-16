# ggary-ui

A UI kit scaffold: one framework-agnostic core, three sibling renderers (vanilla
custom elements, React, Svelte 5), and two complete design languages on top of it.
Four components — Button, Chip, ChipGroup and Select — built end to end to prove
the architecture holds.

The two themes are **GGarry**, the kit's own neutral language, and
**Instrument**, ported from [keshon/instrument](https://github.com/keshon/instrument)
to test whether a strict, opinionated language can live on this spine without
becoming a monolith again.

```bash
npm install
npm run dev      # http://localhost:5180 — three pages, same demo
npm test         # 247 tests
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
  elements/          <gg-button>, <gg-chip>, <gg-chip-group>, <gg-select>
  react/             <Button>, <Chip>, <ChipGroup>, <Select>
  svelte/            <Button>, <Chip>, <ChipGroup>, <Select>
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

## The four components, and why these four

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
| GGarry | light, dark | 15 contract + 21 own | 72 |
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
with it — verified by applying one of GGarry's candidate fixes.

Every rule was proven able to fail: `tests/checks.contract.test.ts` builds a
throwaway workspace per rule with exactly one defect planted, and a planted
regression in Instrument's real `--text-muted` failed every row that reads it.

### What the first run found

**Instrument passes everything.** Its tightest pass is `stack: panel over page`
at ΔL 0.023 against 0.022 — exactly as tight as its own notes describe.

**GGarry has nine real failures**, waived pending a design decision because every
fix changes its look. Each waiver in `packages/theme-ggarry/theme.check.ts`
records the measured value and a measured candidate:

| Failure | Now | Candidate |
|---|---|---|
| placeholder and empty state use subtle text | 2.56:1 light · 3.75:1 dark | use `text-muted`: 4.76:1 · 6.96:1 |
| `--gg-text-faint` below even the decoration threshold | 2.56:1 light | ~`#8492a6`: 3.16:1 |
| select trigger border, its only boundary | 1.48:1 light · 2.36:1 dark | ~`#8492a6`: 3.16:1 · slate-500: 3.75:1 |
| white label on the dark accent fill | 3.58:1 | brand-600: 5.23:1 |
| dark accent hover goes *lighter*, towards the label | 2.48:1 | brand-700: 7.31:1 |
| white label on the dark danger fill | 3.76:1 | danger-600: 4.83:1 |
| red text on the low-emphasis danger tint | 4.14:1 light | danger-700: 5.54:1 |

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
fold, or you get layout shift on upgrade.

## Testing

| Project | Env | Files | What it covers |
|---|---|---|---|
| machine | node | `*.machine.test.ts` | 46 tests. Every transition of every machine, pure, milliseconds. |
| contract | node | `icons.contract.test.ts` | 37 tests. Core names only real glyphs, adapters draw none. |
| contract | node | `themes.contract.test.ts` | 7 tests. Every discovered theme: structure, contrast, coverage. |
| contract | node | `checks.contract.test.ts` | 23 tests. The gates themselves: each rule fires on a planted defect; the colour engine. |
| dom | jsdom | `conformance.dom.test.ts` | 126 tests. One contract × three adapters. |
| dom | jsdom | `elements.dom.test.ts` | 8 tests. What only custom elements have: properties, events, attribute fallbacks. |

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

Every mount is tracked and unmounted after each test. Detaching a component's DOM
does not unmount it: an open Select keeps its document-level Escape listener, and
the first run of the suite had the next test's keypress driving the previous
test's machine.

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
- **The positioner is not portaled.** It lives inside the component root, so an
  ancestor with `overflow: hidden` will clip the dropdown. Portalling means three
  adapter-specific implementations.
- **Form participation is a hidden `<input>`.** It submits correctly, but native
  `reset` does not clear the Select and there is no `required`/constraint
  validation. Both need a hidden `<select>` instead.
- **No positioning test in CI.** See above — needs Playwright.
- **No SSR test.** Core should be import-safe on a server; unverified.
- **Svelte has no `bind:value`.** The API mirrors React (`value` +
  `onValueChange`). A bindable `value` is the idiomatic Svelte addition.
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
- **Not ported from Instrument:** everything beyond these four components — prose,
  forms, tables, overlays, the agent components, print styles, the contrast gate
  and the component registry. The gates are the most valuable of those.
- **`onValueChange` fires when the user re-picks the already-selected value.**
  Intent semantics, not value-diff semantics. Correct for controlled components,
  mildly surprising otherwise.
- **Some config props are read once, at construction.** `mode`, `orientation` and
  `removable` on ChipGroup (and the build prints `state_referenced_locally`
  warnings for them) are read at construction and ignored after mount, in all
  three adapters. Queued as its own task.
- **GGarry waives nine contrast failures** pending a palette decision. See
  Theme checks → What the first run found.
- **Instrument's other gates are not ported:** tap targets (`cmd/targets`),
  proportions (`cmd/proportion`), and the component registry (`cmd/registry`).
  Forced-colors behaviour is styled but not checked.
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
