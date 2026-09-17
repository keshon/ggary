import type { ChipItem } from '@ggary/core/chip-group'
import type { SelectItem } from '@ggary/core/select'

export const frameworks: SelectItem[] = [
  { value: 'vanilla', label: 'Vanilla JS' },
  { value: 'react', label: 'React' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular (disabled)', disabled: true },
  { value: 'qwik', label: 'Qwik' },
  { value: 'astro', label: 'Astro' },
  { value: 'lit', label: 'Lit' },
  { value: 'preact', label: 'Preact' },
  { value: 'alpine', label: 'Alpine' },
  { value: 'htmx', label: 'htmx' },
]

export const tags: ChipItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'docs', label: 'Docs' },
  { value: 'devops', label: 'DevOps' },
  { value: 'legacy', label: 'Legacy (disabled)', disabled: true },
  { value: 'research', label: 'Research' },
  { value: 'infra', label: 'Infra' },
]

export const targets = [
  { href: '/index.html', label: 'vanilla', id: 'vanilla' },
  { href: '/react.html', label: 'react', id: 'react' },
  { href: '/svelte.html', label: 'svelte', id: 'svelte' },
]

export const roles: SelectItem[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
]

/** Placeholder clauses, long enough to make a dialog body scroll. */
export const terms = [
  'Using the service. You may use the sandbox to try components. Nothing you type here leaves your browser.',
  'Accounts. There are none. Every page starts fresh, and closing the tab forgets everything.',
  'Content. Text you enter in a field stays in that field until you reload the page.',
  'Availability. The sandbox runs on your machine, so it is available exactly when your machine is.',
  'Changes. Components change as the kit grows. A demo that worked yesterday may look different today.',
  'Feedback. If a component misbehaves, the conformance suite is where the fix belongs.',
  'Themes. Switching theme or mode changes how things look, never what they do.',
  'Accessibility. Every component is expected to work with a keyboard and a screen reader.',
  'Limits. Some behaviour can only be checked in a real browser; the test suite says which.',
  'Keyboard. Tab moves through the dialog and never leaves it while it is open.',
  'Scrolling. The page behind a modal dialog does not scroll; the dialog body does, when it has to.',
  'Nesting. A select opened inside a dialog closes first, on the first Escape.',
  'Returning. Closing a dialog puts focus back on the button that opened it.',
  'Forms. A form with method="dialog" closes it and reports which button submitted it.',
  'Sizes. Small, medium and large dialogs share one layout and differ only in width.',
  'Motion. Opening fades and rises a little, unless the system asks for reduced motion.',
  'Contrast. The title, description and close button pass the theme contrast gates.',
  'Stacking. A dialog is in the top layer, above every z-index, and no ancestor can clip it.',
  'Ending. Close this dialog with Escape, the close button, a click outside, or Accept.',
]
