import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/structure/src/index.css'
import '../packages/elements/src/index'

/**
 * What only a browser answers about the form controls: the keyboard a native
 * radio group and a native range input bring with them, a real pointer
 * dragging an axis letter with pointer capture, and the fill reaching the
 * track as a real custom property.
 */
afterEach(() => {
  document.body.replaceChildren()
})

const mount = (html: string) => {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  return host
}

const part = (root: Element, scope: string, name: string) =>
  root.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)!

describe('segmented control in a real browser', () => {
  it('is one tab stop, and the arrow keys move the choice — the browser’s own, not ours', async () => {
    const host = mount(`
      <button id="before">Before</button>
      <gg-segmented-control label="View mode" name="view">
        <label><input type="radio" value="list" checked> List</label>
        <label><input type="radio" value="grid"> Grid</label>
        <label><input type="radio" value="table"> Table</label>
      </gg-segmented-control>
      <button id="after">After</button>`)
    const control = host.querySelector('gg-segmented-control')!
    const inputs = [...control.querySelectorAll('input')]

    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(inputs[0])

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(inputs[1])
    expect(inputs[1].checked).toBe(true)
    expect(part(control, 'segmented-control', 'item').dataset.state).toBe('unchecked')
    expect(inputs[1].closest('[data-part="item"]')!.getAttribute('data-state')).toBe('checked')

    // One stop for the whole control: Tab leaves it rather than walking the options.
    await userEvent.tab()
    expect(document.activeElement).toBe(host.querySelector('#after'))
  })

  it('a press anywhere on a segment chooses it: the radio covers the whole segment', async () => {
    const host = mount(`
      <gg-segmented-control label="View mode">
        <label><input type="radio" value="list" checked> List</label>
        <label><input type="radio" value="grid"> Grid</label>
      </gg-segmented-control>`)
    const control = host.querySelector('gg-segmented-control')!
    const grid = control.querySelectorAll<HTMLElement>('[data-part="item"]')[1]
    const box = grid.getBoundingClientRect()

    // The far corner of the segment, well outside the text.
    const input = document.elementFromPoint(box.right - 2, box.bottom - 2)
    expect(input).toBe(grid.querySelector('[data-part="input"]'))
  })
})

describe('slider in a real browser', () => {
  it('the arrow keys step it, and the fill reaches the track as a custom property', async () => {
    const host = mount(`
      <gg-slider label="Parallel agents" show-value>
        <input type="range" min="0" max="16" step="2" value="4">
      </gg-slider>`)
    const slider = host.querySelector('gg-slider')!
    const input = part(slider, 'slider', 'input') as HTMLInputElement
    expect(getComputedStyle(slider).getPropertyValue('--slider-fill').trim()).toBe('25%')

    input.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(input.value).toBe('6')
    expect(getComputedStyle(slider).getPropertyValue('--slider-fill').trim()).toBe('37.5%')
    expect(part(slider, 'slider', 'output').textContent).toBe('6')

    await userEvent.keyboard('{End}')
    expect(input.value).toBe('16')
    expect(getComputedStyle(slider).getPropertyValue('--slider-fill').trim()).toBe('100%')
  })
})

describe('number field in a real browser', () => {
  it('a real pointer drags the axis letter, and the value follows under capture', async () => {
    const host = mount(`
      <gg-number-field axis="X" label="Position X">
        <input type="number" value="100" step="1">
      </gg-number-field>`)
    const field = host.querySelector('gg-number-field')!
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
    const host = mount(`
      <gg-number-field axis="Y" label="Position Y">
        <input type="number" value="10" step="0.5">
      </gg-number-field>`)
    const input = part(host.querySelector('gg-number-field')!, 'number-field', 'input') as HTMLInputElement
    input.focus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(input.value).toBe('11')
    await userEvent.keyboard('{ArrowDown}')
    expect(input.value).toBe('10.5')
    expect(getComputedStyle(input).appearance).toBe('textfield')
  })
})
