import type { KanbanEvent } from './index'

/**
 * The board's pointer: a card dragged from one place to another, and the
 * cards sliding into their new places as it goes. DOM only — the machine
 * holds where the card is; this reads where the pointer is.
 *
 * A mouse or a pen drags once it has moved a few pixels, so a press still
 * opens the card. A finger holds first: a quick swipe scrolls the page as
 * it always did, and a card held still for a moment comes up and follows.
 */

const CARD = '[data-scope="kanban"][data-part="card"]'
const LIST = '[data-scope="kanban"][data-part="list"]'
const COLUMN = '[data-scope="kanban"][data-part="column"]'
/** A press on these inside a card is theirs, not a drag's. */
const INTERACTIVE = 'a[href], button, input, select, textarea, summary, [role="button"], [role="checkbox"], [role="link"], [role="menuitem"]'

const DRAG_AFTER = 4
const TOUCH_HOLD = 300
const TOUCH_SLOP = 8
const EDGE = 48
const EDGE_SPEED = 16
const SLIDE = 160

const reducedMotion = (win: Window) => win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const cardsOf = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>(CARD)].filter((card) => !card.hasAttribute('data-drag-overlay'))

/**
 * Run `change` — a move the framework will render — and slide every card
 * from where it was drawn to where it lands. Measured again in the next
 * frame, after the framework has rendered and before the browser paints, so
 * nothing is seen in between.
 */
export function flipKanban(root: HTMLElement, change: () => void): void {
  const win = root.ownerDocument.defaultView
  if (!win || reducedMotion(win) || typeof Element.prototype.animate !== 'function') {
    change()
    return
  }
  // Where each card is drawn now, a slide in progress included.
  const before = new Map(cardsOf(root).map((card) => [card.dataset.card!, card.getBoundingClientRect()]))
  change()
  win.requestAnimationFrame(() => {
    for (const card of cardsOf(root)) {
      const was = before.get(card.dataset.card!)
      if (!was) continue
      for (const running of card.getAnimations()) if (running.id === 'gg-kanban-slide') running.cancel()
      const now = card.getBoundingClientRect()
      const dx = was.left - now.left
      const dy = was.top - now.top
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue
      const slide = card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: SLIDE, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
      slide.id = 'gg-kanban-slide'
    }
  })
}

/** The copy of a card that follows the pointer: in the top layer where it can be, above everything. */
function overlayOf(card: HTMLElement, root: HTMLElement, rect: DOMRect): HTMLElement {
  const copy = card.cloneNode(true) as HTMLElement
  for (const element of [copy, ...copy.querySelectorAll('[id]')]) element.removeAttribute('id')
  copy.removeAttribute('tabindex')
  copy.removeAttribute('role')
  copy.removeAttribute('aria-labelledby')
  copy.removeAttribute('aria-describedby')
  copy.removeAttribute('aria-roledescription')
  copy.setAttribute('aria-hidden', 'true')
  copy.setAttribute('inert', '')
  copy.setAttribute('data-drag-overlay', '')
  copy.setAttribute('data-lifted', '')
  copy.removeAttribute('data-dragging')
  Object.assign(copy.style, {
    position: 'fixed',
    inset: 'auto',
    left: '0',
    top: '0',
    margin: '0',
    inlineSize: `${rect.width}px`,
    blockSize: `${rect.height}px`,
    boxSizing: 'border-box',
    color: 'inherit',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: '2147483647',
    transform: `translate(${rect.left}px, ${rect.top}px)`,
  })
  root.append(copy)
  if (typeof copy.showPopover === 'function') {
    copy.setAttribute('popover', 'manual')
    copy.showPopover()
  }
  return copy
}

export interface KanbanDragOptions {
  /** The card a drag may start on. Default: every card. */
  canDrag?: (card: string) => boolean
}

/**
 * Let cards be dragged. Call it once the board is rendered; it returns the
 * cleanup. `send` is the board machine's.
 */
