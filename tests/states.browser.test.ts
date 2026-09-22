import { afterEach, describe, expect, it } from 'vitest'
import { commands } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Badge, Caret, StatusDot, Timeline } from '../packages/react/src/index'

/**
 * The state marks and the timeline where only a browser can say: the caret's
 * size against the type it stands in, its blink and what reduced motion does
 * to it, a dot's colour taken from a tone set above it, and the timeline's
 * line measured from bead to bead.
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

function mount(node: ReturnType<typeof h>) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  flushSync(() => root!.render(node))
  return host
}

const style = (element: Element | null, pseudo?: string) => getComputedStyle(element!, pseudo)
const dotOf = (host: Element) => host.querySelector('[data-scope="dot"][data-part="root"]')!

/** A colour as the browser resolves a custom property's value to, for comparison. */
function resolved(value: string) {
  const probe = document.createElement('span')
  probe.style.cssText = `forced-color-adjust: none; background-color: ${value}`
  document.body.append(probe)
  const colour = getComputedStyle(probe).backgroundColor
  probe.remove()
  return colour
}

describe('caret', () => {
  it('is 0.45em by 1.05em of the text it stands in, a tenth of an em off the last letter', async () => {
    for (const size of [14, 28]) {
      const host = mount(h('p', { style: { fontSize: `${size}px`, margin: 0 } }, 'Streaming', h(Caret)))
      const caret = host.querySelector<HTMLElement>('[data-scope="caret"]')!
      const box = caret.getBoundingClientRect()
      expect(box.width).toBeCloseTo(0.45 * size, 1)
      expect(box.height).toBeCloseTo(1.05 * size, 1)
      expect(parseFloat(style(caret).marginInlineStart)).toBeCloseTo(0.1 * size, 1)
      root!.unmount()
      root = null
      host.remove()
    }
  })

  it('blinks in steps; under reduced motion the blink goes and the caret stays', async () => {
    const host = mount(h('p', null, 'Streaming', h(Caret)))
    const caret = host.querySelector<HTMLElement>('[data-scope="caret"]')!
    expect(style(caret).animationName).toBe('ggarry-caret-blink')
    expect(style(caret).animationDuration).toBe('1s')
    expect(style(caret).animationTimingFunction).toMatch(/^steps\(2, (jump-)?start\)$/)
    await commands.reducedMotion(true)
    expect(style(caret).animationName).toBe('none')
    expect(style(caret).opacity).toBe('1')
    expect(caret.getBoundingClientRect().width).toBeGreaterThan(0)
  })

  it('is not printed', async () => {
    const sheetRules = [...document.styleSheets].flatMap((sheet) => {
      try {
        return [...sheet.cssRules]
      } catch {
        return []
      }
    })
    const all = (rules: CSSRule[]): CSSRule[] => rules.flatMap((rule) => ('cssRules' in rule ? [rule, ...all([...(rule as CSSGroupingRule).cssRules])] : [rule]))
    const print = all(sheetRules).filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.conditionText === 'print')
    expect(print.some((rule) => rule.cssText.includes(`[data-scope="caret"]`) && rule.cssText.includes('display: none'))).toBe(true)
  })
})

