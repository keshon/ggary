import type { MenuEntry } from '@ggary/core/menu'

/** The split button's other ways to run. */
export const runMenu: MenuEntry[] = [
  { value: 'run-dry', label: 'Dry run' },
  { value: 'run-failed', label: 'Rerun failed only' },
  { type: 'separator' },
  { value: 'run-schedule', label: 'Schedule…' },
]