export function attachKanbanDrag(root: HTMLElement, send: (event: KanbanEvent) => void, options: KanbanDragOptions = {}): () => void {
  const doc = root.ownerDocument
  const win = doc.defaultView!

  let press: { id: number; card: HTMLElement; key: string; x: number; y: number; touch: boolean; held: boolean; timer?: number } | null = null
  let drag: {
    id: number
    key: string
    overlay: HTMLElement
    /** Where the pointer holds the card, from its corner. */
    grip: { x: number; y: number }
    x: number
    y: number
    frame: number
    /** Where the card was last shown: a move over the same place is no change, and must not restart the slides. */
    at: string
  } | null = null

  const onPointerDown = (event: PointerEvent) => {
    if (press || drag || event.button !== 0 || !event.isPrimary) return
    const target = event.target as Element | null
    const card = target?.closest<HTMLElement>(CARD)
    if (!card || !root.contains(card) || card.hasAttribute('data-drag-overlay')) return
    const inner = target!.closest(INTERACTIVE)
    if (inner && inner !== card && card.contains(inner)) return
    const key = card.dataset.card
    if (!key || (options.canDrag && !options.canDrag(key))) return
    const touch = event.pointerType === 'touch'
    press = { id: event.pointerId, card, key, x: event.clientX, y: event.clientY, touch, held: !touch }
    if (touch) {
      press.timer = win.setTimeout(() => {
        if (!press) return
        press.held = true
        start(press.x, press.y)
      }, TOUCH_HOLD)
    }
    win.addEventListener('pointermove', onPointerMove)
    win.addEventListener('pointerup', onPointerUp)
    win.addEventListener('pointercancel', onPointerCancel)
  }

  const start = (x: number, y: number) => {
    if (!press) return
    const { card, key, id } = press
    const rect = card.getBoundingClientRect()
    const overlay = overlayOf(card, root, rect)
    drag = { id, key, overlay, grip: { x: press.x - rect.left, y: press.y - rect.top }, x, y, frame: 0, at: '' }
    press = null
    send({ type: 'LIFT', card: key, by: 'pointer' })
    follow()
    drag.frame = win.requestAnimationFrame(tick)
  }

  const follow = () => {
    if (!drag) return
    drag.overlay.style.transform = `translate(${drag.x - drag.grip.x}px, ${drag.y - drag.grip.y}px)`
  }

  /** The place under the pointer: its column, and where among that column's other cards. */
  const placeUnder = (x: number, y: number) => {
    const under = doc.elementFromPoint(x, y)
    const column = under?.closest<HTMLElement>(COLUMN)
    const list = under?.closest<HTMLElement>(LIST) ?? column?.querySelector<HTMLElement>(LIST)
    if (!list || !root.contains(list) || !list.dataset.column) return null
    // Layout positions, not drawn ones: a card in the middle of a slide is where it is going.
    const top = list.getBoundingClientRect().top - list.scrollTop
    const others = [...list.querySelectorAll<HTMLElement>(CARD)].filter((card) => card.dataset.card !== drag!.key)
    // The list is the cards' offset parent (the structure layer positions it).
    const index = others.findIndex((card) => y < top + card.offsetTop + card.offsetHeight / 2)
    return { column: list.dataset.column, index: index === -1 ? others.length : index }
  }

  const aim = () => {
    if (!drag) return
    const to = placeUnder(drag.x, drag.y)
    const at = to && `${to.column}|${to.index}`
    if (!to || at === drag.at) return
    drag.at = at!
    flipKanban(root, () => send({ type: 'PLACE', to }))
  }

  /** Near an edge of the board it scrolls toward it; near a column's top or bottom, the column does; near the window's, the page. */
  const tick = () => {
    if (!drag) return
    const box = root.getBoundingClientRect()
    let moved = false
    const speed = (distance: number) => Math.ceil(EDGE_SPEED * (1 - Math.max(0, distance) / EDGE))
    if (drag.x < box.left + EDGE && root.scrollLeft > 0) {
      root.scrollLeft -= speed(drag.x - box.left)
      moved = true
    } else if (drag.x > box.right - EDGE && root.scrollLeft + root.clientWidth < root.scrollWidth) {
      root.scrollLeft += speed(box.right - drag.x)
      moved = true
    }
    // A column that scrolls its own cards follows the pointer to its top and bottom.
    const list = doc.elementFromPoint(drag.x, drag.y)?.closest<HTMLElement>(LIST)
    if (list && root.contains(list) && list.scrollHeight > list.clientHeight) {
      const lane = list.getBoundingClientRect()
      if (drag.y < lane.top + EDGE && list.scrollTop > 0) {
        list.scrollTop -= speed(drag.y - lane.top)
        moved = true
      } else if (drag.y > lane.bottom - EDGE && list.scrollTop + list.clientHeight < list.scrollHeight) {
        list.scrollTop += speed(lane.bottom - drag.y)
        moved = true
      }
    }
    if (drag.y < EDGE && win.scrollY > 0) {
      win.scrollBy(0, -speed(drag.y))
      moved = true
    } else if (drag.y > win.innerHeight - EDGE) {
      win.scrollBy(0, speed(win.innerHeight - drag.y))
      moved = true
    }
    if (moved) aim()
    drag.frame = win.requestAnimationFrame(tick)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (press && event.pointerId === press.id) {
      const distance = Math.hypot(event.clientX - press.x, event.clientY - press.y)
      if (press.touch && !press.held) {
        // A finger that moves before the hold is scrolling: let it.
        if (distance > TOUCH_SLOP) release()
        return
      }
      if (distance < DRAG_AFTER) return
      start(event.clientX, event.clientY)
    }
    if (!drag || event.pointerId !== drag.id) return
    drag.x = event.clientX
    drag.y = event.clientY
    follow()
    aim()
  }

  const onPointerUp = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.id) {
      drag.x = event.clientX
      drag.y = event.clientY
      aim()
      finish('DROP')
      // The press that ends a drag is not a press on the card.
      win.addEventListener('click', swallow, { capture: true, once: true })
      win.setTimeout(() => win.removeEventListener('click', swallow, { capture: true }), 0)
      return
    }
    release()
  }

  const onPointerCancel = () => {
    if (drag) finish('CANCEL')
    else release()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (drag && event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      finish('CANCEL')
    }
  }

  /** While a finger drags, the page must not scroll under it. */
  const onTouchMove = (event: TouchEvent) => {
    if (drag || press?.held) event.preventDefault()
  }

  const swallow = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const finish = (how: 'DROP' | 'CANCEL') => {
    if (!drag) return
    const { overlay, key, frame } = drag
    drag = null
    win.cancelAnimationFrame(frame)
    unlisten()
    flipKanban(root, () => send({ type: how }))
    // The copy flies to where the card landed, and gives way to it. A frame
    // that never comes (a hidden tab draws none) must not leave it standing.
    let card: HTMLElement | undefined
    let over = false
    const done = () => {
      if (over) return
      over = true
      win.clearTimeout(fallback)
      if (card) card.style.visibility = ''
      overlay.remove()
    }
    const fallback = win.setTimeout(done, SLIDE + 250)
    win.requestAnimationFrame(() => {
      if (over) return
      card = cardsOf(root).find((candidate) => candidate.dataset.card === key)
      if (!card || reducedMotion(win) || typeof overlay.animate !== 'function') return done()
      const to = card.getBoundingClientRect()
      card.style.visibility = 'hidden'
      const landing = overlay.animate([{ transform: overlay.style.transform }, { transform: `translate(${to.left}px, ${to.top}px)` }], { duration: SLIDE, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
      landing.finished.then(done, done)
    })
  }

  const release = () => {
    if (press?.timer !== undefined) win.clearTimeout(press.timer)
    press = null
    if (!drag) unlisten()
  }

  const unlisten = () => {
    win.removeEventListener('pointermove', onPointerMove)
    win.removeEventListener('pointerup', onPointerUp)
    win.removeEventListener('pointercancel', onPointerCancel)
  }

  root.addEventListener('pointerdown', onPointerDown)
  doc.addEventListener('keydown', onKeyDown, true)
  root.addEventListener('touchmove', onTouchMove, { passive: false })
  return () => {
    root.removeEventListener('pointerdown', onPointerDown)
    doc.removeEventListener('keydown', onKeyDown, true)
    root.removeEventListener('touchmove', onTouchMove)
    if (drag) {
      drag.overlay.remove()
      win.cancelAnimationFrame(drag.frame)
      drag = null
    }
    release()
    unlisten()
  }
}
