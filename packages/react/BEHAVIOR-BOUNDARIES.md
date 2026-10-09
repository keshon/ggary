# React behavior boundaries

Base UI supplies standard overlay, focus, selection and form-control primitives.
GGary retains visual design, public APIs and domain behavior. An attached DOM
listener is not itself a bridge: inspect the behavior it implements.

## Retained attached helpers

- CommandPalette: `attachPaletteHotkey` opens the palette from a global shortcut;
  `attachPaletteSource` handles asynchronous search. Base UI Dialog owns its overlay.
- Menubar: `attachMenubarKeys` supplies optional Alt mnemonics and F10 activation.
  Base UI owns ordinary menu navigation. The mnemonic adapter currently invokes
  the trigger through a synthetic ArrowDown event; this is explicit integration
  debt, not a second keyboard-navigation backend.
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
exports intentionally remain source-based. This check does not publish packages
or replace browser interaction coverage.
