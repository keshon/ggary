import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { createElement as h, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import '../packages/structure/src/index.css'
import { NumberField, SegmentedControl, Slider } from '../packages/react/src/index'

/**
 * What only a browser answers about the form controls: the keyboard a native
 * radio group and a native range input bring with them, a real pointer
 * dragging an axis letter with pointer capture, and the fill reaching the
 * track as a real custom property.
 */
let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const frames = (count = 2) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

const mount = async (...children: ReactNode[]) => {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  root.render(h('div', null, ...children))
  await frames()
  return host
}

const part = (root: Element, scope: string, name: string) =>
  root.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)!

const views = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table' },
]

describe('segmented control in a real browser', () => {
  it('is one tab stop, and the arrow keys move the choice — the browser’s own, not ours', async () => {
    const host = await mount(
      h('button', { key: 'before', id: 'before' }, 'Before'),
      h(SegmentedControl, { key: 'control', label: 'View mode', name: 'view', items: views, defaultValue: 'list' }),
      h('button', { key: 'after', id: 'after' }, 'After')
    )
    const control = part(host, 'segmented-control', 'root')
    const inputs = [...control.querySelectorAll('input')]

    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(inputs[0])

    await userEvent.keyboard('{ArrowRight}')
    await frames(1)
    expect(document.activeElement).toBe(inputs[1])
    expect(inputs[1].checked).toBe(true)
    expect(part(control, 'segmented-control', 'item').dataset.state).toBe('unchecked')
    expect(inputs[1].closest('[data-part="item"]')!.getAttribute('data-state')).toBe('checked')

    // One stop for the whole control: Tab leaves it rather than walking the options.
    await userEvent.tab()
    expect(document.activeElement).toBe(host.querySelector('#after'))
  })

  it('a press anywhere on a segment chooses it: the radio covers the whole segment', async () => {
    const host = await mount(h(SegmentedControl, { label: 'View mode', items: views.slice(0, 2), defaultValue: 'list' }))
    const control = part(host, 'segmented-control', 'root')
    const grid = control.querySelectorAll<HTMLElement>('[data-part="item"]')[1]
    const box = grid.getBoundingClientRect()

    // The far corner of the segment, well outside the text.
    const input = document.elementFromPoint(box.right - 2, box.bottom - 2)
    expect(input).toBe(grid.querySelector('[data-part="input"]'))
  })
})

describe('slider in a real browser', () => {
  it('the arrow keys step it, and the fill reaches the track as a custom property', async () => {
    const host = await mount(h(Slider, { label: 'Parallel agents', showValue: true, min: 0, max: 16, step: 2, defaultValue: 4 }))
    const slider = part(host, 'slider', 'root')
    const input = part(slider, 'slider', 'input') as HTMLInputElement
    expect(getComputedStyle(slider).getPropertyValue('--slider-fill').trim()).toBe('25%')

    input.focus()
    await userEvent.keyboard('{ArrowRight}')
    await frames(1)
    expect(input.value).toBe('6')
    expect(getComputedStyle(slider).getPropertyValue('--slider-fill').trim()).toBe('37.5%')
    expect(part(slider, 'slider', 'output').textContent).toBe('6')

    await userEvent.keyboard('{End}')
    await frames(1)
    expect(input.value).toBe('16')
    expect(getComputedStyle(slider).getPropertyValue('--slider-fill').trim()).toBe('100%')
  })
})

describe('number field in a real browser', () => {
  it('a real pointer drags the axis letter, and the value follows under capture', async () => {
    const host = await mount(h(NumberField, { axis: 'X', label: 'Position X', defaultValue: 100, step: 1 }))
    const field = part(host, 'number-field', 'root')
    const axis = part(field, 'number-field', 'axis')
    const input = part(field, 'number-field', 'input') as HTMLInputElement
    const box = axis.getBoundingClientRect()
    const y = box.top + box.height / 2
    const x = box.left + box.width / 2

    const send = (type: string, clientX: number, init: PointerEventInit = {}) =>
      axis.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX, clientY: y, ...init }))

    send('pointerdown', x)
    // Captured by the handle: the pointer leaves it and the drag continues.
    send('pointermove', x + 30)
    expect(input.value).toBe('115')
    send('pointermove', x + 30, { shiftKey: true })
    expect(input.value).toBe('250')
    send('pointerup', x + 30)
    send('pointermove', x + 100)
    expect(input.value).toBe('250')
  })

  it('the arrows step it natively: the spin buttons are styled away, not the behaviour', async () => {
    const host = await mount(h(NumberField, { axis: 'Y', label: 'Position Y', defaultValue: 10, step: 0.5 }))
    const input = part(part(host, 'number-field', 'root'), 'number-field', 'input') as HTMLInputElement
    input.focus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(input.value).toBe('11')
    await userEvent.keyboard('{ArrowDown}')
    expect(input.value).toBe('10.5')
    expect(getComputedStyle(input).appearance).toBe('textfield')
  })
})
