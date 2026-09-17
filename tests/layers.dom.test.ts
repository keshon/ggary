import { afterEach, describe, expect, it, vi } from 'vitest'
import { openLayerCount, trackDismissable } from '../packages/core/src/utils/dismissable'

/** The dismiss stack on its own: which layer hears Escape and outside presses. */
const releases: (() => void)[] = []
afterEach(() => {
  releases.splice(0).forEach((release) => release())
  document.body.replaceChildren()
})

function layer(options: Parameters<typeof trackDismissable>[1] extends infer O ? Partial<O> : never = {}) {
  const node = document.createElement('div')
  node.append(document.createElement('button'))
  document.body.append(node)
  const onDismiss = vi.fn()
  const release = trackDismissable(node, { onDismiss, ...options })
  releases.push(release)
  return { node, onDismiss, release }
}

const escape = () => {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  document.body.dispatchEvent(event)
  return event
}
// jsdom has no PointerEvent constructor; the listener only reads the target.
const press = (target: Element) => target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))

describe('the dismiss stack', () => {
  it('Escape reaches only the layer opened last, and is consumed', () => {
    const below = layer()
    const above = layer()
    const pageHandler = vi.fn()
    document.body.addEventListener('keydown', pageHandler)

    const event = escape()
    expect(above.onDismiss).toHaveBeenCalledWith('escape')
    expect(below.onDismiss).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
    expect(pageHandler).not.toHaveBeenCalled()
  })

  it('once the top layer goes, the next Escape reaches the one below', () => {
    const below = layer()
    const above = layer()
    above.release()
    escape()
    expect(below.onDismiss).toHaveBeenCalledWith('escape')
  })

  it('a press outside dismisses the top layer only; a press inside it dismisses nothing', () => {
    const below = layer()
    const above = layer()
    press(above.node.firstElementChild!)
    expect(above.onDismiss).not.toHaveBeenCalled()
    press(document.body)
    expect(above.onDismiss).toHaveBeenCalledWith('outside-pointer')
    expect(below.onDismiss).not.toHaveBeenCalled()
  })

  it('excluded elements count as inside', () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    const { onDismiss } = layer({ exclude: [trigger] })
    press(trigger)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('a layer that ignores Escape still stops it from reaching anything else', () => {
    const below = layer()
    const persistent = layer({ closeOnEscape: false, closeOnOutside: false })
    const event = escape()
    press(document.body)
    expect(persistent.onDismiss).not.toHaveBeenCalled()
    expect(below.onDismiss).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('a lower layer can be released while one above stays open', () => {
    const below = layer()
    const above = layer()
    below.release()
    escape()
    expect(above.onDismiss).toHaveBeenCalledTimes(1)
    expect(openLayerCount()).toBe(1)
  })

  it('a passive layer takes Escape, but presses go to the layer below it', () => {
    const popover = layer()
    const tooltip = layer({ passive: true })
    press(document.body)
    expect(popover.onDismiss).toHaveBeenCalledWith('outside-pointer')
    expect(tooltip.onDismiss).not.toHaveBeenCalled()
    escape()
    expect(tooltip.onDismiss).toHaveBeenCalledWith('escape')
  })

  it('stops listening to the document when the stack empties', () => {
    const only = layer()
    only.release()
    const event = escape()
    expect(event.defaultPrevented).toBe(false)
    expect(openLayerCount()).toBe(0)
  })
})
