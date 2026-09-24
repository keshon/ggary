import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { RangeSlider, Slider } from '../packages/react/src/index'

/**
 * The range slider where only a browser can say: a press on the track moving
 * the nearer thumb and a drag carrying it, the real keys, two thumbs met at
 * the top pulled apart by the pointer, and the fill, the bubbles and the marks
 * standing where the thumbs' centres really are.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const frames = (count = 3) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

async function mount(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  host.style.cssText = 'inline-size: 300px; padding: 16px'
  document.body.append(host)
  const onValueChange = vi.fn()
  root = createRoot(host)
  root.render(h(RangeSlider, { label: 'Price', min: 0, max: 200, step: 5, defaultValue: [20, 80], onValueChange, ...props }))
  await frames(3)
  const control = host.querySelector<HTMLElement>('[data-scope="range-slider"][data-part="control"]')!
  const thumbs = [...host.querySelectorAll<HTMLInputElement>('[data-scope="range-slider"][data-part="thumb"]')]
  return { host, control, thumbs, onValueChange }
}

/** Where a value's thumb centre stands on screen: half a thumb in, and the rest shared out. */
const centreOf = (input: HTMLElement, share: number, thumb = 16) => {
  const box = input.getBoundingClientRect()
  return box.left + thumb / 2 + share * (box.width - thumb)
}

const pointer = (target: Element, type: string, clientX: number, clientY: number) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX, clientY, button: 0, pointerId: 1, isPrimary: true }))

describe('range slider', () => {
  it('a press on the track moves the nearer thumb there and gives it the focus; a drag carries it', async () => {
    const { control, thumbs, onValueChange } = await mount()
    const box = control.getBoundingClientRect()
    const y = box.top + box.height / 2
    pointer(control, 'pointerdown', box.left + box.width * 0.75, y)
    await frames(2)
    expect(onValueChange).toHaveBeenLastCalledWith([20, 150])
    expect(document.activeElement).toBe(thumbs[1])
    pointer(control, 'pointermove', box.left + box.width * 0.9, y)
    await frames(2)
    expect(onValueChange).toHaveBeenLastCalledWith([20, 180])
    pointer(control, 'pointerup', box.left + box.width * 0.9, y)
    pointer(control, 'pointerdown', box.left + box.width * 0.02, y)
    await frames(2)
    expect(onValueChange).toHaveBeenLastCalledWith([5, 180])
    expect(document.activeElement).toBe(thumbs[0])
  })

  it('the real keys move the focused thumb by its step, and End stops it against the other', async () => {
    const { thumbs, onValueChange } = await mount()
    await userEvent.click(thumbs[0], { position: { x: 8 + 0.1 * (thumbs[0].getBoundingClientRect().width - 16), y: 12 } })
    thumbs[0].focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith([25, 80])
    await userEvent.keyboard('{End}')
    expect(onValueChange).toHaveBeenLastCalledWith([80, 80])
    expect(thumbs[0].value).toBe('80')
  })

  it('two thumbs met at the top: the lower is in front, so the pointer takes it and pulls it back down', async () => {
    const { thumbs } = await mount({ defaultValue: [200, 200] })
    const x = centreOf(thumbs[0], 1)
    const y = thumbs[0].getBoundingClientRect().top + thumbs[0].getBoundingClientRect().height / 2
    expect(document.elementFromPoint(x, y)).toBe(thumbs[0])
  })

  it('the fill runs from one thumb’s centre to the other’s, and the bubbles stand over them', async () => {
    const { host, thumbs } = await mount({ valueDisplay: 'bubbles' })
    const fill = host.querySelector<HTMLElement>('[data-part="range"]')!.getBoundingClientRect()
    expect(Math.abs(fill.left - centreOf(thumbs[0], 0.1))).toBeLessThan(1)
    expect(Math.abs(fill.right - centreOf(thumbs[0], 0.4))).toBeLessThan(1)
    const bubbles = [...host.querySelectorAll<HTMLElement>('[data-part="bubble"]')].map((bubble) => bubble.getBoundingClientRect())
    expect(Math.abs(bubbles[0].left + bubbles[0].width / 2 - centreOf(thumbs[0], 0.1))).toBeLessThan(1)
    expect(Math.abs(bubbles[1].left + bubbles[1].width / 2 - centreOf(thumbs[0], 0.4))).toBeLessThan(1)
    expect(bubbles[0].bottom).toBeLessThanOrEqual(thumbs[0].getBoundingClientRect().top + 4)
  })

  it('a mark’s tick stands under the thumb that would stand on its value, and the end marks stay inside the track', async () => {
    const { host, thumbs } = await mount({ marks: [0, 50, 100, 200] })
    const ticks = [...host.querySelectorAll<HTMLElement>('[data-part="mark"]')]
    const tickAt = (mark: HTMLElement) => {
      const box = mark.getBoundingClientRect()
      const edge = mark.dataset.edge
      return edge === 'start' ? box.left : edge === 'end' ? box.right - 1 : box.left + box.width / 2
    }
    expect(Math.abs(tickAt(ticks[1]) - centreOf(thumbs[0], 0.25))).toBeLessThan(1.5)
    expect(Math.abs(tickAt(ticks[0]) - centreOf(thumbs[0], 0))).toBeLessThan(1.5)
    const track = host.querySelector<HTMLElement>('[data-part="control"]')!.getBoundingClientRect()
    expect(ticks[0].getBoundingClientRect().left).toBeGreaterThanOrEqual(track.left)
    expect(ticks[3].getBoundingClientRect().right).toBeLessThanOrEqual(track.right + 0.5)
  })

  it('the focus ring goes round the thumb, not the whole track', async () => {
    const { thumbs } = await mount()
    thumbs[1].focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(getComputedStyle(thumbs[1]).outlineStyle).toBe('none')
    // The thumb's own ring is drawn on ::-webkit-slider-thumb, which getComputedStyle cannot read; the state that draws it can be.
    expect(thumbs[1].matches(':focus-visible')).toBe(true)
  })

  it('a slider’s marks stand under the thumb too', async () => {
    const host = document.createElement('div')
    host.style.cssText = 'inline-size: 300px; padding: 16px'
    document.body.append(host)
    root = createRoot(host)
    root.render(h(Slider, { label: 'Agents', min: 0, max: 16, defaultValue: 4, marks: [0, 4, 8, 12, 16] }))
    await frames(3)
    const input = host.querySelector<HTMLElement>('[data-scope="slider"][data-part="input"]')!
    const mark = host.querySelectorAll<HTMLElement>('[data-scope="slider"][data-part="mark"]')[2].getBoundingClientRect()
    expect(Math.abs(mark.left + mark.width / 2 - centreOf(input, 0.5))).toBeLessThan(1.5)
  })
})
