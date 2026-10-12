import { tick } from 'svelte'

/** ArrowUp opens on the last item after Bits finishes its initial-focus task. */
export async function focusLastMenuItem(id: string, stillCurrent: () => boolean) {
  await tick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  if (!stillCurrent()) return
  const rows = document.getElementById(id)?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])')
  rows?.[rows.length - 1]?.focus()
}
