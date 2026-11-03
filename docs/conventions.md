# Conventions

## Development checks

Use the source workspace described in [Using GGary](running.md). Commands run
from the repository root:

```bash
npm run test:fast
npm run typecheck
npm run check:themes
```

`test:fast` runs machine, source-contract, jsdom and Svelte SSR projects.
`typecheck` runs TypeScript and svelte-check. Theme checking runs the checks
package against generated assets and CSS contracts. Each command builds assets
first; do not hand-edit generated icon/theme output as its source of truth.

`npm test` additionally runs the browser project. It defaults to installed
Chrome through Playwright; `GG_BROWSER_CHANNEL` selects another configured
channel. Browser availability is separate from a successful Node/jsdom run.
See [vitest.config.ts](../vitest.config.ts) for current project boundaries.

## Rule labels

Enforced rules name an existing guard/check and its limits. Invariants name a
failure review must prevent; practices guide organization. Do not claim that a
source-shape test proves runtime behavior or that jsdom proves browser behavior.

## Changing a component

- **Invariant:** identify the actual interaction owner before changing behavior.
  Do not add a parallel selection/focus/overlay owner around Base UI, Bits UI or
  a native control. Check the adapter and its shared utilities first.
- **Invariant:** preserve the component's anatomy/state attributes expected by
  structure and theme CSS. A component can render successfully while losing
  styling, focus or disabled-state behavior.
- **Practice:** extend the paired sandbox examples with the affected state,
  interaction or composition. Keep navigation in `apps/docs/src/manifest.ts`.
- **Practice:** choose the existing machine, contract, DOM, SSR or browser tests
  that exercise the changed boundary. Use a browser for focus/overlay/form
  behavior that a shim cannot establish.
- **Practice:** keep structural mechanics in `packages/structure` and appearance
  in the theme; use token contracts instead of duplicating literal styles.

Existing `tests/*.contract.test.ts` check package/anatomy/style relationships;
`tests/*.machine.test.ts` exercise pure state logic; `tests/*.dom.test.ts`,
`tests/*.ssr.test.ts` and `tests/*.browser.test.ts` cover their respective
execution environments. Inspect the concrete test before stating that a
particular accessibility or framework-parity property is enforced.

## Candidate packages

```bash
npm run smoke:react-packages
npm run smoke:svelte-packages
```

Each builds isolated private candidates and installs them in a temporary app.
Artifacts and reports are staged under `node_modules/.cache/react-release` or
`node_modules/.cache/svelte-release`. They are not registry releases.
`build:react-packages` and `build:svelte-packages` only stage candidates;
`verify:react` and `verify:svelte` run their broader foundation gates.

For changes to public exports, types, dependencies or styles, use the relevant
installed-consumer check. Workspace tests alone can pass while packed imports
or declarations are broken. Smoke scripts can install temporary dependencies
and launch a browser; review their prerequisites before using them offline.

## Documentation

The README owns product orientation and first launch. [Using GGary](running.md)
owns integration examples and source/candidate boundaries;
[Architecture](architecture.md) owns packages, interaction ownership and CSS
contracts. This file owns development and checks. The paired sandbox examples
are the detailed component usage reference.

Use the repository's [docs-pattern skill](../.agents/skills/docs-pattern/SKILL.md).
Preserve useful project vocabulary and demos. Verify package exports, commands
and framework-specific APIs against source. Do not turn development package
names into an implied public registry installation instruction, or label all
components as shared machines when their backends differ.
