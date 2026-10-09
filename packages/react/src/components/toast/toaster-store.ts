import { Toast as Primitive } from '@base-ui/react/toast'
import type { ToastOptions } from '@ggary/core/toast'

export interface ToasterStore {
  readonly manager: ReturnType<typeof Primitive.createToastManager<ToastOptions>>
  readonly max: number
  toast: (options: ToastOptions) => string
  update: (id: string, patch: Partial<ToastOptions>) => void
  dismiss: (id?: string) => void
  /** Private provider lifecycle; buffers commands before the region mounts, not toast timers/state. */
  attach: () => () => void
}
let serial = 0
export function createToaster({ max = 4 }: { max?: number } = {}): ToasterStore {
  const manager = Primitive.createToastManager<ToastOptions>()
  let mounted = false
  const pending: Array<() => void> = []
  const dispatch = (command: () => void) => { if (mounted) command(); else pending.push(command) }
  const queue: ToasterStore = {
    manager, max,
    toast(options) {
      const id = options.id ?? `gg-react-toast-${++serial}`
      dispatch(() => manager.add({ id, title: options.title, description: options.text, type: options.tone,
        priority: options.tone === 'error' ? 'high' : 'low', timeout: options.duration ?? (options.tone === 'error' ? 0 : 5000), data: options,
        actionProps: options.action ? { children: options.action.label, onClick: () => { options.action!.onClick(); queue.dismiss(id) } } : undefined }))
      return id
    },
    update(id, patch) {
      dispatch(() => manager.update(id, previous => {
        const next = { ...previous.data!, ...patch }
        return { title: next.title, description: next.text, type: next.tone, data: next,
          priority: next.tone === 'error' ? 'high' : 'low',
          ...(patch.duration !== undefined || patch.tone !== undefined && patch.tone !== previous.type
            ? { timeout: patch.duration ?? (next.tone === 'error' ? 0 : 5000) } : {}),
          actionProps: next.action ? { children: next.action.label, onClick: () => { next.action!.onClick(); queue.dismiss(id) } } : undefined }
      }))
    },
    dismiss: id => dispatch(() => manager.close(id)),
    attach() {
      if (mounted) throw new Error('Mount one Toaster per React toast queue.')
      mounted = true
      pending.splice(0).forEach(command => command())
      return () => { mounted = false }
    },
  }
  return queue
}
export const toaster = createToaster()
export const toast = (options: ToastOptions) => toaster.toast(options)
