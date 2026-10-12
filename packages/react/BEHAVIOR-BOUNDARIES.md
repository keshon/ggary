# React behavior boundaries

Base UI supplies standard overlay, focus, selection and form-control primitives.
GGary retains visual design, public APIs and domain behavior. An attached DOM
listener is not itself a bridge: inspect the behavior it implements.

## Retained attached helpers

- CommandPalette: `attachPaletteHotkey` opens the palette from a global shortcut;
  `attachPaletteSource` handles asynchronous search. Base UI Dialog owns its overlay.
- Menubar: `attachMenubarKeys` supplies optional Alt mnemonics and F10 activation.
  Base UI owns ordinary menu navigation. Mnemonic activation uses the native trigger button activation API. Repeating
  a shortcut focuses the first enabled row without reopening the menu. No
  synthetic keyboard event is dispatched.
- FileDrop: `attachFileDrop` handles dropped files; native selection and Base UI
  Field registration remain separate responsibilities.
- Kanban/Gantt: drag helpers implement domain moves and scheduling edits.
- Log: `attachLogTail` follows appended output.
- Ribbon: `attachRibbonScrollers` manages horizontal wheel scrolling and fades.
- Textarea: `attachAutosize` measures content height.
- Anchor/Shell: media and scroll observers manage responsiveness/current section;
  Base UI Popover/Dialog owns floating-panel and mobile-drawer interaction.

## Custom components are deliberate

Tree traversal, table/grid navigation, transfer/tree selection, calendar/time
parsing, pagination and drag/drop widgets remain GGary responsibilities. This
boundary audit does not certify their full accessibility or correctness.
SegmentedControl uses native radios; replacing their browser keyboard behavior
with a generic toggle group would change its semantics. Presentation-only
components and layout containers do not need a headless interaction backend.

## Release gates

Packages currently export TypeScript source and are private version 0.0.0.
A successful docs build is not evidence of a distributable package. Compiled
JavaScript/declarations, component subpaths, declared dependencies, stylesheet
entry points and a clean consumer installation still need verification.
React-only FieldControl and ToolbarButton exports are intentional. React toast
queues and core/Svelte queues have separate lifecycles and must not be mixed.

## Building isolated package candidates

Run `npm run smoke:react-packages` to build compiled candidates and verify packed
tarballs outside workspace resolution. Output lives under
`node_modules/.cache/react-release/<build-id>`; `latest.json` identifies the last
build and `smoke-result.json` records a successful consumer check. Development
exports intentionally remain source-based. The smoke also runs representative form, toolbar and nested-overlay interactions
in headless Chrome against the consumer production build. It does not publish
packages or certify every component/browser combination. Set GG_BROWSER_CHANNEL
to use another installed Playwright browser channel.

## Inventory and CSS payload

`component-inventory.json` covers all 96 React component directories. It records
34 direct Base UI importers plus internal composition dependencies. Directory
counts are not counts of public components, and indirect wrappers also use Base
UI. Decisions describe ownership, not full accessibility certification. Run
`npm run audit:react-foundation` to refresh the inventory and CSS measurements.

Measured minified full-theme CSS: 371,718 bytes / 44,113 gzip. Structure alone:
79,644 / 10,744; icons alone: 42,157 / 4,296. These independent compressed totals
are not additive. The full theme imports structure, tokens, icons, reset, all
component styles and forced-color rules. Component-level JavaScript imports do
not tree-shake that CSS. Retain this reliable default for now. Any optional
subset entry must include an explicit dependency map for shared anatomy,
composites, focus and forced-color rules before claiming safe per-component CSS.

## Candidate policy and CI

`npm run verify:react` runs the sequential local release checks. GitHub Actions
runs the same command on PRs and main/codex branches under Node 24 and installed
Chromium. CI also checks inventory drift and retains candidate artifacts for
seven days, including browser screenshots when available. No publish permission
or publishing job is configured. Compiled candidate manifests stay private and
pin internal GGary dependencies to their sibling package versions. Source
manifests remain development entry points. A publishable version/registry policy
is a separate decision; passing this gate does not publish anything.
