/**
 * Dragging a handle sideways changes a number input — the axis letter of a
 * NumberField. The step and the bounds are read from the input when the drag
 * starts, so they are always the current ones; Shift moves ten steps per
 * notch, Alt a tenth of one.
 */

/** Pixels of travel per step. One pixel per step made a value impossible to land on. */
export const SCRUB_PIXELS_PER_STEP = 2

export interface ScrubInput {
  start: number
  dx: number
  step: number
  min?: number
  max?: number
  shiftKey?: boolean
  altKey?: boolean
}

/** Decimal places of a step: 0.01 has two. */
const decimalsOf = (step: number) => {
  const text = String(step)
  if (text.includes('e-')) return Number(text.split('e-')[1])
  return (text.split('.')[1] ?? '').length
}

/**
 * The value a drag has reached. The float tail is cut at the precision the
 * modifiers allow: 0.1 + 0.2 is otherwise 0.30000000000000004.
 */
export function scrubValue({ start, dx, step, min, max, shiftKey, altKey }: ScrubInput): number {
  const multiplier = shiftKey ? 10 : altKey ? 0.1 : 1
  const notches = Math.trunc(dx / SCRUB_PIXELS_PER_STEP)
  let value = start + notches * step * multiplier
  if (min !== undefined && Number.isFinite(min)) value = Math.max(min, value)
  if (max !== undefined && Number.isFinite(max)) value = Math.min(max, value)
  const decimals = decimalsOf(step) + (altKey ? 1 : 0)
  return Number(value.toFixed(Math.min(decimals, 20)))
}

const bound = (input: HTMLInputElement, name: 'min' | 'max') => {
  const text = input.getAttribute(name)
  return text === null || text === '' ? undefined : Number(text)
}

/**
 * Write a value the way typing would: through the prototype's setter, which is
 * the one React watches, then an `input` event. A framework's controlled input
 * and `bind:value` see the change without knowing a drag made it.
 */
export function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (setter) setter.call(input, value)
  else input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * Attach the drag to a handle. `input` is read on every press, so an adapter
 * can attach before its input exists. A press that does not move focuses the
 * input, as a label would. A finished drag sends `change`, as a finished edit does.
 */
export function attachScrub(handle: HTMLElement, input: () => HTMLInputElement | null): () => void {
  const onPointerDown = (down: PointerEvent) => {
    const field = input()
    if (!field || field.disabled || field.readOnly || down.button !== 0) return
    down.preventDefault()
    const step = Number(field.getAttribute('step')) || 1
    const start = field.value === '' || !Number.isFinite(Number(field.value)) ? (bound(field, 'min') ?? 0) : Number(field.value)
    const min = bound(field, 'min')
    const max = bound(field, 'max')
    let moved = false
    try {
      handle.setPointerCapture(down.pointerId)
    } catch {
      // A synthetic pointer has no capture to take; the listeners below still work.
    }

    const onMove = (move: PointerEvent) => {
      const dx = move.clientX - down.clientX
      if (!moved && Math.abs(dx) < SCRUB_PIXELS_PER_STEP) return
      moved = true
      const next = String(scrubValue({ start, dx, step, min, max, shiftKey: move.shiftKey, altKey: move.altKey }))
      if (next !== field.value) setInputValue(field, next)
    }
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      handle.removeEventListener('pointercancel', onUp)
      if (moved) field.dispatchEvent(new Event('change', { bubbles: true }))
      else field.focus()
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
    handle.addEventListener('pointercancel', onUp)
  }
  handle.addEventListener('pointerdown', onPointerDown)
  return () => handle.removeEventListener('pointerdown', onPointerDown)
}
