import type { ChipItem } from '@ggary/core/chip-group'
import type { MenuEntry } from '@ggary/core/menu'
import type { MenubarMenu } from '@ggary/core/menubar'
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

/** What the Menu demo's toggles control. The owner holds it; the menu reports choices. */
export interface ViewState {
  grid: boolean
  rulers: boolean
  density: 'compact' | 'comfortable'
}

export const initialView: ViewState = { grid: true, rulers: false, density: 'comfortable' }

export const documentMenu: MenuEntry[] = [
  { value: 'rename', label: 'Rename', shortcut: 'F2' },
  { value: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D' },
  {
    type: 'submenu',
    value: 'export',
    label: 'Export as',
    items: [
      { value: 'export-pdf', label: 'PDF' },
      { value: 'export-png', label: 'PNG image' },
      {
        type: 'submenu',
        value: 'export-code',
        label: 'Code',
        items: [
          { value: 'export-html', label: 'HTML' },
          { value: 'export-md', label: 'Markdown' },
        ],
      },
    ],
  },
  { value: 'archive', label: 'Archive (disabled)', disabled: true },
  { type: 'separator' },
  { value: 'docs', label: 'Open the docs', href: '#menu' },
  { type: 'separator' },
  { value: 'delete', label: 'Delete', tone: 'danger', shortcut: 'Del' },
]

export function viewMenu(view: ViewState): MenuEntry[] {
  return [
    {
      type: 'group',
      label: 'Show',
      items: [
        { type: 'checkbox', value: 'grid', label: 'Grid', checked: view.grid },
        { type: 'checkbox', value: 'rulers', label: 'Rulers', checked: view.rulers },
      ],
    },
    { type: 'separator' },
    {
      type: 'group',
      label: 'Density',
      items: [
        { type: 'radio', value: 'compact', label: 'Compact', checked: view.density === 'compact' },
        { type: 'radio', value: 'comfortable', label: 'Comfortable', checked: view.density === 'comfortable' },
      ],
    },
  ]
}

/** The owner's answer to a choice in the view menu. */
export function applyView(view: ViewState, value: string, checked?: boolean): ViewState {
  if (value === 'grid' || value === 'rulers') return { ...view, [value]: Boolean(checked) }
  if (value === 'compact' || value === 'comfortable') return { ...view, density: value }
  return view
}

export const describeView = (view: ViewState) =>
  `grid ${view.grid ? 'on' : 'off'}  rulers ${view.rulers ? 'on' : 'off'}  density ${view.density}`

/** An application menubar. `&` marks each menu's access key. The View menu is the view menu above. */
export function appMenus(view: ViewState): MenubarMenu[] {
  return [
    {
      value: 'file',
      label: '&File',
      items: [
        { value: 'new', label: 'New', shortcut: 'Ctrl+N' },
        { value: 'open', label: 'Open…', shortcut: 'Ctrl+O' },
        {
          type: 'submenu',
          value: 'recent',
          label: 'Open Recent',
          items: [
            { value: 'recent-atlas', label: 'atlas.md' },
            { value: 'recent-notes', label: 'notes.txt' },
            { type: 'separator' },
            { value: 'recent-clear', label: 'Clear Recent' },
          ],
        },
        { type: 'separator' },
        { value: 'save', label: 'Save', shortcut: 'Ctrl+S' },
        { value: 'save-as', label: 'Save As…', shortcut: 'Ctrl+Shift+S' },
        { type: 'separator' },
        { value: 'quit', label: 'Quit', shortcut: 'Ctrl+Q' },
      ],
    },
    {
      value: 'edit',
      label: '&Edit',
      items: [
        { value: 'undo', label: 'Undo', shortcut: 'Ctrl+Z' },
        { value: 'redo', label: 'Redo (nothing to redo)', shortcut: 'Ctrl+Y', disabled: true },
        { type: 'separator' },
        { value: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
        { value: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
        { value: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
      ],
    },
    { value: 'view', label: '&View', items: viewMenu(view) },
    { value: 'window', label: '&Window (disabled)', disabled: true, items: [] },
    {
      value: 'help',
      label: '&Help',
      items: [
        { value: 'docs', label: 'Documentation', href: '#menubar' },
        { value: 'about', label: 'About ggary-ui' },
      ],
    },
  ]
}
