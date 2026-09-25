import { createToaster, type ToastOptions } from '@ggary/core/toast'
import { toasts } from '../../data/overlays'

/** The page's own queue, not the app's: it opens holding one toast of each kind. */
export function pageToaster() {
  const queue = createToaster({ max: toasts.length })
  for (const kind of KINDS) queue.toast(kind.toast)
  return queue
}

/** Each kind's specimen: the words that make it, and the toast it shows again. */
export const KINDS: { label: string; toast: ToastOptions }[] = ['tone="ok", text', 'tone="error", text', 'tone="warn", text', 'tone="running"', 'action'].map((label, index) => ({
  label,
  // Its own id: shown again, it comes back rather than piling up.
  toast: { ...toasts[index], id: `kind-${index}` },
}))
