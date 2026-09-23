import { describe, expect, it, vi } from 'vitest'
import { type Adapter, click, freshTarget, keydown, part, parts } from './harness'
import type { TaskItem } from '../../packages/core/src/components/task'

/**
 * The agent layer, in both adapters: what a run counts, what a queue is (a
 * listbox with one tab stop, not a grid), what a strip of past attempts says
 * in words, and what a budget hands to a meter.
 */

const phase = [{ tone: 'ok' as const }, { tone: 'ok' as const }, { tone: 'warn' as const }, { tone: 'running' as const }, {}]

export function runConformance(adapter: Adapter) {
  const test = adapter.run ? it : it.skip
  describe('run', () => {
    test('counts its units, and says the reading in words as well as in dots', async () => {
      const m = await adapter.run!({ units: phase, label: 'Agents finished', locale: 'en-GB' }, freshTarget())
      const units = part(m.root, 'run', 'units')!
      expect(units.getAttribute('role')).toBe('progressbar')
      expect(units.getAttribute('aria-valuenow')).toBe('3')
      expect(units.getAttribute('aria-valuemax')).toBe('5')
      expect(units.getAttribute('aria-label')).toBe('Agents finished')
      expect(units.getAttribute('aria-valuetext')).toBe('Agents finished: 3 of 5 done, 1 with a remark')
      expect(part(m.root, 'run', 'value')!.textContent).toBe('3 of 5 done, 1 with a remark')
      expect(m.root.querySelector('[class]')).toBeNull()
      expect(m.root.querySelector('svg')).toBeNull()
    })

    test('a unit is the kit’s own dot: one per unit, in its tone, and none of them labelled', async () => {
      const m = await adapter.run!({ units: phase, label: 'Agents' }, freshTarget())
      const dots = parts(part(m.root, 'run', 'units')!, 'dot', 'root')
      expect(dots).toHaveLength(5)
      expect(dots.map((dot) => dot.getAttribute('data-tone'))).toEqual(['ok', 'ok', 'warn', 'running', null])
      expect(dots.every((dot) => dot.getAttribute('aria-hidden') === 'true')).toBe(true)
      expect(part(m.root, 'run', 'value')!.getAttribute('aria-hidden')).toBe('true')
    })

    test('follows the work: a unit that finishes moves the count', async () => {
      const m = await adapter.run!({ units: phase, label: 'Agents' }, freshTarget())
      await m.update({ units: [{ tone: 'ok' }, { tone: 'ok' }, { tone: 'warn' }, { tone: 'ok' }, { tone: 'running' }], label: 'Agents' })
      expect(part(m.root, 'run', 'units')!.getAttribute('aria-valuenow')).toBe('4')
      expect(parts(m.root, 'dot', 'root').at(-1)!.getAttribute('data-tone')).toBe('running')
    })

    test('the drawn reading can be dropped; the spoken one cannot', async () => {
      const m = await adapter.run!({ units: phase, label: 'Agents', showValue: false }, freshTarget())
      expect(part(m.root, 'run', 'value')).toBeNull()
      expect(part(m.root, 'run', 'units')!.getAttribute('aria-valuetext')).toContain('3 of 5 done')
    })
  })
}

const tasks: TaskItem[] = [
  { value: 'heightmap', title: 'Parsing the heightmap', detail: 'terrain/heightmap.ts', meta: '2.1 s', state: 'done' },
  { value: 'biomes', title: 'Generating the biomes', meta: '8.4 s', state: 'done' },
  { value: 'resources', title: 'Placing the resources', detail: 'the third pass is going', meta: '14.0 s', state: 'running' },
  { value: 'navmesh', title: 'Baking the navmesh', state: 'queued' },
]

