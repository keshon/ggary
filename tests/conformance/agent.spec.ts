import { describe, expect, it } from 'vitest'
import { type Adapter, click, freshTarget, part, parts } from './harness'
import type { DiffRow } from '../../packages/core/src/components/diff'
import type { Lane } from '../../packages/core/src/components/lanes'
import type { LogLine } from '../../packages/core/src/components/log'

/**
 * The agent layer: a machine's work while it is going on. None of the four has
 * a machine, so what every adapter has to get right is the markup — which
 * element carries which meaning, and what is said where colour is not enough.
 */

export function stepConformance(adapter: Adapter) {
  const test = adapter.step ? it : it.skip
  const call = { name: 'read_file', argument: 'terrain/heightmap.ts' }

  describe('step', () => {
    test('is a details and a summary, so the expansion is the platform’s', async () => {
      const m = await adapter.step!({ ...call, state: 'ok' }, freshTarget())
      const root = part(m.root, 'step', 'root') as HTMLDetailsElement
      expect(root.tagName).toBe('DETAILS')
      expect(part(m.root, 'step', 'head')!.tagName).toBe('SUMMARY')
      expect(root.open).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    test('carries the phase as data and the colour as a tone, with the kit’s dot inside', async () => {
      const m = await adapter.step!({ ...call, state: 'failed' }, freshTarget())
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
      const m = await adapter.step!({ ...call, state: 'ok' }, freshTarget())
      expect(part(m.root, 'step', 'status')!.textContent).toBe('Succeeded')
      await m.update({ ...call, state: 'running' })
      expect(part(m.root, 'step', 'status')!.textContent).toBe('Running')
    })

    test('reads volume then time, and keeps the whole argument in a title', async () => {
      const m = await adapter.step!({ ...call, detail: '240 lines', duration: 1400, locale: 'en-GB' }, freshTarget())
      expect(part(m.root, 'step', 'meta')!.textContent).toBe('240 lines · 1.4 s')
      expect(part(m.root, 'step', 'argument')!.getAttribute('title')).toBe('terrain/heightmap.ts')
    })

    test('a cut output names its number in words and asks for the rest', async () => {
      let asked = 0
      const m = await adapter.step!(
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
      const m = await adapter.step!({ ...call, defaultOpen: true, output: 'ok' }, freshTarget())
      expect(part(m.root, 'step', 'output')!.dataset.truncated).toBeUndefined()
      expect(part(m.root, 'step', 'more')).toBeNull()
    })

    test('opens once, and then the reader’s own toggling stands', async () => {
      const m = await adapter.step!({ ...call, defaultOpen: true, input: 'the arguments' }, freshTarget())
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
      const m = await adapter.step!({ ...call, state: 'running', defaultOpen: true, streaming: true, output: 'half a line' }, freshTarget())
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
  const test = adapter.log ? it : it.skip
  const lines: LogLine[] = [
    { id: 'a', level: 'info', time: '14:32:07', text: 'Starting worldgen-01' },
    { id: 'b', level: 'warn', time: '14:32:11', text: 'chunks.bin is busy' },
    { id: 'c', level: 'error', time: '14:32:16', text: 'EBUSY: could not read chunks.bin' },
  ]

  describe('log', () => {
    test('is a named region records are added to, and the keyboard can reach its scroll', async () => {
      const m = await adapter.log!({ lines, label: 'The log of the run' }, freshTarget())
      const root = part(m.root, 'log', 'root')!
      expect(root.getAttribute('role')).toBe('log')
      expect(root.getAttribute('aria-label')).toBe('The log of the run')
      expect(root.getAttribute('tabindex')).toBe('0')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    test('does not speak unless the page says its log speaks slowly', async () => {
      const m = await adapter.log!({ lines, label: 'The log' }, freshTarget())
      expect(part(m.root, 'log', 'root')!.getAttribute('aria-live')).toBe('off')
      await m.update({ lines, label: 'The log', announce: true })
      expect(part(m.root, 'log', 'root')!.getAttribute('aria-live')).toBe('polite')
    })

    test('is three cells to a line, and the level is a word beside the colour', async () => {
      const m = await adapter.log!({ lines, label: 'The log' }, freshTarget())
      const rows = parts(m.root, 'log', 'line')
      expect(rows).toHaveLength(3)
      expect(parts(m.root, 'log', 'time').map((cell) => cell.textContent)).toEqual(['14:32:07', '14:32:11', '14:32:16'])
      expect(parts(m.root, 'log', 'level').map((cell) => cell.textContent)).toEqual(['info', 'warn', 'error'])
      expect(parts(m.root, 'log', 'message')[2].textContent).toBe('EBUSY: could not read chunks.bin')
    })

    test('tones only what asks to be seen, and keeps the level as its own axis', async () => {
      const m = await adapter.log!({ lines, label: 'The log' }, freshTarget())
      const rows = parts(m.root, 'log', 'line')
      expect(rows.map((row) => row.dataset.tone)).toEqual([undefined, 'warn', 'error'])
      expect(rows.map((row) => row.dataset.level)).toEqual(['info', 'warn', 'error'])
    })

    test('the newest line arrives at the end, and the old ones stay where they were', async () => {
      const m = await adapter.log!({ lines, label: 'The log' }, freshTarget())
      await m.update({ lines: [...lines, { id: 'd', level: 'info', time: '14:32:19', text: 'done' }], label: 'The log' })
      const rows = parts(m.root, 'log', 'line')
      expect(rows).toHaveLength(4)
      expect(parts(m.root, 'log', 'message').at(-1)!.textContent).toBe('done')
    })

    test('an empty log is still a named region', async () => {
      const m = await adapter.log!({ lines: [], label: 'The log' }, freshTarget())
      expect(parts(m.root, 'log', 'line')).toHaveLength(0)
      expect(part(m.root, 'log', 'root')!.getAttribute('aria-label')).toBe('The log')
    })
  })
}

export function diffConformance(adapter: Adapter) {
  const test = adapter.diff ? it : it.skip
  const rows: DiffRow[] = [
    { kind: 'fold', count: 118 },
    { kind: 'context', text: '  const seed = opts.seed ?? 0;', before: 119, after: 119 },
    { kind: 'del', text: '  const noise = simplex2(seed);', before: 120 },
    { kind: 'add', text: '  const noise = simplex2(seed, { octaves: 3 });', after: 120 },
  ]

  describe('diff', () => {
    test('heads with what became of the file, its path and what moved', async () => {
      const m = await adapter.diff!({ path: 'src/world/biomes.ts', change: 'modified', rows, locale: 'en-GB' }, freshTarget())
      // The mark is the kit's FileChange, not a part of the diff.
      expect(part(m.root, 'file-change', 'root')!.dataset.change).toBe('modified')
      expect(part(m.root, 'diff', 'path')!.getAttribute('title')).toBe('src/world/biomes.ts')
      expect(part(m.root, 'diff', 'added')!.textContent).toBe('+1')
      expect(part(m.root, 'diff', 'removed')!.textContent).toBe('−1')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    test('marks a changed line and leaves a context line unmarked', async () => {
      const m = await adapter.diff!({ path: 'a.ts', rows }, freshTarget())
      expect(parts(m.root, 'diff', 'row').map((row) => row.dataset.kind)).toEqual([undefined, 'del', 'add'])
    })

    test('a row holds the code alone: the numbers are not spoken and not selectable', async () => {
      const m = await adapter.diff!({ path: 'a.ts', rows }, freshTarget())
      const row = parts(m.root, 'diff', 'row')[1]
      expect(part(row, 'diff', 'code')!.textContent).toBe('  const noise = simplex2(seed);')
      const numbers = parts(row, 'diff', 'num')
      expect(numbers).toHaveLength(2)
      expect(numbers.map((number) => number.getAttribute('aria-hidden'))).toEqual(['true', 'true'])
      expect(numbers.map((number) => number.textContent)).toEqual(['120', ''])
    })

    test('a folded stretch names how many lines went', async () => {
      const m = await adapter.diff!({ path: 'a.ts', rows, locale: 'en-GB' }, freshTarget())
      expect(part(m.root, 'diff', 'fold')!.textContent).toBe('118 lines skipped')
    })

    test('works the rows out from two texts when that is what it is given', async () => {
      const m = await adapter.diff!({ path: 'a.ts', before: 'a\nb\nc\n', after: 'a\nB\nc\n' }, freshTarget())
      expect(parts(m.root, 'diff', 'row').map((row) => row.dataset.kind)).toEqual([undefined, 'del', 'add', undefined])
      expect(part(m.root, 'diff', 'added')!.textContent).toBe('+1')
      await m.update({ path: 'a.ts', before: 'a\nb\nc\n', after: 'a\nb\nc\n' })
      expect(parts(m.root, 'diff', 'row').every((row) => row.dataset.kind === undefined)).toBe(true)
      expect(part(m.root, 'diff', 'added')!.textContent).toBe('+0')
    })

    test('the body is a named region the keyboard can scroll', async () => {
      const m = await adapter.diff!({ path: 'src/world/biomes.ts', rows }, freshTarget())
      const body = part(m.root, 'diff', 'body')!
      expect(body.getAttribute('role')).toBe('region')
      expect(body.getAttribute('aria-label')).toBe('src/world/biomes.ts')
      expect(body.getAttribute('tabindex')).toBe('0')
      expect(body.getAttribute('dir')).toBe('ltr')
    })
  })
}

export function lanesConformance(adapter: Adapter) {
  const test = adapter.lanes ? it : it.skip
  const workers: Lane[] = [
    { id: 'worldgen-01', label: 'worldgen-01', spans: [{ label: 'reading files', start: 0, end: 4000, tone: 'ok' }] },
    { id: 'biomes-04', label: 'biomes-04', spans: [{ label: 'placing', start: 6000, end: 10_000, tone: 'running' }] },
  ]

  describe('lanes', () => {
    test('is a lane per worker with its name, and one picture with one name', async () => {
      const m = await adapter.lanes!({ lanes: workers, label: 'The workers of run 4127', locale: 'en-GB' }, freshTarget())
      const root = part(m.root, 'lanes', 'root')!
      expect(root.getAttribute('aria-label')).toBe('The workers of run 4127')
      expect(parts(m.root, 'lanes', 'lane')).toHaveLength(2)
      expect(parts(m.root, 'lanes', 'label').map((label) => label.textContent)).toEqual(['worldgen-01', 'biomes-04'])
      expect(m.root.querySelector('[class]')).toBeNull()
      expect(m.root.querySelector('svg')).toBeNull()
    })

    test('places every segment on one shared scale, by two custom properties', async () => {
      const m = await adapter.lanes!({ lanes: workers, label: 'Workers', locale: 'en-GB' }, freshTarget())
      const spans = parts(m.root, 'lanes', 'span')
      expect(spans.map((span) => span.style.getPropertyValue('--gg-lane-start').trim())).toEqual(['0', '60'])
      expect(spans.map((span) => span.style.getPropertyValue('--gg-lane-span').trim())).toEqual(['40', '40'])
      expect(spans.map((span) => span.dataset.tone)).toEqual(['ok', 'running'])
    })

    test('says each lane’s work in words, outcome and all', async () => {
      const m = await adapter.lanes!({ lanes: workers, label: 'Workers', locale: 'en-GB' }, freshTarget())
      const spoken = parts(m.root, 'lanes', 'lane-text').map((text) => text.textContent)
      expect(spoken[0]).toBe(': reading files, 0.0 s to 4.0 s, succeeded')
      expect(spoken[1]).toBe(': placing, 6.0 s to 10.0 s, running')
      expect(parts(m.root, 'lanes', 'span')[0].getAttribute('title')).toBe('reading files — 0.0 s → 4.0 s')
    })

    test('follows the work as it grows, and keeps one scale while it does', async () => {
      const m = await adapter.lanes!({ lanes: workers, label: 'Workers', locale: 'en-GB' }, freshTarget())
      const longer: Lane[] = [workers[0], { ...workers[1], spans: [{ label: 'placing', start: 6000, end: 20_000, tone: 'ok' }] }]
      await m.update({ lanes: longer, label: 'Workers', locale: 'en-GB' })
      const spans = parts(m.root, 'lanes', 'span')
      expect(spans.map((span) => span.style.getPropertyValue('--gg-lane-span').trim())).toEqual(['20', '70'])
    })

    test('a worker with nothing on the axis still says so', async () => {
      const m = await adapter.lanes!({ lanes: [{ id: 'idle', label: 'idle', spans: [] }], label: 'Workers' }, freshTarget())
      expect(parts(m.root, 'lanes', 'span')).toHaveLength(0)
      expect(part(m.root, 'lanes', 'lane-text')!.textContent).toBe(': nothing yet')
    })
  })
}
