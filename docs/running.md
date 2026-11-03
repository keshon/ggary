# Using GGary

GGary currently ships as private workspace packages with source exports.
The supported starting point in this checkout is the paired React/Svelte
sandbox. Do not assume an `npm install @ggary/react` from a registry installs
this repository's current implementation.

## Start the workspace

Use Node with native TypeScript stripping for the theme-check command
(`node packages/checks/src/cli.ts`), plus npm workspace support. Node 24 is a
suitable toolchain for that command; the repository does not declare a single
minimum Node version in `package.json`.

```bash
git clone https://github.com/keshon/ggary.git
cd ggary
npm install
npm run dev
```

`dev` builds icon/theme assets before launching Vite. Open its printed address,
then `/react.html` or `/svelte.html`. A source export alone is not a compiled
package; use a bundler that handles the corresponding framework and CSS.

## React example

With the workspace dependencies resolved and a React 19 app:

```tsx
import '@ggary/theme-ggarry'
import { Button } from '@ggary/react'

export default function Example() {
  return <Button emphasis="high" onClick={() => console.log('Saved')}>Save</Button>
}
```

The sandbox's [button example](../apps/docs/src/pages/button/Button.tsx) shows
sizes, loading, disabled and icon states. Its
[React entry point](../apps/docs/src/react/main.tsx) provides a complete mount
and application example. Importing the theme once is sufficient: it includes
structure, tokens and icon styling.

## Svelte example

With the workspace dependencies resolved and a Svelte 5 app:

```svelte
<script lang="ts">
  import '@ggary/theme-ggarry'
  import { Button } from '@ggary/svelte'
</script>

<Button emphasis="high" onclick={() => console.log('Saved')}>Save</Button>
```

See the paired [Svelte button example](../apps/docs/src/pages/button/Button.svelte)
and [entry point](../apps/docs/src/svelte/main.ts). More complex components use
framework-specific composition, including Svelte snippets. Consult the actual
paired examples rather than translating React prop names mechanically.

## Themes and color mode

`@ggary/theme-ggarry` is the supplied theme; `@ggary/structure` provides shared
structural CSS. Load the complete theme once instead of assembling its internal
layers in an application. `npm run assets` regenerates the theme/icon artifacts
used by source imports.

The theme follows the system when `<html>` has no `data-mode`. Set
`data-mode="light"` or `data-mode="dark"` for an explicit choice. The sandbox's
[theme module](../apps/docs/src/theme.ts) implements persistence and switching;
it is an example application policy, not a required component provider.

An application's unlayered styles can override layered theme rules. Review
focus visibility, disabled states, contrast, forced colors and reduced motion
after overrides; a compiling import does not establish accessible behavior.

## Using packages outside this workspace

The repository includes scripts that build private candidate packages and
install them into temporary React/Svelte consumers. Those checks verify
exports, declarations, builds and selected runtime behavior without publishing.
Use the [candidate package procedures](conventions.md#candidate-packages)
instead of treating source-workspace links as proof that a packed consumer works.

The candidates remain private and use development versions. There is no stable
public release/install contract documented here. Preserve the exact candidate
set when evaluating an external app; mixing workspace source exports with a
packed adapter does not reproduce the installed-consumer checks.

## Verify a change in an app

Open the relevant sandbox page and test a representative interaction with mouse
and keyboard. Check light/dark modes and any affected focus/form behavior.
For packaging or public API changes, also run the corresponding installed
consumer checks described in [Conventions](conventions.md). The sandbox checks
component examples; it is not a substitute for testing the integrating app.
