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
npm test         # 82 tests
npm run typecheck
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
  elements/   <gg-button>, <gg-chip>, <gg-chip-group>, <gg-select>
  react/      <Button>, <Chip>, <ChipGroup>, <Select>
  svelte/     <Button>, <Chip>, <ChipGroup>, <Select>
apps/sandbox/ the three demo pages
tests/        *.machine.test.ts (node, no DOM) + *.dom.test.ts (jsdom)
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

| Suite | Env | What it covers |
|---|---|---|
| `tests/select.machine.test.ts` | node | 23 tests. Every transition, pure, ~5ms. |
| `tests/chip-group.machine.test.ts` | node | 23 tests. Roving focus, selection, removal, typeahead. |
| `tests/button.dom.test.ts` | jsdom | 8 tests. Intent attributes; busy is not disabled. |
| `tests/select.dom.test.ts` | jsdom | 12 tests. Anatomy, ARIA wiring, keyboard, form, events. |
| `tests/chip-group.dom.test.ts` | jsdom | 16 tests. Roving tabindex, toolbar semantics, removal, focus landing. |

Behaviour tests against the machine are cheap and cover the hard part. The DOM
suite runs against one renderer (the custom element); the same assertions should
eventually run against React and Svelte too. That is the third test matrix you
have to budget for.

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
- **Icons are still baked into adapter markup.** Instrument draws glyphs with CSS
  masks; here both themes style the inline SVGs the adapters emit, so a theme
  cannot yet swap a glyph.
- **Not ported from Instrument:** everything beyond these four components — prose,
  forms, tables, overlays, the agent components, print styles, the contrast gate
  and the component registry. The gates are the most valuable of those.
- **`onValueChange` fires when the user re-picks the already-selected value.**
  Intent semantics, not value-diff semantics. Correct for controlled components,
  mildly surprising otherwise.
- No icons package, no Changesets, no docs site.

## Scope

"Like antd" is a scope trap. Antd is ~70 components with a decade of edge cases
and a full-time team. A genuinely useful 20-component kit is months of focused
work, and date pickers and data tables are each their own project. Build the
components your own projects need, keep the contract clean enough that the next
one is mechanical, and stop.

## Notes

npm workspaces, not pnpm. Turborepo only once builds get slow enough to annoy
you, not before.
