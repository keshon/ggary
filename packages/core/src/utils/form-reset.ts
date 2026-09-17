/**
 * Call `callback` after the form around `element` has been reset.
 *
 * AFTER, not on the event: `reset` is dispatched before the browser restores
 * the controls (it can be cancelled), so a listener that read the controls then
 * would read the old state. A task later the reset has been applied. Not a
 * microtask — for a click on a reset button, microtasks run between the
 * listener and the restore, still too early.
 *
 * Why components need this at all: a native reset changes values and checked
 * states without firing `input` or `change`, so everything a component derived
 * from them — its own state, data-state, a shown error — goes stale.
 */
export function onFormReset(element: Element | null | undefined, callback: () => void): () => void {
  const form = element?.closest('form')
  if (!form) return () => {}
  let timer: ReturnType<typeof setTimeout> | undefined
  const listener = (event: Event) => {
    if (event.defaultPrevented) return
    clearTimeout(timer)
    timer = setTimeout(callback)
  }
  form.addEventListener('reset', listener)
  return () => {
    form.removeEventListener('reset', listener)
    clearTimeout(timer)
  }
}
