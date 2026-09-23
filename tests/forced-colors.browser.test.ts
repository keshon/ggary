import { afterEach, describe, expect, it } from 'vitest'
import { commands } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Button, Checkbox, Diff, Lanes, Legend, RadioGroup, Sparkline, Switch, Share } from '../packages/react/src/index'

/**
 * Windows High Contrast, emulated. Fills and shadows are reset to system
 * colours there, so what GGarry says with a fill alone must be said again:
 * the theme's gg.forced layer. Each case fails with that layer taken out.
 */

declare module '@vitest/browser/context' {
  interface BrowserCommands {
    forcedColors: (active: boolean) => Promise<void>
  }
}

let root: Root | null = null
afterEach(async () => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
  await commands.forcedColors(false)
})

function mount(node: ReturnType<typeof h>) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  flushSync(() => root!.render(node))
  return host
}

const style = (element: Element | null, pseudo?: string) => getComputedStyle(element!, pseudo)

/** Into forced colours, and past the transitions the switch sets off: a fill eases from its old colour. */
async function forced() {
  await commands.forcedColors(true)
  await Promise.all(document.getAnimations().filter((animation) => animation instanceof CSSTransition).map((animation) => animation.finished.catch(() => {})))
}

describe('forced colours', () => {
  it('a checked box and a switch that is on keep their state as Highlight, with a border to stand on', async () => {
    const host = mount(h('div', null, h(Checkbox, { defaultChecked: true }, 'Agree'), h(Switch, { defaultChecked: true }, 'Sync'), h(Switch, null, 'Off')))
    await forced()
    const [box, on, off] = host.querySelectorAll<HTMLInputElement>('input')
    const highlight = (() => {
      const probe = document.createElement('div')
      probe.style.cssText = 'forced-color-adjust: none; background: Highlight'
      document.body.append(probe)
      const value = getComputedStyle(probe).backgroundColor
      probe.remove()
      return value
    })()
    expect(style(box).backgroundColor).toBe(highlight)
    expect(style(on).backgroundColor).toBe(highlight)
    expect(style(off).backgroundColor).not.toBe(highlight)
    expect(style(off).borderTopStyle).toBe('solid')
  })

  it('a checked radio’s dot shows against its box', async () => {
    const host = mount(h(RadioGroup, { label: 'Plan', defaultValue: 'pro', items: [{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }] }))
    await forced()
    const dots = host.querySelectorAll('[data-scope="radio"][data-part="indicator"]')
    const checked = [...dots].find((dot) => dot.previousElementSibling instanceof HTMLInputElement && dot.previousElementSibling.checked)!
    const input = checked.previousElementSibling!
    expect(style(checked).backgroundColor).not.toBe(style(input).backgroundColor)
  })

  it('a sparkline drops the fill under its line and keeps the ring round its last dot', async () => {
    const host = mount(h(Sparkline, { values: [4, 9, 6, 14, 22], area: true }))
    await forced()
    const area = host.querySelector('[data-scope="sparkline"][data-part="area"]')!
    // Reset, the fill comes back as a block over the shape it was shading.
    expect(style(area).display).toBe('none')
    const dot = host.querySelector('[data-scope="sparkline"][data-part="last"]')!
    expect(style(dot).stroke).not.toBe(style(dot).fill)
  })

  it('a legend’s swatches survive the reset as marks, the labels saying which is which', async () => {
    const host = mount(h(Legend, { items: [{ label: 'Render', series: 1 as const }, { label: 'Physics', series: 2 as const }] }))
    await forced()
    const swatches = [...host.querySelectorAll('[data-scope="legend"][data-part="swatch"]')]
    const canvas = style(document.body).backgroundColor
    expect(swatches.every((swatch) => style(swatch).backgroundColor !== canvas)).toBe(true)
  })

  it('a share bar keeps its divisions: the tones collapse, the parts do not', async () => {
    const host = mount(
      h(Share as never, {
        items: [
          { label: 'up', value: 22, tone: 'ok' },
          { label: 'down', value: 1.5, tone: 'error' },
          { label: 'unknown', value: 0.5, tone: 'neutral' },
        ],
      })
    )
    await forced()
    const segments = [...host.querySelectorAll<HTMLElement>('[data-scope="share"][data-part="segment"]')]
    // One fill is left for every tone, so the parts are told apart by the line
    // each draws on its trailing edge — the last has nothing after it.
    expect(new Set(segments.map((segment) => style(segment).backgroundColor)).size).toBe(1)
    expect(segments.map((segment) => style(segment).borderInlineEndStyle)).toEqual(['solid', 'solid', 'none'])
    expect(style(host.querySelector('[data-scope="share"][data-part="root"]')).borderTopStyle).toBe('solid')
  })

  it('a diff says what became of a line without the tint: the sign, and an edge in the gutter', async () => {
    const host = mount(
      h(Diff as never, {
        path: 'a.ts',
        rows: [
          { kind: 'context', text: 'const size = 256;', before: 41, after: 41 },
          { kind: 'del', text: 'let seed = 0;', before: 42 },
          { kind: 'add', text: 'let seed = Date.now();', after: 42 },
        ],
      })
    )
    await forced()
    const rows = [...host.querySelectorAll<HTMLElement>('[data-scope="diff"][data-part="row"]')]
    // Both tints reset to one ground, so the colour says nothing any more.
    expect(style(rows[1]).backgroundColor).toBe(style(rows[2]).backgroundColor)
    expect(rows.map((row) => style(row, '::before').content)).toEqual(['" "', '"−"', '"+"'])
    expect(rows.map((row) => style(row).borderInlineStartStyle)).toEqual(['none', 'solid', 'solid'])
  })

  it('a lane’s segments survive as marks on a track that still draws the empty time', async () => {
    const host = mount(
      h(Lanes as never, {
        label: 'Workers',
        lanes: [
          { id: 'a', label: 'a', spans: [{ label: 'x', start: 0, end: 4000, tone: 'ok' }] },
          { id: 'b', label: 'b', spans: [{ label: 'y', start: 6000, end: 10_000, tone: 'error' }] },
        ],
      })
    )
    await forced()
    const spans = [...host.querySelectorAll<HTMLElement>('[data-scope="lanes"][data-part="span"]')]
    const track = host.querySelector<HTMLElement>('[data-scope="lanes"][data-part="track"]')!
    expect(new Set(spans.map((span) => style(span).backgroundColor)).size).toBe(1)
    expect(spans.every((span) => style(span).backgroundColor !== style(track).backgroundColor)).toBe(true)
    expect(style(track).borderTopStyle).toBe('solid')
  })

  it('a busy button’s ring keeps a turning arc: its top edge another colour than the rest', async () => {
    const host = mount(h(Button, { loading: true }, 'Save'))
    await forced()
    const spinner = host.querySelector('[data-scope="button"][data-part="spinner"]')
    expect(style(spinner).borderTopColor).not.toBe(style(spinner).borderRightColor)
  })
})
