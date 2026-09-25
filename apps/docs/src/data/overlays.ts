import type { SelectItem } from '@ggary/core/select'
import type { ToastOptions } from '@ggary/core/toast'

export const roles: SelectItem[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
]

/** Clauses long enough to make a dialog's body scroll. */
export const terms = [
  'Using the service. You may use the service to try components. Nothing you type here leaves your browser.',
  'Accounts. There are none. Every page starts fresh, and closing the tab forgets everything.',
  'Content. Text you enter in a field stays in that field until you reload the page.',
  'Availability. The service runs on your machine, so it is available exactly when your machine is.',
  'Changes. Components change as the kit grows. A page that worked yesterday may look different today.',
  'Themes. Switching theme or mode changes how things look, never what they do.',
  'Accessibility. Every component is expected to work with a keyboard and a screen reader.',
  'Keyboard. Tab moves through the dialog and never leaves it while it is open.',
]

/** One toast of each kind, kept until closed. */
export const toasts: ToastOptions[] = [
  { tone: 'ok', title: 'The run is queued', text: 'worldbox-1 · seventh in the queue', duration: 0 },
  { tone: 'error', title: 'Could not send', text: 'The network is unavailable. Attempt 3 of 5.', duration: 0 },
  { tone: 'warn', title: 'Disk almost full', text: '92% of 512 GB used', duration: 0 },
  { tone: 'running', title: 'Exporting… 40%', duration: 0 },
  { title: 'Task deleted', action: { label: 'Undo', onClick: () => {} }, duration: 0 },
]
