# Architecture

GGary separates framework rendering, interaction ownership and CSS contracts.
Shared core machines/utilities serve some components directly. Others adapt
external interaction primitives: React uses Base UI and Svelte uses Bits UI.
Composite widgets can combine those primitives with GGary policy and native
HTML controls. A single universal state machine is not the current architecture.

## Package responsibilities

| Package | Responsibility |
|---|---|
| `packages/core` | Shared machines, prop normalization, DOM anatomy, focus/form utilities |
| `packages/react` | React components, provider integration and Base UI/native/composite adapters |
| `packages/svelte` | Svelte components, snippets, provider integration and Bits UI/native/composite adapters |
| `packages/icons` | Icon sources, compiler and generated assets |
| `packages/structure` | Shared structural CSS and part/state contracts |
| `packages/theme-ggarry` | Theme tokens, component styling, forced colors and motion rules |
| `packages/checks` | Theme/structure/token verification |
| `apps/docs` | Paired component specimens and sandbox navigation |
| `scripts` | Isolated package builds, installed-consumer checks and foundation verification |

## Component interaction ownership

The Button adapters use `@ggary/core/button` and framework-specific prop
normalizers. React's Dialog wraps `@base-ui/react/dialog`; Svelte's wraps the
Bits UI Dialog. The GGary API and part attributes adapt those backends to the
kit's presentation and application policies.

The sandbox's [React implementation map](../apps/docs/src/react/implementation.ts)
describes component-specific ownership. It distinguishes external primitives,
native HTML, GGary behavior and composite boundaries. Source imports and the
component implementation remain authoritative when changing a widget.

Framework conventions differ: events, refs, children/snippets and composition
must be evaluated in the actual adapter. Shared visual contracts do not imply
that the two frameworks expose byte-identical props or internal behavior.

## DOM and styling contracts

Components expose `data-scope`, `data-part` and state attributes so structure
and themes can target semantic parts rather than generated class names.
Backend-specific attributes may identify an adapted primitive. Check each
component's anatomy before adding or moving a part.

The complete theme defines CSS layers in this order:

```text
gg.tokens -> gg.structure -> gg.base -> gg.components -> gg.forced -> gg.motion
```

Tokens include generated values and the public variable contract; structure
provides shared mechanics. Component CSS supplies appearance/behavioral styling;
forced-color and reduced-motion behavior are verified by their relevant checks.
Application styles outside layers have normal cascade precedence over these
layered rules. See the [theme entry point](../packages/theme-ggarry/src/index.css).

## Source workspace and distribution candidates

Workspace manifests export TypeScript/Svelte source and remain private. Asset
builds generate icon/theme files before tests or sandbox use. Candidate builders
stage compiled packages separately under `node_modules/.cache/`, adjusting
exports for distribution rather than modifying workspace source manifests.

Smoke scripts install that package set in a temporary consumer and check
framework builds, types and selected browser/SSR behavior. This boundary catches
failures that workspace resolution can hide. It does not publish or establish
stable release compatibility. See [Conventions](conventions.md#candidate-packages).

## Sandbox and verification

`apps/docs/src/manifest.ts` owns page navigation. Each component page has paired
React/Svelte examples under `apps/docs/src/pages/`. The sandbox's mode persistence
belongs to the application, separate from component state.

Vitest projects separate pure machine tests, source contracts, jsdom adapters,
Svelte SSR and real browser behavior. jsdom shims model missing APIs and do not
prove actual browser focus/overlay behavior. Testing and extension rules are in
[Conventions](conventions.md).
