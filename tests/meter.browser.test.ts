import { afterEach, describe, expect, it } from 'vitest'
import { commands } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Meter, Ring } from '../packages/react/src/index'
import { RING_CIRCUMFERENCE } from '../packages/core/src/components/ring'

/**
 * The two readings where only a browser can say: the fill measured against its
 * track, the arc measured along the circle core computed it from, the rungs of
 * the ring's ladder in pixels, and what forced colours and reduced motion do to
 * a value that lives in a fill and a length.
 */

declare module '@vitest/browser/context' {
  interface BrowserCommands {
    forcedColors: (active: boolean) => Promise<void>
    reducedMotion: (reduce: boolean) => Promise<void>
  }
}

let root: Root | null = null
afterEach(async () => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
  await commands.reducedMotion(false)
  await commands.forcedColors(false)
})

function mount(node: ReturnType<typeof h>, width = 320) {
  const host = document.createElement('div')
  host.style.cssText = `inline-size: ${width}px`
  document.body.append(host)
  root = createRoot(host)
  flushSync(() => root!.render(node))
  return host
}

const style = (element: Element | null) => getComputedStyle(element!)
const part = (host: Element, scope: string, name: string) => host.querySelector(`[data-scope="${scope}"][data-part="${name}"]`)!

/** A colour as the browser resolves it, for comparison with a painted one. */
function resolved(value: string) {
  const probe = document.createElement('span')
  probe.style.cssText = `forced-color-adjust: none; background-color: ${value}`
  document.body.append(probe)
  const colour = getComputedStyle(probe).backgroundColor
  probe.remove()
  return colour
}

describe('meter', () => {
  it('the fill takes exactly its share of the track, and its own rounded end with it', () => {
    const host = mount(h('div', null, h(Meter, { value: 18, max: 60, label: 'Render', locale: 'en-GB' })))
    const track = part(host, 'meter', 'track').getBoundingClientRect()
    const fill = part(host, 'meter', 'fill').getBoundingClientRect()
    expect(track.width).toBeCloseTo(320, 0)
    expect(fill.width).toBeCloseTo(track.width * 0.3, 1)
    // Sized rather than scaled: the radius of the end is the track's, undistorted.
    expect(style(part(host, 'meter', 'fill')).borderStartStartRadius).toBe(style(part(host, 'meter', 'track')).borderStartStartRadius)
  })

  it('the label and the reading share the line above the bar, so the bar keeps its whole length', () => {
    const host = mount(h('div', null, h(Meter, { value: 18, max: 60, label: 'Render', locale: 'en-GB' })))
    const label = part(host, 'meter', 'label').getBoundingClientRect()
    const value = part(host, 'meter', 'value').getBoundingClientRect()
    const track = part(host, 'meter', 'track').getBoundingClientRect()
    expect(value.left).toBeGreaterThan(label.right)
    expect(track.top).toBeGreaterThan(label.bottom - 1)
    expect(track.left).toBeCloseTo(label.left, 0)
    expect(track.width).toBeCloseTo(320, 0)
  })

  it('the thickness comes down with the size, and an empty meter draws no fill at all', () => {
    for (const [size, thickness] of [['sm', 4], ['md', 6], ['lg', 8]] as const) {
      const host = mount(h(Meter, { value: 0, max: 60, label: 'Render', size }))
      expect(part(host, 'meter', 'track').getBoundingClientRect().height).toBeCloseTo(thickness, 1)
      expect(part(host, 'meter', 'fill').getBoundingClientRect().width).toBe(0)
      root!.unmount()
      root = null
      host.remove()
    }
  })

  it('the fill travels on a change of value, and under reduced motion it does not', async () => {
    const host = mount(h(Meter, { value: 18, max: 60, label: 'Render' }))
    expect(style(part(host, 'meter', 'fill')).transitionProperty).toBe('inline-size')
    expect(style(part(host, 'meter', 'fill')).transitionDuration).not.toBe('0s')
    await commands.reducedMotion(true)
    expect(style(part(host, 'meter', 'fill')).transitionDuration).toBe('0s')
  })

  it('under forced colours the fill survives the reset and the track keeps an edge', async () => {
    const host = mount(h(Meter, { value: 45, max: 60, label: 'Spending' }))
    await commands.forcedColors(true)
    expect(style(part(host, 'meter', 'fill')).backgroundColor).toBe(resolved('Highlight'))
    expect(style(part(host, 'meter', 'track')).borderTopStyle).toBe('solid')
    // The length is still the value: a fill reset to nothing would read the same
    // at every value. Measured inside the edge forced colours has just added.
    const room = (part(host, 'meter', 'track') as HTMLElement).clientWidth
    expect(part(host, 'meter', 'fill').getBoundingClientRect().width).toBeCloseTo(room * 0.75, 1)
  })
})

