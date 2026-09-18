import type { PaletteCommand } from '../../packages/core/src/components/command-palette'

/** The commands in every palette test: two groups, a level of its own, one disabled. */
export const commands: PaletteCommand[] = [
  { id: 'new-deal', label: 'New deal', group: 'Actions', shortcut: 'N', keywords: ['create', 'add'] },
  {
    id: 'move',
    label: 'Move card',
    group: 'Actions',
    placeholder: 'Move to which column?',
    children: [
      { id: 'move:new', label: 'New' },
      { id: 'move:talks', label: 'In talks' },
      { id: 'move:won', label: 'Won' },
    ],
  },
  { id: 'export', label: 'Export to CSV', group: 'Actions', disabled: true },
  { id: 'go-leads', label: 'Leads', group: 'Go to', keywords: ['contacts'] },
  { id: 'go-settings', label: 'Preferences', group: 'Go to', keywords: ['settings', 'options'], description: 'Theme, language, notifications' },
  { id: 'go-reports', label: 'Reports', group: 'Go to' },
]
