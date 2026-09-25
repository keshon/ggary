import type { MenuEntry } from '@ggary/core/menu'
import type { MenubarMenu } from '@ggary/core/menubar'

/** The menus the Actions pages share: a document's actions, and a view menu whose toggles the owner holds. */

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
  { value: 'archive', label: 'Archive', disabled: true },
  { type: 'separator' },
  { value: 'docs', label: 'Open the docs', href: '#/menu' },
  { type: 'separator' },
  { value: 'delete', label: 'Delete', destructive: true, shortcut: 'Del' },
]

/** What the view menu's toggles control. The owner holds it; the menu reports choices. */
export interface ViewState {
  grid: boolean
  rulers: boolean
  density: 'compact' | 'comfortable'
}

export const initialView: ViewState = { grid: true, rulers: false, density: 'comfortable' }

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

/** An application's menubar. `&` marks each menu's access key; the View menu is the view menu above. */
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
        { value: 'redo', label: 'Redo', shortcut: 'Ctrl+Y', disabled: true },
        { type: 'separator' },
        { value: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
        { value: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
        { value: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
      ],
    },
    { value: 'view', label: '&View', items: viewMenu(view) },
    { value: 'window', label: '&Window', disabled: true, items: [] },
    {
      value: 'help',
      label: '&Help',
      items: [
        { value: 'docs', label: 'Documentation', href: '#/menubar' },
        { value: 'about', label: 'About GGary' },
      ],
    },
  ]
}