describe('ring', () => {
  it('the arc is drawn along the circle core measured it from, and starts at the top', () => {
    const host = mount(h(Ring, { value: 25, label: 'A quarter of the budget spent' }))
    const arc = part(host, 'ring', 'arc') as unknown as SVGCircleElement
    // The browser walks the circle in beziers, so its length is the computed one to within a third of a unit.
    expect(arc.getTotalLength()).toBeCloseTo(RING_CIRCUMFERENCE, 0)
    expect(parseFloat(style(arc).strokeDashoffset)).toBeCloseTo(RING_CIRCUMFERENCE * 0.75, 2)
    // A quarter turn back, so the value begins at twelve o'clock rather than at three.
    expect(style(arc).transform).toBe('matrix(0, -1, 1, 0, 0, 0)')
  })

  it('the figure at the centre is left upright, and stands in the middle of the box', () => {
    const host = mount(h(Ring, { value: 18, max: 60, label: 'Budget spent', size: 'lg', locale: 'en-GB' }))
    const svg = part(host, 'ring', 'root').getBoundingClientRect()
    const figure = part(host, 'ring', 'value')
    expect(figure.textContent).toBe('30')
    expect(style(figure).transform).toBe('none')
    const box = figure.getBoundingClientRect()
    expect(box.left + box.width / 2).toBeCloseTo(svg.left + svg.width / 2, 0)
    expect(box.top + box.height / 2).toBeCloseTo(svg.top + svg.height / 2, 0)
    // The floor of the type scale, reached through the viewBox rather than in
    // px: 5.5 of 20 units, drawn in a box of 40, is 11 pixels on the page.
    expect(parseFloat(style(figure).fontSize)).toBeCloseTo(5.5, 2)
    expect(parseFloat(style(figure).fontSize) * (svg.width / 20)).toBeCloseTo(11, 1)
  })

  it('the rungs are the kit’s control heights, and the stroke comes down with the box', () => {
    for (const [size, box, stroke] of [['sm', 16, 2], ['md', 28, 2.5], ['lg', 40, 3]] as const) {
      const host = mount(h(Ring, { value: 50, label: 'Half the budget spent', size }))
      const rect = part(host, 'ring', 'root').getBoundingClientRect()
      expect(rect.width).toBeCloseTo(box, 1)
      expect(rect.height).toBeCloseTo(box, 1)
      // Stated in viewBox units of 20, so it keeps its share of the box and is
      // drawn at that share of the box's pixels.
      const drawn = parseFloat(style(part(host, 'ring', 'arc')).strokeWidth)
      expect(drawn).toBeCloseTo(stroke, 2)
      expect(drawn * (box / 20)).toBeCloseTo((stroke / 20) * box, 2)
      root!.unmount()
      root = null
      host.remove()
    }
  })

  it('the arc travels on a change of value, and under reduced motion it does not', async () => {
    const host = mount(h(Ring, { value: 25, label: 'A quarter spent' }))
    expect(style(part(host, 'ring', 'arc')).transitionProperty).toBe('stroke-dashoffset')
    expect(style(part(host, 'ring', 'arc')).transitionDuration).not.toBe('0s')
    await commands.reducedMotion(true)
    expect(style(part(host, 'ring', 'arc')).transitionDuration).toBe('0s')
  })

  it('under forced colours the arc survives the reset and the track stays behind it', async () => {
    const host = mount(h(Ring, { value: 25, label: 'A quarter spent' }))
    await commands.forcedColors(true)
    const arc = part(host, 'ring', 'arc')
    const track = part(host, 'ring', 'track')
    expect(style(arc).stroke).toBe(resolved('Highlight'))
    expect(style(track).stroke).toBe(resolved('GrayText'))
    expect(style(arc).stroke).not.toBe(style(track).stroke)
    // The length is still the value, which is all an even circle would lose.
    expect(parseFloat(style(arc).strokeDashoffset)).toBeCloseTo(RING_CIRCUMFERENCE * 0.75, 2)
  })
})
