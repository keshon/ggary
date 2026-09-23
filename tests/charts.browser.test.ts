import { afterEach, describe, expect, it } from 'vitest'
import { page } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Legend, Sparkline, StatusDot } from '../packages/react/src/index'

/**
 * Where only a browser can say: the sparkline keeping the proportion it was
 * drawn at, its line, fill and dot standing in one hue, the stroke refusing
 * to thicken when the picture is stretched, and the legend's swatch being a
 * square of its own rather than the state dot wearing a series colour.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mount(node: ReactNode, style = 'inline-size: 600px') {
  await page.viewport(1000, 700)
  const host = document.createElement('div')
  host.style.cssText = style
  document.body.append(host)
  root = createRoot(host)
  root.render(node)
  await wait(40)
  return host
}

const style = (el: Element | null) => getComputedStyle(el!)
const find = (host: HTMLElement, scope: string, name: string) =>
  host.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)!

const series = [4, 9, 6, 14, 11, 18, 22]

describe('sparkline', () => {
  it('keeps the proportion it was drawn at: a quarter above a control, and as wide as the viewBox asks', async () => {
    const host = await mount(h(Sparkline, { values: series, area: true }))
    const box = find(host, 'sparkline', 'root').getBoundingClientRect()
    // --ggarry-size-control-md is 34px, and the height is a quarter above it.
    expect(box.height).toBeCloseTo(42.5, 1)
    expect(box.width / box.height).toBeCloseTo(120 / 32, 2)
    // It does not fill the 600px it was given: a sparkline is a mark beside a
    // number, and only an application that asks for a width gets one.
    expect(box.width).toBeLessThan(200)
  })

  it('the line, the fill and the dot are one series and do not part in colour', async () => {
    const host = await mount(h(Sparkline, { values: series, area: true, series: 2 }))
    const line = style(find(host, 'sparkline', 'line'))
    const area = style(find(host, 'sparkline', 'area'))
    const dot = style(find(host, 'sparkline', 'last'))
    expect(area.fill).toBe(line.stroke)
    expect(dot.fill).toBe(line.stroke)
    // The fill is the same hue at low alpha — one flat tone, not a gradient.
    expect(parseFloat(area.fillOpacity)).toBeCloseTo(0.12, 2)
    expect(area.backgroundImage).toBe('none')
  })

  it('a series is a category: the six differ, and no series at all is the accent', async () => {
    const host = await mount(
      h('div', null, ...[1, 2, 3, 4, 5, 6, undefined].map((n, i) => h(Sparkline, { key: i, values: series, series: n as 1 })))
    )
    const strokes = [...host.querySelectorAll('[data-scope="sparkline"][data-part="line"]')].map((line) => style(line).stroke)
    expect(new Set(strokes.slice(0, 6)).size).toBe(6)
    // The seventh has no series: it takes the accent rather than the first hue.
    expect(strokes[6]).not.toBe(strokes[0])
  })

  it('the stroke does not thicken when the picture is stretched, and nothing is clipped at the edges', async () => {
    const host = await mount(h(Sparkline, { values: series, last: true }))
    const svg = find(host, 'sparkline', 'root')
    const line = find(host, 'sparkline', 'line')
    expect(style(line).vectorEffect).toBe('non-scaling-stroke')
    expect(style(svg).overflow).toBe('visible')
    const thin = line.getBoundingClientRect()
    svg.style.inlineSize = '500px'
    await wait(20)
    const wide = line.getBoundingClientRect()
    expect(wide.width).toBeGreaterThan(thin.width * 2)
    // Stretched to three times the width, the line is no taller than the
    // shape plus its own stroke: a scaling stroke would have grown with it.
    expect(wide.height).toBeCloseTo(thin.height, 0)
  })

  it('the dot of the last value wears a ring in the surface’s colour', async () => {
    const host = await mount(h(Sparkline, { values: series }))
    const dot = style(find(host, 'sparkline', 'last'))
    expect(dot.stroke).not.toBe(dot.fill)
    expect(parseFloat(dot.strokeWidth)).toBeGreaterThan(0)
  })
})

describe('legend', () => {
  const items = [
    { label: 'Render', series: 1 as const, value: '18.2 s' },
    { label: 'Physics', series: 2 as const, value: '11.5 s' },
  ]

  it('the swatch is a square of its own, not the state dot in a series colour', async () => {
    const host = await mount(h('div', null, h(Legend, { items }), h(StatusDot, { tone: 'ok' })))
    const swatch = find(host, 'legend', 'swatch').getBoundingClientRect()
    const dot = find(host, 'dot', 'root').getBoundingClientRect()
    expect(swatch.width).toBe(swatch.height)
    expect(swatch.width).not.toBe(dot.width)
    // A radius of half the edge would be a circle, which is the state dot's mark.
    expect(parseFloat(style(find(host, 'legend', 'swatch')).borderTopLeftRadius)).toBeLessThan(swatch.width / 2)
  })

  it('every series in the key is a different colour, and each stands beside its name', async () => {
    const host = await mount(h(Legend, { items }))
    const swatches = [...host.querySelectorAll('[data-scope="legend"][data-part="swatch"]')]
    expect(new Set(swatches.map((el) => style(el).backgroundColor)).size).toBe(2)
    const [swatch] = swatches
    const label = host.querySelector('[data-scope="legend"][data-part="label"]')!
    expect(swatch!.getBoundingClientRect().right).toBeLessThanOrEqual(label.getBoundingClientRect().left)
  })

  it('the quantity is the loudest ink in the item, the label the quieter', async () => {
    const host = await mount(h(Legend, { items }))
    expect(style(find(host, 'legend', 'value')).color).not.toBe(style(find(host, 'legend', 'root')).color)
    expect(parseInt(style(find(host, 'legend', 'value')).fontWeight, 10)).toBeGreaterThan(
      parseInt(style(find(host, 'legend', 'label')).fontWeight, 10)
    )
  })

  it('a row wraps rather than scrolling; a column runs down the side', async () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ label: `A rather long series name ${i + 1}`, series: (i + 1) as 1 }))
    const host = await mount(h(Legend, { items: many }), 'inline-size: 260px')
    const tops = [...host.querySelectorAll('[data-scope="legend"][data-part="item"]')].map((el) => Math.round(el.getBoundingClientRect().top))
    expect(new Set(tops).size).toBeGreaterThan(1)
    expect(find(host, 'legend', 'root').scrollWidth).toBeLessThanOrEqual(find(host, 'legend', 'root').clientWidth + 1)

    root!.render(h(Legend, { items, direction: 'column' }))
    await wait(20)
    const [first, second] = [...host.querySelectorAll('[data-scope="legend"][data-part="item"]')]
    expect(second!.getBoundingClientRect().top).toBeGreaterThanOrEqual(first!.getBoundingClientRect().bottom)
  })
})
