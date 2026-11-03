# GGary

**A UI kit for React and Svelte, built around a shared core.**

GGary is a component library for building application interfaces. It provides
React 19 and Svelte 5 components with shared DOM contracts, design tokens and
core utilities. Some components use the shared core directly; interaction-heavy
components also build on Base UI for React and Bits UI for Svelte.

One component model. Two framework adapters. One visual language.

## Components

Components cover application interfaces, from basic controls to complex data views.

**Actions and inputs**
Button, ButtonGroup, Input, Select, Combobox, DatePicker, TimePicker, Checkbox, Switch, RadioGroup, Slider, FileDrop and more.

**Navigation and layout**
Tabs, Breadcrumbs, Nav, Pagination, Steps, Toolbar, Grid, Stack, Split, Rail, Shell and more.

**Overlays and feedback**
Dialog, Sheet, Popover, Tooltip, Toast, Menu, ContextMenu, Banner, EmptyState, Skeleton and more.

**Data and application UI**
DataGrid, Table, Kanban, Gantt, CommandPalette, Timeline, Tree, Calendar, Form, CodeBlock, Diff, Log, Queue and more.

See the components in the sandbox:

* React: `npm run dev` → `/react.html`
* Svelte: `npm run dev` → `/svelte.html`

Both demos use the same component library and theme.

## Design

GGary separates component behaviour from rendering and appearance.

Its visual language uses depth by role. Page content stays flat, controls use
shallow tactile depth, selection tracks are recessed, and floating surfaces are
elevated. Motion follows the same hierarchy, with component-specific transitions
and reduced-motion behavior. Theme tokens and CSS define the actual values.

* **Shared contracts.** Core utilities and DOM/state contracts keep presentation
  coherent across adapters. Backend ownership depends on the component.
* **Explicit DOM contracts.** Components expose `data-scope`, `data-part`, and state attributes. Styling does not depend on generated class names.
* **Token-based styling.** Components consume design tokens rather than hardcoded visual values.
* **Intent-based variants.** Component APIs describe what an action means, not how it should look.
* **CSS without shadow DOM.** Application styles, theming, and SSR remain straightforward.
* **Accessibility.** Keyboard interaction, focus management, forced-colour support, and reduced-motion behaviour are part of the implementation.

The architecture is designed to keep behaviour consistent across frameworks without hiding the underlying markup.

## Packages

| Package               | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `@ggary/core`         | Framework-independent state machines and component contracts |
| `@ggary/react`        | React 19 components                                          |
| `@ggary/svelte`       | Svelte 5 components                                          |
| `@ggary/icons`        | Shared icon set and icon compiler                            |
| `@ggary/structure`    | Structural CSS shared across themes                          |
| `@ggary/theme-ggarry` | GGarry design tokens and component styles                    |

Use each framework's component examples for its native event/composition API.
The workspace packages are private development packages, not a published release
installation contract. See [Using GGary](docs/running.md).

## Try the components

```bash
git clone https://github.com/keshon/ggary.git
cd ggary
npm install
npm run dev
```

Open the URL printed by Vite, then `/react.html` or `/svelte.html`. The sandbox
contains paired examples for each component. See [Using GGary](docs/running.md)
for React/Svelte imports, theme setup and local package boundaries.

## Documentation

| Guide | Contents |
|---|---|
| [Using GGary](docs/running.md) | Workspace setup, component examples, themes and consumer constraints |
| [Architecture](docs/architecture.md) | Shared contracts, adapter backends, CSS layers and package boundaries |
| [Conventions](docs/conventions.md) | Development checks, component changes and candidate package verification |

## Project status

GGary is under active development.

The current repository contains the component implementations, shared core, React and Svelte adapters, theme, sandbox, and test infrastructure.

The focus is on keeping the two framework implementations consistent while preserving the native conventions of each framework.

## License

[MIT](LICENSE) © Innokentiy Sokolov (Señor Mega / Big M)
