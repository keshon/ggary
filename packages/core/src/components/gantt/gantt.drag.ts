import type { GanttEdge, GanttEvent } from './gantt.types'

/**
 * A Gantt bar under a pointer: its body moves it, its ends resize it, in whole
 * days. DOM only — the machine holds the dates; this turns pixels into days,
 * reading a day's width off the page, so it holds at whatever width the theme
 * gives one.
 */

const BAR = '[data-scope="gantt"]:is([data-part="bar"], [data-part="milestone"])[data-editable]'
const SCHEDULE = '[data-scope="gantt"][data-part="schedule"]'
const DRAG_AFTER = 3

/** A day's width in pixels: a schedule cell's width over the days it shows. */
function dayWidth(root: HTMLElement): number {
  const cell = root.querySelector<HTMLElement>(SCHEDULE)
  const days = Number(root.style.getPropertyValue('--gg-gantt-days')) || 1
  return cell ? cell.getBoundingClientRect().width / days : 1
}

export function attachGanttDrag(root: HTMLElement, send: (event: GanttEvent) => void): () => void {
  const doc = root.ownerDocument
  const win = doc.defaultView!
  let press: { id: number; task: string; edge: GanttEdge; x: number; day: number; dragging: boolean } | null = null

  const onPointerDown = (event: PointerEvent) => {
    if (press || event.button !== 0 || !event.isPrimary) return
    const target = event.target as Element | null
    const bar = target?.closest<HTMLElement>(BAR)
    if (!bar || !root.contains(bar) || !bar.dataset.task) return
    const part = target!.closest('[data-part]')?.getAttribute('data-part')
    const edge: GanttEdge = part === 'bar-start' ? 'start' : part === 'bar-end' ? 'end' : 'move'
    press = { id: event.pointerId, task: bar.dataset.task, edge, x: event.clientX, day: dayWidth(root), dragging: false }
    // The page must not select text while a bar is dragged across it.
    event.preventDefault()
    bar.closest<HTMLElement>(SCHEDULE)?.focus({ preventScroll: true })
    win.addEventListener('pointermove', onPointerMove)
    win.addEventListener('pointerup', onPointerUp)
    win.addEventListener('pointercancel', onPointerCancel)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!press || event.pointerId !== press.id) return
    const dx = event.clientX - press.x
    if (!press.dragging && Math.abs(dx) < DRAG_AFTER) return
    press.dragging = true
    root.setAttribute('data-dragging', press.edge)
    send({ type: 'DRAG', task: press.task, edge: press.edge, offset: Math.round(dx / press.day) })
  }

  const finish = (how: 'COMMIT' | 'CANCEL') => {
    if (!press) return
    const dragged = press.dragging
    press = null
    root.removeAttribute('data-dragging')
    win.removeEventListener('pointermove', onPointerMove)
    win.removeEventListener('pointerup', onPointerUp)
    win.removeEventListener('pointercancel', onPointerCancel)
    if (!dragged) return
    send({ type: how })
    // The release that ends a drag is not a press on the bar.
    const swallow = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    win.addEventListener('click', swallow, { capture: true, once: true })
    setTimeout(() => win.removeEventListener('click', swallow, { capture: true }), 0)
  }

  const onPointerUp = (event: PointerEvent) => {
    if (press && event.pointerId === press.id) finish('COMMIT')
  }
  const onPointerCancel = () => finish('CANCEL')
  const onKeyDown = (event: KeyboardEvent) => {
    if (press?.dragging && event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      finish('CANCEL')
    }
  }

  root.addEventListener('pointerdown', onPointerDown)
  doc.addEventListener('keydown', onKeyDown, true)
  return () => {
    root.removeEventListener('pointerdown', onPointerDown)
    doc.removeEventListener('keydown', onKeyDown, true)
    if (press) finish('CANCEL')
  }
}
