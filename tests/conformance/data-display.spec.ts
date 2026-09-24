import { describe, expect, it } from 'vitest'
import { type Adapter, freshTarget, part, parts } from './harness'

/**
 * Metric, key–value list and file change: stateless, so the contract is the
 * markup — the parts a theme styles, the attributes that carry direction and
 * judgement, and what a reader hears, in the order it hears it.
 */
export function dataDisplayConformance(adapter: Adapter) {
  const { metric, metricRow, keyValueList, fileChange } = adapter

  ;describe('metric', () => {
    it('reads label, number, unit and change in that order, the arrow hidden', async () => {
      const m = await metric(
        { label: 'Run time', value: 1234, unit: 's', delta: '18% down on the last', direction: 'down', tone: 'ok', locale: 'en-US' },
        freshTarget()
      )
      const root = part(m.root, 'metric', 'root')!
      expect([...root.children].map((el) => (el as HTMLElement).dataset.part)).toEqual(['label', 'value', 'delta'])
      expect(part(root, 'metric', 'label')!.textContent).toBe('Run time')
      const value = part(root, 'metric', 'value')!
      expect(value.textContent).toBe('1,234s')
      // The unit is inside the value, part of the number.
      expect(part(value, 'metric', 'unit')!.textContent).toBe('s')
      const delta = part(root, 'metric', 'delta')!
      expect(delta.dataset.dir).toBe('down')
      expect(delta.dataset.tone).toBe('ok')
      expect(delta.textContent).toBe('18% down on the last')
      const icon = part(delta, 'metric', 'delta-icon')!
      expect(icon.dataset.icon).toBe('arrow-down')
      expect(icon.getAttribute('aria-hidden')).toBe('true')
      expect(root.hasAttribute('role')).toBe(false)
      expect(root.hasAttribute('tabindex')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('draws no unit, no delta and no arrow it was not given', async () => {
      const m = await metric({ label: 'Duration p95', value: '4:12' }, freshTarget())
      expect(part(m.root, 'metric', 'value')!.textContent).toBe('4:12')
      expect(part(m.root, 'metric', 'unit')).toBeNull()
      expect(part(m.root, 'metric', 'delta')).toBeNull()
      await m.update({ delta: 'unchanged' })
      const delta = part(m.root, 'metric', 'delta')!
      expect(delta.textContent).toBe('unchanged')
      expect(delta.hasAttribute('data-dir')).toBe(false)
      expect(delta.hasAttribute('data-tone')).toBe(false)
      expect(part(m.root, 'metric', 'delta-icon')).toBeNull()
    })

    it('follows a new value, direction and tone independently', async () => {
      const m = await metric({ label: 'Warnings', value: 5, delta: '5 new', direction: 'up', tone: 'error', locale: 'en-US' }, freshTarget())
      await m.update({ value: 12000, tone: 'warn' })
      expect(part(m.root, 'metric', 'value')!.textContent).toBe('12,000')
      const delta = part(m.root, 'metric', 'delta')!
      expect(delta.dataset.dir).toBe('up')
      expect(delta.dataset.tone).toBe('warn')
      await m.update({ direction: 'down' })
      expect(part(m.root, 'metric', 'delta-icon')!.dataset.icon).toBe('arrow-down')
    })
  })

  ;describe('metric row', () => {
    const metrics = [
      { label: 'Total', value: '128' },
      { label: 'Succeeded', value: '121' },
      { label: 'Failed', value: '7' },
    ]

    it('holds its metrics; tiles by default', async () => {
      const m = await metricRow({ metrics }, freshTarget())
      const row = part(m.root, 'metric-row', 'root')!
      expect(parts(row, 'metric', 'label').map((el) => el.textContent)).toEqual(['Total', 'Succeeded', 'Failed'])
      expect(row.hasAttribute('data-joined')).toBe(false)
      expect(row.hasAttribute('data-headline')).toBe(false)
    })

    it('joined and headline are attributes a theme reads', async () => {
      const m = await metricRow({ metrics, joined: true }, freshTarget())
      const row = part(m.root, 'metric-row', 'root')!
      expect(row.hasAttribute('data-joined')).toBe(true)
      await m.update({ headline: true })
      expect(row.hasAttribute('data-headline')).toBe(true)
      await m.update({ joined: false })
      expect(row.hasAttribute('data-joined')).toBe(false)
    })
  })

  ;describe('key–value list', () => {
    const items = [
      { label: 'Model', value: 'opus' },
      { label: 'Started', value: '14:32:07' },
      { label: 'Files', value: '4' },
    ]

    it('is a real <dl>: each name a <dt>, each value the <dd> after it', async () => {
      const m = await keyValueList({ items }, freshTarget())
      const root = part(m.root, 'kv', 'root')!
      expect(root.tagName).toBe('DL')
      expect([...root.children].map((el) => el.tagName)).toEqual(['DT', 'DD', 'DT', 'DD', 'DT', 'DD'])
      expect(parts(root, 'kv', 'term').map((el) => el.textContent)).toEqual(['Model', 'Started', 'Files'])
      expect(parts(root, 'kv', 'detail').map((el) => el.textContent)).toEqual(['opus', '14:32:07', '4'])
      expect(root.hasAttribute('data-tight')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('a rich value is markup inside its <dd>', async () => {
      const m = await keyValueList({ items, rich: true }, freshTarget())
      const details = parts(m.root, 'kv', 'detail')
      expect(details.map((el) => el.querySelector('strong')?.textContent)).toEqual(['opus', '14:32:07', '4'])
    })

    it('tight is an attribute; new items redraw the pairs', async () => {
      const m = await keyValueList({ items, tight: true }, freshTarget())
      expect(part(m.root, 'kv', 'root')!.hasAttribute('data-tight')).toBe(true)
      await m.update({ items: [{ label: 'Sent', value: '1' }, { label: 'Suppressed', value: '0' }] })
      expect(parts(m.root, 'kv', 'term').map((el) => el.textContent)).toEqual(['Sent', 'Suppressed'])
      expect(parts(m.root, 'kv', 'detail').map((el) => el.textContent)).toEqual(['1', '0'])
    })
  })

  ;describe('file change', () => {
    it('shows the sign, hidden from assistive tech, and says the word', async () => {
      const m = await fileChange({ change: 'deleted' }, freshTarget())
      const root = part(m.root, 'file-change', 'root')!
      expect(root.dataset.change).toBe('deleted')
      const sign = part(root, 'file-change', 'sign')!
      expect(sign.textContent).toBe('−')
      expect(sign.getAttribute('aria-hidden')).toBe('true')
      expect(part(root, 'file-change', 'label')!.textContent).toBe('Deleted')
      expect(root.hasAttribute('aria-label')).toBe(false)
      expect(root.hasAttribute('role')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('follows a new change, and takes other words', async () => {
      const m = await fileChange({ change: 'added' }, freshTarget())
      await m.update({ change: 'conflict' })
      expect(part(m.root, 'file-change', 'root')!.dataset.change).toBe('conflict')
      expect(part(m.root, 'file-change', 'sign')!.textContent).toBe('!')
      await m.update({ words: { conflict: 'Конфликт' } })
      expect(part(m.root, 'file-change', 'label')!.textContent).toBe('Конфликт')
    })
  })
}
