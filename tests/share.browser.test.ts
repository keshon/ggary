import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Share } from '../packages/react/src/index'

/**
 * The share bar where only a browser can say it: the parts measured against
 * the strip. A percentage in the DOM is not a proportion on the screen until
 * something lays it out.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

function mount(props: Record<string, unknown>, width = 400) {
  const host = document.createElement('div')
  host.style.cssText = `inline-size: ${width}px`
  document.body.append(host)
  root = createRoot(host)
  flushSync(() => root!.render(h(Share as never, props)))
  const bar = host.querySelector<HTMLElement>('[data-scope="share"][data-part="root"]')!
  const segments = [...host.querySelectorAll<HTMLElement>('[data-part="segment"]')]
  return { host, bar, segments }
}

const day = [
  { label: 'up', value: 22, tone: 'ok' as const },
  { label: 'down', value: 1.5, tone: 'error' as const },
  { label: 'unknown', value: 0.5, tone: 'neutral' as const },
]

describe('share', () => {
  it('divides the strip in the proportion of the data, with nothing left over', async () => {
    const { bar, segments } = mount({ items: day, unit: 'h' }, 400)
    const widths = segments.map((segment) => segment.getBoundingClientRect().width)
    expect(widths[0]).toBeCloseTo(400 * 0.92, 0)
    expect(widths[1]).toBeCloseTo(400 * 0.06, 0)
    expect(widths[2]).toBeCloseTo(400 * 0.02, 0)
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(bar.getBoundingClientRect().width, 0)
  })

  it('the parts stand side by side in one strip of the meter’s height', () => {
    const { bar, segments } = mount({ items: day })
    const box = bar.getBoundingClientRect()
    expect(box.height).toBeCloseTo(6, 0)
    for (const segment of segments) {
      const part = segment.getBoundingClientRect()
      expect(part.top).toBeCloseTo(box.top, 0)
      expect(part.height).toBeCloseTo(box.height, 0)
    }
    const { bar: large } = mount({ items: day, size: 'lg' })
    expect(large.getBoundingClientRect().height).toBeCloseTo(16, 0)
  })

  it('a part with a value is always drawn: two minutes of downtime in a day is still a part', () => {
    const { segments } = mount({ items: [{ label: 'up', value: 1438, tone: 'ok' }, { label: 'down', value: 2, tone: 'error' }] }, 400)
    expect(segments).toHaveLength(2)
    expect(segments[1].getBoundingClientRect().width).toBeCloseTo(4, 0)
    expect(segments[1].getBoundingClientRect().width).toBeGreaterThan(0)
  })

  it('an outcome and a category are two palettes: the tone mark, and the series colour', () => {
    const { segments } = mount({ items: [{ label: 'up', value: 1, tone: 'ok' }, { label: 'CSS', value: 1, series: 3 }, { label: 'rest', value: 1 }] })
    const fill = (element: HTMLElement) => getComputedStyle(element).backgroundColor
    const tone = getComputedStyle(document.documentElement).getPropertyValue('--ggarry-text-success').trim()
    const series = getComputedStyle(document.documentElement).getPropertyValue('--ggarry-chart-3').trim()
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--ggarry-bg-accent').trim()
    const hex = (value: string) => {
      const probe = document.createElement('div')
      probe.style.backgroundColor = value
      document.body.append(probe)
      const colour = getComputedStyle(probe).backgroundColor
      probe.remove()
      return colour
    }
    expect(fill(segments[0])).toBe(hex(tone))
    expect(fill(segments[1])).toBe(hex(series))
    // No series and no tone: one part is not a category, so it is the accent.
    expect(fill(segments[2])).toBe(hex(accent))
  })

  it('an application may set the colour itself, and the palette gives way', () => {
    const { segments } = mount({ items: [{ label: 'CSS', value: 1, series: 3 }], style: { '--gg-series': 'rgb(1, 2, 3)' } })
    expect(getComputedStyle(segments[0]).backgroundColor).toBe('rgb(1, 2, 3)')
  })
})
