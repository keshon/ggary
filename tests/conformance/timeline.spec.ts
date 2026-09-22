import { describe, expect, it } from 'vitest'
import type { TimelineItem } from '../../packages/core/src/components/timeline'
import { type Adapter, freshTarget, part, parts } from './harness'

const utc: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }

const items: TimelineItem[] = [
  { id: 'done', title: 'Run finished', detail: '4 files changed', time: '2026-09-22T14:36:00Z', tone: 'ok' },
  { id: 'index', title: 'Indexing, running', time: '2026-09-22T14:32:00Z', tone: 'running' },
  { id: 'queued', title: 'Queued', timeLabel: 'earlier' },
]

/**
 * The timeline and the two state marks in each framework. No state, so the
 * contract is the markup: a real ordered list with real <time> elements, the
 * tone on the item, and the marks hidden beside the words that name them.
 */
export function timelineConformance(adapter: Adapter) {
  ;(adapter.timeline ? describe : describe.skip)('timeline', () => {
    it('is an ordered list of items: a hidden dot, the body, the time at the end', async () => {
      const m = await adapter.timeline!({ items, label: 'Run history', locale: 'en-GB', timeFormat: utc }, freshTarget())
      const root = part(m.root, 'timeline', 'root')!
      expect(root.localName).toBe('ol')
      expect(root.getAttribute('aria-label')).toBe('Run history')
      const rows = parts(root, 'timeline', 'item')
      expect(rows.map((row) => row.localName)).toEqual(['li', 'li', 'li'])
      expect(rows.map((row) => row.dataset.tone)).toEqual(['ok', 'running', undefined])
      const first = rows[0]
      expect([...first.children].map((child) => child.getAttribute('data-part'))).toEqual(['dot', 'body', 'time'])
      expect(part(first, 'timeline', 'dot')!.getAttribute('aria-hidden')).toBe('true')
      expect(part(first, 'timeline', 'body')!.textContent).toBe('Run finished4 files changed')
      expect(part(first, 'timeline', 'detail')!.textContent).toBe('4 files changed')
      expect(part(rows[1], 'timeline', 'detail')).toBeNull()
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('says when in a real <time>: the machine value, and the label in the locale', async () => {
      const m = await adapter.timeline!({ items, locale: 'en-GB', timeFormat: utc }, freshTarget())
      const times = parts(m.root, 'timeline', 'time')
      expect(times.map((time) => time.localName)).toEqual(['time', 'time', 'time'])
      expect(times.map((time) => time.getAttribute('datetime'))).toEqual(['2026-09-22T14:36:00Z', '2026-09-22T14:32:00Z', null])
      expect(times.map((time) => time.textContent)).toEqual(['14:36', '14:32', 'earlier'])
    })

    it('an item with no time has no time element', async () => {
      const m = await adapter.timeline!({ items: [{ id: 'a', title: 'Created' }] }, freshTarget())
      expect(part(m.root, 'timeline', 'time')).toBeNull()
      expect(part(m.root, 'timeline', 'root')!.hasAttribute('aria-label')).toBe(false)
    })

    it('a rich body replaces the title and the detail, and keeps the dot and the time', async () => {
      const m = await adapter.timeline!({ items, rich: true, locale: 'en-GB', timeFormat: utc }, freshTarget())
      const first = parts(m.root, 'timeline', 'item')[0]
      const body = part(first, 'timeline', 'body')!
      expect([...body.children].map((child) => child.localName)).toEqual(['strong'])
      expect(body.textContent).toBe('Run finished')
      expect(part(first, 'timeline', 'dot')).not.toBeNull()
      expect(part(first, 'timeline', 'time')!.textContent).toBe('14:36')
    })

    it('follows new items', async () => {
      const m = await adapter.timeline!({ items, timeFormat: utc }, freshTarget())
      await m.update({ items: [...items, { id: 'new', title: 'Failed', tone: 'error' }] })
      const rows = parts(m.root, 'timeline', 'item')
      expect(rows).toHaveLength(4)
      expect(rows[3].dataset.tone).toBe('error')
    })
  })

  ;(adapter.statusDot ? describe : describe.skip)('status dot', () => {
    it('is a hidden mark, and carries a tone only when given one', async () => {
      const m = await adapter.statusDot!({ tone: 'warn' }, freshTarget())
      const dot = part(m.root, 'dot', 'root')!
      expect(dot.localName).toBe('span')
      expect(dot.getAttribute('aria-hidden')).toBe('true')
      expect(dot.dataset.tone).toBe('warn')
      expect(dot.childNodes).toHaveLength(0)
      await m.update({ tone: undefined })
      expect(dot.hasAttribute('data-tone')).toBe(false)
    })
  })

  ;(adapter.caret ? describe : describe.skip)('caret', () => {
    it('is a hidden mark flush after the text', async () => {
      const m = await adapter.caret!({}, freshTarget())
      const caret = part(m.root, 'caret', 'root')!
      expect(caret.getAttribute('aria-hidden')).toBe('true')
      expect(caret.childNodes).toHaveLength(0)
      // Flush: no space between the last character and the caret.
      expect(caret.previousSibling?.textContent).toBe('Streaming')
    })
  })
}