export function queueConformance(adapter: Adapter) {
  const test = adapter.queue ? it : it.skip
  describe('queue', () => {
    test('is a listbox of flat rows, each with its phase in a tone and in words', async () => {
      const m = await adapter.queue!({ tasks, label: 'The queue of agents' }, freshTarget())
      const root = part(m.root, 'queue', 'root')!
      expect(root.getAttribute('role')).toBe('listbox')
      expect(root.getAttribute('aria-label')).toBe('The queue of agents')
      const rows = parts(root, 'task', 'root')
      expect(rows).toHaveLength(4)
      expect(rows.every((row) => row.getAttribute('role') === 'option')).toBe(true)
      expect(rows.map((row) => row.dataset.state)).toEqual(['done', 'done', 'running', 'queued'])
      expect(rows.map((row) => row.getAttribute('data-tone'))).toEqual(['ok', 'ok', 'running', null])
      expect(rows[2].getAttribute('aria-label')).toBe('Placing the resources, running, the third pass is going, 14.0 s')
      // Flat: the row has a gutter, a body and a time, and nothing to expand.
      expect(part(rows[0], 'task', 'gutter')).not.toBeNull()
      expect(parts(rows[0], 'dot', 'root')).toHaveLength(1)
      expect(part(rows[0], 'task', 'title')!.textContent).toBe('Parsing the heightmap')
      expect(part(rows[0], 'task', 'meta')!.textContent).toBe('2.1 s')
      expect(part(rows[3], 'task', 'sub')).toBeNull()
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    test('one tab stop for the whole queue', async () => {
      const m = await adapter.queue!({ tasks, label: 'Queue' }, freshTarget())
      const rows = parts(m.root, 'task', 'root')
      expect(rows.map((row) => row.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
      expect(rows.every((row) => row.getAttribute('aria-selected') === 'false')).toBe(true)
    })

    test('a press chooses, and the stop and the selection move together', async () => {
      const onValueChange = vi.fn()
      const m = await adapter.queue!({ tasks, label: 'Queue', onValueChange }, freshTarget())
      await adapter.act(() => click(parts(m.root, 'task', 'root')[2]))
      const rows = parts(m.root, 'task', 'root')
      expect(rows[2].getAttribute('aria-selected')).toBe('true')
      expect(rows[2].getAttribute('tabindex')).toBe('0')
      expect(rows[0].getAttribute('tabindex')).toBe('-1')
      expect(onValueChange).toHaveBeenCalledWith('resources')
    })

    test('the arrows walk the queue and carry the selection with them', async () => {
      const m = await adapter.queue!({ tasks, label: 'Queue', defaultValue: 'biomes' }, freshTarget())
      await adapter.act(() => keydown(parts(m.root, 'task', 'root')[1], 'ArrowDown'))
      expect(parts(m.root, 'task', 'root')[2].getAttribute('aria-selected')).toBe('true')
      await adapter.act(() => keydown(parts(m.root, 'task', 'root')[2], 'Home'))
      expect(parts(m.root, 'task', 'root')[0].getAttribute('aria-selected')).toBe('true')
      await adapter.act(() => keydown(parts(m.root, 'task', 'root')[0], 'End'))
      expect(parts(m.root, 'task', 'root')[3].getAttribute('aria-selected')).toBe('true')
    })

    test('a phase that turns over is said once, politely, outside the list', async () => {
      const m = await adapter.queue!({ tasks, label: 'Queue' }, freshTarget())
      const status = part(m.root, 'queue', 'status')!
      expect(status.getAttribute('aria-live')).toBe('polite')
      expect(status.closest('[data-scope="queue"][data-part="root"]')).toBeNull()
      expect(status.textContent).toBe('')
      await m.update({ tasks: tasks.map((task) => (task.value === 'resources' ? { ...task, state: 'failed' as const } : task)), label: 'Queue' })
      expect(part(m.root, 'queue', 'status')!.textContent).toBe('Placing the resources: failed')
      expect(parts(m.root, 'task', 'root')[2].getAttribute('data-tone')).toBe('error')
    })

    test('rows that arrive while the work runs are rows like the rest', async () => {
      const m = await adapter.queue!({ tasks, label: 'Queue' }, freshTarget())
      await m.update({ tasks: [...tasks, { value: 'export', title: 'Exporting the preview', state: 'skipped' }], label: 'Queue' })
      const rows = parts(m.root, 'task', 'root')
      expect(rows).toHaveLength(5)
      expect(rows[4].dataset.state).toBe('skipped')
      expect(rows[4].getAttribute('data-tone')).toBe('neutral')
    })
  })
}

const ok = { tone: 'ok' as const }

export function historyConformance(adapter: Adapter) {
  const test = adapter.history ? it : it.skip
  describe('history', () => {
    test('is one picture with one name: how the attempts ended, in words', async () => {
      const m = await adapter.history!({ ticks: [ok, { tone: 'error' }, ok, { empty: true }], label: 'Nightly build' }, freshTarget())
      const strip = part(m.root, 'history', 'strip')!
      expect(strip.getAttribute('role')).toBe('img')
      expect(strip.getAttribute('aria-label')).toBe('Nightly build: The last 3 attempts: 2 succeeded, 1 failed, 1 never attempted')
      const ticks = parts(strip, 'history', 'tick')
      expect(ticks).toHaveLength(4)
      expect(ticks.map((tick) => tick.getAttribute('data-tone'))).toEqual(['ok', 'error', 'ok', null])
      expect(ticks[3].hasAttribute('data-empty')).toBe(true)
      expect(ticks.every((tick) => tick.getAttribute('aria-hidden') === 'true' && tick.textContent === '')).toBe(true)
      expect(m.root.querySelector('[class]')).toBeNull()
      expect(m.root.querySelector('svg')).toBeNull()
    })

    test('batched: each batch carries the weight of what stands behind it, and the ruler repeats it', async () => {
      const m = await adapter.history!(
        {
          groups: [
            { ticks: [ok], label: '00' },
            { ticks: [ok, { tone: 'error' }], label: '01', minor: true },
            { ticks: [ok], count: 12, label: '02' },
          ],
          size: 'lg',
        },
        freshTarget()
      )
      const groups = parts(m.root, 'history', 'group')
      expect(groups.map((group) => (group as HTMLElement).style.getPropertyValue('--gg-history-n'))).toEqual(['1', '2', '12'])
      expect(part(m.root, 'history', 'strip')!.dataset.size).toBe('lg')
      const cells = parts(m.root, 'history', 'axis-cell')
      expect(cells.map((cell) => cell.textContent)).toEqual(['00', '01', '02'])
      expect(cells.map((cell) => (cell as HTMLElement).style.getPropertyValue('--gg-history-n'))).toEqual(['1', '2', '12'])
      expect(cells[1].hasAttribute('data-minor')).toBe(true)
      expect(part(m.root, 'history', 'axis')!.getAttribute('aria-hidden')).toBe('true')
    })

    test('no ruler when the batches are not named, and none at all when the strip is flat', async () => {
      const unnamed = await adapter.history!({ groups: [{ ticks: [ok] }, { ticks: [ok] }] }, freshTarget())
      expect(part(unnamed.root, 'history', 'axis')).toBeNull()
      const flat = await adapter.history!({ ticks: [ok] }, freshTarget())
      expect(part(flat.root, 'history', 'axis')).toBeNull()
      expect(parts(flat.root, 'history', 'group')).toHaveLength(0)
    })

    test('follows new attempts', async () => {
      const m = await adapter.history!({ ticks: [ok, ok] }, freshTarget())
      await m.update({ ticks: [ok, ok, { tone: 'error' }] })
      expect(parts(m.root, 'history', 'tick')).toHaveLength(3)
      expect(part(m.root, 'history', 'strip')!.getAttribute('aria-label')).toBe('The last 3 attempts: 2 succeeded, 1 failed')
    })
  })
}

export function budgetConformance(adapter: Adapter) {
  const test = adapter.budget ? it : it.skip
  describe('budget', () => {
    test('is a meter and a forecast, and nothing else is drawn', async () => {
      const m = await adapter.budget!({ value: 184_200, max: 250_000, label: 'Tokens', rate: 90, locale: 'en-GB' }, freshTarget())
      const meter = part(m.root, 'meter', 'root')!
      expect(meter).not.toBeNull()
      expect(part(meter, 'meter', 'label')!.textContent).toBe('Tokens')
      expect(part(meter, 'meter', 'value')!.textContent).toBe('184,200 of 250,000')
      const track = part(meter, 'meter', 'track')!
      expect(track.getAttribute('role')).toBe('meter')
      expect(track.getAttribute('aria-valuenow')).toBe('184200')
      expect(part(m.root, 'budget', 'note')!.textContent).toBe('At the current pace the limit will be reached in 12 minutes')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    test('the forecast is a live region, and it exists before it has anything to say', async () => {
      const m = await adapter.budget!({ value: 10, max: 100, label: 'Cost', locale: 'en-GB' }, freshTarget())
      const note = part(m.root, 'budget', 'note')!
      expect(note.getAttribute('aria-live')).toBe('polite')
      expect(note.textContent).toBe('')
      await m.update({ value: 10, max: 100, label: 'Cost', rate: 0.05, locale: 'en-GB' })
      expect(part(m.root, 'budget', 'note')!.textContent).toBe('At the current pace the limit will be reached in 30 minutes')
    })

    test('the tone reaches the bar, and the words say what the colour says', async () => {
      const m = await adapter.budget!({ value: 98, max: 100, label: 'Cost', rate: 0.5, tone: 'warn', locale: 'en-GB' }, freshTarget())
      expect(part(m.root, 'budget', 'root')!.dataset.tone).toBe('warn')
      expect(part(m.root, 'meter', 'root')!.dataset.tone).toBe('warn')
      expect(part(m.root, 'budget', 'note')!.textContent).toBe('At the current pace the limit will be reached in 5 seconds')
      await m.update({ value: 100, max: 100, label: 'Cost', rate: 0.5, tone: 'error', locale: 'en-GB' })
      expect(part(m.root, 'budget', 'note')!.textContent).toBe('The limit is spent')
    })
  })
}