describe('status dot', () => {
  it('takes its colour from the nearest tone above it, and its own tone over that', async () => {
    const host = mount(
      h('div', null,
        h('div', { 'data-tone': 'error', id: 'error' }, h(StatusDot), ' failed'),
        h('div', { 'data-tone': 'error', id: 'nested' }, h('span', { 'data-tone': 'ok' }, h(StatusDot), ' done')),
        h('div', { 'data-tone': 'error', id: 'own' }, h(StatusDot, { tone: 'warn' }), ' remarks'),
        h('div', { id: 'none' }, h(StatusDot), ' queued'),
      )
    )
    const colour = (id: string) => style(dotOf(host.querySelector(`#${id}`)!)).backgroundColor
    const token = (name: string) => resolved(`var(${name})`)
    expect(colour('error')).toBe(token('--ggarry-text-danger'))
    expect(colour('nested')).toBe(token('--ggarry-text-success'))
    expect(colour('own')).toBe(token('--ggarry-text-warning'))
    expect(colour('none')).toBe(token('--ggarry-text-muted'))
    expect(dotOf(host).getBoundingClientRect().width).toBe(6)
  })

  it('agrees with the badge it stands in and with the timeline item around it', async () => {
    const host = mount(
      h('div', null,
        h(Badge, { tone: 'ok' }, 'done'),
        h(Timeline, { items: [{ id: 'a', title: 'Run finished', tone: 'ok' }], children: (item: { title: string }) => h('span', null, h(StatusDot), item.title) }),
      )
    )
    const badgeDot = host.querySelector('[data-scope="badge"][data-part="dot"]')!
    const bead = host.querySelector('[data-scope="timeline"][data-part="dot"]')!
    const inside = dotOf(host.querySelector('[data-scope="timeline"]')!)
    expect(style(inside).backgroundColor).toBe(style(badgeDot).backgroundColor)
    expect(style(bead).backgroundColor).toBe(style(badgeDot).backgroundColor)
  })

  it('pulses when running, from a tone above it too; slows to 3s under reduced motion rather than stopping', async () => {
    const host = mount(h('div', null, h('span', { 'data-tone': 'running' }, h(StatusDot), ' indexing'), h(StatusDot, { tone: 'ok' })))
    const [running, done] = host.querySelectorAll('[data-scope="dot"]')
    expect(style(running).animationName).toBe('ggarry-tone-pulse')
    expect(style(running).animationDuration).toBe('1.6s')
    expect(style(done).animationName).toBe('none')
    await commands.reducedMotion(true)
    expect(style(running).animationName).toBe('ggarry-tone-pulse')
    expect(style(running).animationDuration).toBe('3s')
  })

  it('survives forced colours as Highlight', async () => {
    const host = mount(h(StatusDot, { tone: 'ok' }))
    await commands.forcedColors(true)
    expect(style(dotOf(host)).backgroundColor).toBe(resolved('Highlight'))
  })
})

describe('timeline', () => {
  const items = [
    { id: 'a', title: 'Run finished', detail: '4 files changed', time: '2026-09-22T14:36:00Z', tone: 'ok' as const },
    { id: 'b', title: 'Indexing, running', time: '2026-09-22T14:32:00Z', tone: 'running' as const },
    { id: 'c', title: 'Queued' },
  ]

  it('joins the dots with a line from each centre to the next, and none past the last', async () => {
    const host = mount(h(Timeline, { items, locale: 'en-GB', timeFormat: { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' } }))
    const rows = [...host.querySelectorAll<HTMLElement>('[data-scope="timeline"][data-part="item"]')]
    const centre = (row: HTMLElement) => {
      const box = row.querySelector('[data-part="dot"]')!.getBoundingClientRect()
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    }
    for (let i = 0; i < rows.length - 1; i++) {
      const line = style(rows[i], '::before')
      const box = rows[i].getBoundingClientRect()
      const top = box.top + parseFloat(line.top)
      const bottom = box.bottom - parseFloat(line.bottom)
      const x = box.left + parseFloat(line.left) + parseFloat(line.width) / 2
      expect(line.content).toBe('""')
      expect(parseFloat(line.width)).toBeGreaterThan(0)
      expect(x).toBeCloseTo(centre(rows[i]).x, 0)
      expect(top).toBeCloseTo(centre(rows[i]).y, 0)
      expect(bottom).toBeCloseTo(centre(rows[i + 1]).y, 0)
    }
    expect(style(rows[rows.length - 1], '::before').content).toBe('none')
  })

  it('pushes the time to the far end and centres the dot on the first line', async () => {
    const host = mount(h('div', { style: { inlineSize: '400px' } }, h(Timeline, { items })))
    const row = host.querySelector<HTMLElement>('[data-part="item"]')!
    const time = row.querySelector('[data-part="time"]')!.getBoundingClientRect()
    expect(time.right).toBeCloseTo(row.getBoundingClientRect().right, 0)
    const body = row.querySelector('[data-part="body"]')!.getBoundingClientRect()
    const dot = row.querySelector('[data-part="dot"]')!.getBoundingClientRect()
    const firstLine = parseFloat(style(row).lineHeight)
    expect(dot.top + dot.height / 2).toBeCloseTo(body.top + firstLine / 2, 0)
  })

  it('an item with no tone has a neutral dot, whatever tone is around the timeline', async () => {
    const host = mount(h('div', { 'data-tone': 'error' }, h(Timeline, { items })))
    const beads = [...host.querySelectorAll('[data-scope="timeline"][data-part="dot"]')]
    expect(style(beads[2]).backgroundColor).toBe(resolved('var(--ggarry-text-muted)'))
    expect(style(beads[0]).backgroundColor).toBe(resolved('var(--ggarry-text-success)'))
    expect(style(beads[1]).animationName).toBe('ggarry-tone-pulse')
    expect(style(beads[2]).animationName).toBe('none')
  })
})
