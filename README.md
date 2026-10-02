# GGary

**A UI kit for React and Svelte, built around a shared core.**

GGary is a component library for building application interfaces. It provides React 19 and Svelte 5 components backed by the same framework-independent state machines, DOM contracts, and design tokens.

One component model. Two framework adapters. One visual language.

## Components

114 components covering application interfaces, from basic controls to complex data views.

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

* **Shared behaviour.** State machines live in a framework-independent core. React and Svelte provide their own rendering adapters.
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

The React and Svelte packages expose the same component API and component set.

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/keshon/ggary.git
cd ggary
npm install
```

Start the sandbox:

```bash
npm run dev
```

Run the checks:

```bash
npm test
npm run typecheck
npm run check:themes
```

For tests without a browser:

```bash
npm run test:fast
```

The test suite covers component behaviour, package contracts, framework conformance, browser behaviour, and theme constraints.

## Project status

GGary is under active development.

The current repository contains the component implementations, shared core, React and Svelte adapters, theme, sandbox, and test infrastructure.

The focus is on keeping the two framework implementations consistent while preserving the native conventions of each framework.

## License

[MIT](LICENSE) © Innokentiy Sokolov (Señor Mega / Big M)
