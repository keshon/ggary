import { describe, expect, it, vi } from 'vitest'
import { type Adapter, click, freshTarget, keydown, part, parts } from './harness'
import type { TaskItem } from '../../packages/core/src/components/task'
import type { DiffRow } from '../../packages/core/src/components/diff'
import type { Lane } from '../../packages/core/src/components/lanes'
import type { LogLine } from '../../packages/core/src/components/log'

/**
 * The agent layer, in both adapters: what a run counts, what a queue is (a
 * listbox with one tab stop, not a grid), what a strip of past attempts says
 * in words, and what a budget hands to a meter.
 */

const phase = [{ tone: 'ok' as const }, { tone: 'ok' as const }, { tone: 'warn' as const }, { tone: 'running' as const }, {}]

export function runConformance(adapter: Adapter) {
  const test = it
  describe('run', () => {
    test('counts its units, and says the reading in words as well as in dots', async () => {
      const m = await adapter.run({ units: phase, label: 'Agents finished', locale: 'en-GB' }, freshTarget())
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
      const m = await adapter.run({ units: phase, label: 'Agents' }, freshTarget())
      const dots = parts(part(m.root, 'run', 'units')!, 'dot', 'root')
      expect(dots).toHaveLength(5)
      expect(dots.map((dot) => dot.getAttribute('data-tone'))).toEqual(['ok', 'ok', 'warn', 'running', null])
      expect(dots.every((dot) => dot.getAttribute('aria-hidden') === 'true')).toBe(true)
      expect(part(m.root, 'run', 'value')!.getAttribute('aria-hidden')).toBe('true')
    })

    test('follows the work: a unit that finishes moves the count', async () => {
      const m = await adapter.run({ units: phase, label: 'Agents' }, freshTarget())
      await m.update({ units: [{ tone: 'ok' }, { tone: 'ok' }, { tone: 'warn' }, { tone: 'ok' }, { tone: 'running' }], label: 'Agents' })
      expect(part(m.root, 'run', 'units')!.getAttribute('aria-valuenow')).toBe('4')
      expect(parts(m.root, 'dot', 'root').at(-1)!.getAttribute('data-tone')).toBe('running')
    })

    test('the drawn reading can be dropped; the spoken one cannot', async () => {
      const m = await adapter.run({ units: phase, label: 'Agents', showValue: false }, freshTarget())
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
  const test = it
  describe('queue', () => {
    test('is a listbox of flat rows, each with its phase in a tone and in words', async () => {
      const m = await adapter.queue({ tasks, label: 'The queue of agents' }, freshTarget())
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
      const m = await adapter.queue({ tasks, label: 'Queue' }, freshTarget())
      const rows = parts(m.root, 'task', 'root')
      expect(rows.map((row) => row.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
      expect(rows.every((row) => row.getAttribute('aria-selected') === 'false')).toBe(true)
    })

    test('a press chooses, and the stop and the selection move together', async () => {
      const onValueChange = vi.fn()
      const m = await adapter.queue({ tasks, label: 'Queue', onValueChange }, freshTarget())
      await adapter.act(() => click(parts(m.root, 'task', 'root')[2]))
      const rows = parts(m.root, 'task', 'root')
      expect(rows[2].getAttribute('aria-selected')).toBe('true')
      expect(rows[2].getAttribute('tabindex')).toBe('0')
      expect(rows[0].getAttribute('tabindex')).toBe('-1')
      expect(onValueChange).toHaveBeenCalledWith('resources')
    })

    test('the arrows walk the queue and carry the selection with them', async () => {
      const m = await adapter.queue({ tasks, label: 'Queue', defaultValue: 'biomes' }, freshTarget())
      await adapter.act(() => keydown(parts(m.root, 'task', 'root')[1], 'ArrowDown'))
      expect(parts(m.root, 'task', 'root')[2].getAttribute('aria-selected')).toBe('true')
      await adapter.act(() => keydown(parts(m.root, 'task', 'root')[2], 'Home'))
      expect(parts(m.root, 'task', 'root')[0].getAttribute('aria-selected')).toBe('true')
      await adapter.act(() => keydown(parts(m.root, 'task', 'root')[0], 'End'))
      expect(parts(m.root, 'task', 'root')[3].getAttribute('aria-selected')).toBe('true')
    })

    test('a phase that turns over is said once, politely, outside the list', async () => {
      const m = await adapter.queue({ tasks, label: 'Queue' }, freshTarget())
      const status = part(m.root, 'queue', 'status')!
      expect(status.getAttribute('aria-live')).toBe('polite')
      expect(status.closest('[data-scope="queue"][data-part="root"]')).toBeNull()
      expect(status.textContent).toBe('')
      await m.update({ tasks: tasks.map((task) => (task.value === 'resources' ? { ...task, state: 'failed' as const } : task)), label: 'Queue' })
      expect(part(m.root, 'queue', 'status')!.textContent).toBe('Placing the resources: failed')
      expect(parts(m.root, 'task', 'root')[2].getAttribute('data-tone')).toBe('error')
    })

    test('rows that arrive while the work runs are rows like the rest', async () => {
      const m = await adapter.queue({ tasks, label: 'Queue' }, freshTarget())
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
  const test = it
  describe('history', () => {
    test('is one picture with one name: how the attempts ended, in words', async () => {
      const m = await adapter.history({ ticks: [ok, { tone: 'error' }, ok, { empty: true }], label: 'Nightly build' }, freshTarget())
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
      const m = await adapter.history(
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
      const unnamed = await adapter.history({ groups: [{ ticks: [ok] }, { ticks: [ok] }] }, freshTarget())
      expect(part(unnamed.root, 'history', 'axis')).toBeNull()
      const flat = await adapter.history({ ticks: [ok] }, freshTarget())
      expect(part(flat.root, 'history', 'axis')).toBeNull()
      expect(parts(flat.root, 'history', 'group')).toHaveLength(0)
    })

    test('follows new attempts', async () => {
      const m = await adapter.history({ ticks: [ok, ok] }, freshTarget())
      await m.update({ ticks: [ok, ok, { tone: 'error' }] })
      expect(parts(m.root, 'history', 'tick')).toHaveLength(3)
      expect(part(m.root, 'history', 'strip')!.getAttribute('aria-label')).toBe('The last 3 attempts: 2 succeeded, 1 failed')
    })
  })
}

export function budgetConformance(adapter: Adapter) {
  const test = it
  describe('budget', () => {
    test('is a meter and a forecast, and nothing else is drawn', async () => {
      const m = await adapter.budget({ value: 184_200, max: 250_000, label: 'Tokens', rate: 90, locale: 'en-GB' }, freshTarget())
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
      const m = await adapter.budget({ value: 10, max: 100, label: 'Cost', locale: 'en-GB' }, freshTarget())
      const note = part(m.root, 'budget', 'note')!
      expect(note.getAttribute('aria-live')).toBe('polite')
      expect(note.textContent).toBe('')
      await m.update({ value: 10, max: 100, label: 'Cost', rate: 0.05, locale: 'en-GB' })
      expect(part(m.root, 'budget', 'note')!.textContent).toBe('At the current pace the limit will be reached in 30 minutes')
    })

    test('the tone reaches the bar, and the words say what the colour says', async () => {
      const m = await adapter.budget({ value: 98, max: 100, label: 'Cost', rate: 0.5, tone: 'warn', locale: 'en-GB' }, freshTarget())
      expect(part(m.root, 'budget', 'root')!.dataset.tone).toBe('warn')
      expect(part(m.root, 'meter', 'root')!.dataset.tone).toBe('warn')
      expect(part(m.root, 'budget', 'note')!.textContent).toBe('At the current pace the limit will be reached in 5 seconds')
      await m.update({ value: 100, max: 100, label: 'Cost', rate: 0.5, tone: 'error', locale: 'en-GB' })
      expect(part(m.root, 'budget', 'note')!.textContent).toBe('The limit is spent')
    })
  })
}
/**
 * The agent layer: a machine's work while it is going on. None of the four has
 * a machine, so what every adapter has to get right is the markup — which
 * element carries which meaning, and what is said where colour is not enough.
 */

export function stepConformance(adapter: Adapter) {
  const test = it
  const call = { name: 'read_file', argument: 'terrain/heightmap.ts' }

  describe('step', () => {
    test('is a details and a summary, so the expansion is the platform’s', async () => {
      const m = await adapter.step({ ...call, state: 'ok' }, freshTarget())
      const root = part(m.root, 'step', 'root') as HTMLDetailsElement
      expect(root.tagName).toBe('DETAILS')
      expect(part(m.root, 'step', 'head')!.tagName).toBe('SUMMARY')
      expect(root.open).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    test('carries the phase as data and the colour as a tone, with the kit’s dot inside', async () => {
      const m = await adapter.step({ ...call, state: 'failed' }, freshTarget())
      const root = part(m.root, 'step', 'root')!
      expect(root.dataset.state).toBe('failed')
      expect(root.dataset.tone).toBe('error')
      // The dot is the kit's, reading the tone from the step around it: it
      // carries no tone of its own and draws nothing to a screen reader.
      const dot = part(m.root, 'dot', 'root')!
      expect(dot.dataset.tone).toBeUndefined()
      expect(dot.getAttribute('aria-hidden')).toBe('true')
    })

    test('says the phase in words as well, since a colour is spoken by nothing', async () => {
      const m = await adapter.step({ ...call, state: 'ok' }, freshTarget())
      expect(part(m.root, 'step', 'status')!.textContent).toBe('Succeeded')
      await m.update({ ...call, state: 'running' })
      expect(part(m.root, 'step', 'status')!.textContent).toBe('Running')
    })

    test('reads volume then time, and keeps the whole argument in a title', async () => {
      const m = await adapter.step({ ...call, detail: '240 lines', duration: 1400, locale: 'en-GB' }, freshTarget())
      expect(part(m.root, 'step', 'meta')!.textContent).toBe('240 lines · 1.4 s')
      expect(part(m.root, 'step', 'argument')!.getAttribute('title')).toBe('terrain/heightmap.ts')
    })

    test('a cut output names its number in words and asks for the rest', async () => {
      let asked = 0
      const m = await adapter.step(
        { ...call, defaultOpen: true, output: 'export function decode()', outputLines: 240, locale: 'en-GB', onShowAll: () => (asked += 1) },
        freshTarget()
      )
      expect(part(m.root, 'step', 'output')!.dataset.truncated).toBe('true')
      const more = part(m.root, 'step', 'more') as HTMLButtonElement
      expect(more.textContent).toBe('Show all 240 lines')
      expect(more.type).toBe('button')
      await adapter.act(() => click(more))
      expect(asked).toBe(1)
    })

    test('an output with nothing hidden makes no claim and offers no button', async () => {
      const m = await adapter.step({ ...call, defaultOpen: true, output: 'ok' }, freshTarget())
      expect(part(m.root, 'step', 'output')!.dataset.truncated).toBeUndefined()
      expect(part(m.root, 'step', 'more')).toBeNull()
    })

    test('opens once, and then the reader’s own toggling stands', async () => {
      const m = await adapter.step({ ...call, defaultOpen: true, input: 'the arguments' }, freshTarget())
      const root = part(m.root, 'step', 'root') as HTMLDetailsElement
      expect(root.open).toBe(true)
      await adapter.act(() => {
        root.open = false
      })
      // A step that has moved on — the call finished — must not spring open again.
      await m.update({ ...call, state: 'ok', defaultOpen: true, input: 'the arguments' })
      expect((part(m.root, 'step', 'root') as HTMLDetailsElement).open).toBe(false)
    })

    test('a step still writing is busy, and carries the kit’s caret', async () => {
      const m = await adapter.step({ ...call, state: 'running', defaultOpen: true, streaming: true, output: 'half a line' }, freshTarget())
      expect(part(m.root, 'step', 'root')!.getAttribute('aria-busy')).toBe('true')
      expect(part(m.root, 'step', 'output-body')!.textContent).toContain('half a line')
      expect(part(m.root, 'caret', 'root')).not.toBeNull()
      await m.update({ ...call, state: 'ok', defaultOpen: true, streaming: false, output: 'half a line, then the rest' })
      expect(part(m.root, 'step', 'root')!.getAttribute('aria-busy')).toBeNull()
      expect(part(m.root, 'caret', 'root')).toBeNull()
    })
  })
}

export function logConformance(adapter: Adapter) {
  const test = it
  const lines: LogLine[] = [
    { id: 'a', level: 'info', time: '14:32:07', text: 'Starting worldgen-01' },
    { id: 'b', level: 'warn', time: '14:32:11', text: 'chunks.bin is busy' },
    { id: 'c', level: 'error', time: '14:32:16', text: 'EBUSY: could not read chunks.bin' },
  ]

  describe('log', () => {
    test('is a named region records are added to, and the keyboard can reach its scroll', async () => {
      const m = await adapter.log({ lines, label: 'The log of the run' }, freshTarget())
      const root = part(m.root, 'log', 'root')!
      expect(root.getAttribute('role')).toBe('log')
      expect(root.getAttribute('aria-label')).toBe('The log of the run')
      expect(root.getAttribute('tabindex')).toBe('0')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    test('does not speak unless the page says its log speaks slowly', async () => {
      const m = await adapter.log({ lines, label: 'The log' }, freshTarget())
      expect(part(m.root, 'log', 'root')!.getAttribute('aria-live')).toBe('off')
      await m.update({ lines, label: 'The log', announce: true })
      expect(part(m.root, 'log', 'root')!.getAttribute('aria-live')).toBe('polite')
    })

    test('is three cells to a line, and the level is a word beside the colour', async () => {
      const m = await adapter.log({ lines, label: 'The log' }, freshTarget())
      const rows = parts(m.root, 'log', 'line')
      expect(rows).toHaveLength(3)
      expect(parts(m.root, 'log', 'time').map((cell) => cell.textContent)).toEqual(['14:32:07', '14:32:11', '14:32:16'])
      expect(parts(m.root, 'log', 'level').map((cell) => cell.textContent)).toEqual(['info', 'warn', 'error'])
      expect(parts(m.root, 'log', 'message')[2].textContent).toBe('EBUSY: could not read chunks.bin')
    })

    test('tones only what asks to be seen, and keeps the level as its own axis', async () => {
      const m = await adapter.log({ lines, label: 'The log' }, freshTarget())
      const rows = parts(m.root, 'log', 'line')
      expect(rows.map((row) => row.dataset.tone)).toEqual([undefined, 'warn', 'error'])
      expect(rows.map((row) => row.dataset.level)).toEqual(['info', 'warn', 'error'])
    })

    test('the newest line arrives at the end, and the old ones stay where they were', async () => {
      const m = await adapter.log({ lines, label: 'The log' }, freshTarget())
      await m.update({ lines: [...lines, { id: 'd', level: 'info', time: '14:32:19', text: 'done' }], label: 'The log' })
      const rows = parts(m.root, 'log', 'line')
      expect(rows).toHaveLength(4)
      expect(parts(m.root, 'log', 'message').at(-1)!.textContent).toBe('done')
    })

    test('an empty log is still a named region', async () => {
      const m = await adapter.log({ lines: [], label: 'The log' }, freshTarget())
      expect(parts(m.root, 'log', 'line')).toHaveLength(0)
      expect(part(m.root, 'log', 'root')!.getAttribute('aria-label')).toBe('The log')
    })
  })
}

export function diffConformance(adapter: Adapter) {
  const test = it
  const rows: DiffRow[] = [
    { kind: 'fold', count: 118 },
    { kind: 'context', text: '  const seed = opts.seed ?? 0;', before: 119, after: 119 },
    { kind: 'del', text: '  const noise = simplex2(seed);', before: 120 },
    { kind: 'add', text: '  const noise = simplex2(seed, { octaves: 3 });', after: 120 },
  ]

  describe('diff', () => {
    test('heads with what became of the file, its path and what moved', async () => {
      const m = await adapter.diff({ path: 'src/world/biomes.ts', change: 'modified', rows, locale: 'en-GB' }, freshTarget())
      // The mark is the kit's FileChange, not a part of the diff.
      expect(part(m.root, 'file-change', 'root')!.dataset.change).toBe('modified')
      expect(part(m.root, 'diff', 'path')!.getAttribute('title')).toBe('src/world/biomes.ts')
      expect(part(m.root, 'diff', 'added')!.textContent).toBe('+1')
      expect(part(m.root, 'diff', 'removed')!.textContent).toBe('−1')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    test('marks a changed line and leaves a context line unmarked', async () => {
      const m = await adapter.diff({ path: 'a.ts', rows }, freshTarget())
      expect(parts(m.root, 'diff', 'row').map((row) => row.dataset.kind)).toEqual([undefined, 'del', 'add'])
    })

    test('a row holds the code alone: the numbers are not spoken and not selectable', async () => {
      const m = await adapter.diff({ path: 'a.ts', rows }, freshTarget())
      const row = parts(m.root, 'diff', 'row')[1]
      expect(part(row, 'diff', 'code')!.textContent).toBe('  const noise = simplex2(seed);')
      const numbers = parts(row, 'diff', 'num')
      expect(numbers).toHaveLength(2)
      expect(numbers.map((number) => number.getAttribute('aria-hidden'))).toEqual(['true', 'true'])
      expect(numbers.map((number) => number.textContent)).toEqual(['120', ''])
    })

    test('a folded stretch names how many lines went', async () => {
      const m = await adapter.diff({ path: 'a.ts', rows, locale: 'en-GB' }, freshTarget())
      expect(part(m.root, 'diff', 'fold')!.textContent).toBe('118 lines skipped')
    })

    test('works the rows out from two texts when that is what it is given', async () => {
      const m = await adapter.diff({ path: 'a.ts', before: 'a\nb\nc\n', after: 'a\nB\nc\n' }, freshTarget())
      expect(parts(m.root, 'diff', 'row').map((row) => row.dataset.kind)).toEqual([undefined, 'del', 'add', undefined])
      expect(part(m.root, 'diff', 'added')!.textContent).toBe('+1')
      await m.update({ path: 'a.ts', before: 'a\nb\nc\n', after: 'a\nb\nc\n' })
      expect(parts(m.root, 'diff', 'row').every((row) => row.dataset.kind === undefined)).toBe(true)
      expect(part(m.root, 'diff', 'added')!.textContent).toBe('+0')
    })

    test('the body is a named region the keyboard can scroll', async () => {
      const m = await adapter.diff({ path: 'src/world/biomes.ts', rows }, freshTarget())
      const body = part(m.root, 'diff', 'body')!
      expect(body.getAttribute('role')).toBe('region')
      expect(body.getAttribute('aria-label')).toBe('src/world/biomes.ts')
      expect(body.getAttribute('tabindex')).toBe('0')
      expect(body.getAttribute('dir')).toBe('ltr')
    })
  })
}

export function lanesConformance(adapter: Adapter) {
  const test = it
  const workers: Lane[] = [
    { id: 'worldgen-01', label: 'worldgen-01', spans: [{ label: 'reading files', start: 0, end: 4000, tone: 'ok' }] },
    { id: 'biomes-04', label: 'biomes-04', spans: [{ label: 'placing', start: 6000, end: 10_000, tone: 'running' }] },
  ]

  describe('lanes', () => {
    test('is a lane per worker with its name, and one picture with one name', async () => {
      const m = await adapter.lanes({ lanes: workers, label: 'The workers of run 4127', locale: 'en-GB' }, freshTarget())
      const root = part(m.root, 'lanes', 'root')!
      expect(root.getAttribute('aria-label')).toBe('The workers of run 4127')
      expect(parts(m.root, 'lanes', 'lane')).toHaveLength(2)
      expect(parts(m.root, 'lanes', 'label').map((label) => label.textContent)).toEqual(['worldgen-01', 'biomes-04'])
      expect(m.root.querySelector('[class]')).toBeNull()
      expect(m.root.querySelector('svg')).toBeNull()
    })

    test('places every segment on one shared scale, by two custom properties', async () => {
      const m = await adapter.lanes({ lanes: workers, label: 'Workers', locale: 'en-GB' }, freshTarget())
      const spans = parts(m.root, 'lanes', 'span')
      expect(spans.map((span) => span.style.getPropertyValue('--gg-lane-start').trim())).toEqual(['0', '60'])
      expect(spans.map((span) => span.style.getPropertyValue('--gg-lane-span').trim())).toEqual(['40', '40'])
      expect(spans.map((span) => span.dataset.tone)).toEqual(['ok', 'running'])
    })

    test('says each lane’s work in words, outcome and all', async () => {
      const m = await adapter.lanes({ lanes: workers, label: 'Workers', locale: 'en-GB' }, freshTarget())
      const spoken = parts(m.root, 'lanes', 'lane-text').map((text) => text.textContent)
      expect(spoken[0]).toBe(': reading files, 0.0 s to 4.0 s, succeeded')
      expect(spoken[1]).toBe(': placing, 6.0 s to 10.0 s, running')
      expect(parts(m.root, 'lanes', 'span')[0].getAttribute('title')).toBe('reading files — 0.0 s → 4.0 s')
    })

    test('follows the work as it grows, and keeps one scale while it does', async () => {
      const m = await adapter.lanes({ lanes: workers, label: 'Workers', locale: 'en-GB' }, freshTarget())
      const longer: Lane[] = [workers[0], { ...workers[1], spans: [{ label: 'placing', start: 6000, end: 20_000, tone: 'ok' }] }]
      await m.update({ lanes: longer, label: 'Workers', locale: 'en-GB' })
      const spans = parts(m.root, 'lanes', 'span')
      expect(spans.map((span) => span.style.getPropertyValue('--gg-lane-span').trim())).toEqual(['20', '70'])
    })

    test('a worker with nothing on the axis still says so', async () => {
      const m = await adapter.lanes({ lanes: [{ id: 'idle', label: 'idle', spans: [] }], label: 'Workers' }, freshTarget())
      expect(parts(m.root, 'lanes', 'span')).toHaveLength(0)
      expect(part(m.root, 'lanes', 'lane-text')!.textContent).toBe(': nothing yet')
    })
  })
}
