import { describe, expect, it } from 'vitest'
import { connect, lanesWindow, type Lane } from '../packages/core/src/components/lanes'

/** Lanes have no state: the contract is the arithmetic and the words. */
const same = (p: Record<string, unknown>) => p

const s = (seconds: number) => seconds * 1000

const workers: Lane[] = [
  { id: 'worldgen-01', label: 'worldgen-01', spans: [{ label: 'reading files', start: s(0), end: s(4), tone: 'ok' }] },
  {
    id: 'biomes-04',
    label: 'biomes-04',
    spans: [
      { label: 'sampling', start: s(3), end: s(6), tone: 'ok' },
      { label: 'placing', start: s(6), end: s(10), tone: 'running' },
    ],
  },
]

const api = (lanes: Lane[], props: Record<string, unknown> = {}) => connect({ lanes, label: 'The workers of run 4127', locale: 'en-GB', ...props }, same)

const box = (lane: number, span: number) => api(workers).lanes[lane].spans[span].spanProps.style as Record<string, number>

describe('the window', () => {
  it('is the work, when nobody says otherwise', () => {
    expect(lanesWindow(workers)).toEqual({ start: 0, end: s(10) })
  })

  it('is the owner’s when they give one: a run compared with another has to share a scale', () => {
    expect(lanesWindow(workers, s(-2), s(20))).toEqual({ start: s(-2), end: s(20) })
  })

  it('never divides by nothing', () => {
    expect(lanesWindow([])).toEqual({ start: 0, end: 1 })
    expect(lanesWindow([{ id: 'a', label: 'a', spans: [{ label: 'x', start: 7, end: 7 }] }])).toEqual({ start: 7, end: 8 })
  })
})

describe('lanes', () => {
  it('places every segment on ONE scale, so the lanes can be compared at all', () => {
    expect(box(0, 0)).toEqual({ '--gg-lane-start': 0, '--gg-lane-span': 40 })
    expect(box(1, 0)).toEqual({ '--gg-lane-start': 30, '--gg-lane-span': 30 })
    expect(box(1, 1)).toEqual({ '--gg-lane-start': 60, '--gg-lane-span': 40 })
  })

  it('hands the geometry to CSS by name, as the rest of the kit does', () => {
    const style = box(0, 0)
    expect(Object.keys(style)).toEqual(['--gg-lane-start', '--gg-lane-span'])
  })

  it('cuts a segment to the window rather than letting it run off the axis', () => {
    const cut = connect({ lanes: workers, label: 'x', start: s(2), end: s(8) }, same)
    expect(cut.lanes[0].spans[0].spanProps.style).toEqual({ '--gg-lane-start': 0, '--gg-lane-span': 33.3333 })
    expect(cut.lanes[1].spans[1].spanProps.style).toEqual({ '--gg-lane-start': 66.6667, '--gg-lane-span': 33.3333 })
  })

  it('takes a segment recorded backwards the way round it happened', () => {
    const back = connect({ lanes: [{ id: 'a', label: 'a', spans: [{ label: 'x', start: s(8), end: s(2) }] }], label: 'x', start: 0, end: s(10) }, same)
    expect(back.lanes[0].spans[0].spanProps.style).toEqual({ '--gg-lane-start': 20, '--gg-lane-span': 60 })
  })

  it('leaves out a segment with no times rather than placing it at nothing', () => {
    const broken = connect(
      { lanes: [{ id: 'a', label: 'a', spans: [{ label: 'x', start: Number.NaN, end: s(2) }, { label: 'y', start: 0, end: s(2) }] }], label: 'x' },
      same
    )
    expect(broken.lanes[0].spans).toHaveLength(1)
    expect(broken.lanes[0].spans[0].span.label).toBe('y')
  })

  it('says a lane’s work in words: a rectangle is spoken by nothing', () => {
    expect(api(workers).lanes[1].text).toBe(': sampling, 3.0 s to 6.0 s, succeeded; placing, 6.0 s to 10.0 s, running')
  })

  it('repeats the outcome in words, never in colour alone', () => {
    const tones = connect(
      {
        lanes: [
          {
            id: 'a',
            label: 'a',
            spans: [
              { label: 'p', start: 0, end: 1 },
              { label: 'q', start: 0, end: 1, tone: 'warn' },
              { label: 'r', start: 0, end: 1, tone: 'error' },
            ],
          },
        ],
        label: 'x',
        locale: 'en-GB',
      },
      same
    )
    expect(tones.lanes[0].text).toContain('done')
    expect(tones.lanes[0].text).toContain('with warnings')
    expect(tones.lanes[0].text).toContain('failed')
  })

  it('a worker with nothing on the axis says so', () => {
    expect(api([{ id: 'idle', label: 'idle', spans: [] }]).lanes[0].text).toBe(': nothing yet')
  })

  it('the fixed words are the page’s to change', () => {
    const russian = connect({ lanes: workers, label: 'x', locale: 'ru-RU' }, same, { words: {
      time: (value) => `${value} с`,
      ok: 'готово',
      span: (label, from, to, outcome) => `${label}: ${from} — ${to}, ${outcome}`,
    } })
    expect(russian.lanes[0].text).toBe(': reading files: 0,0 с — 4,0 с, готово')
  })

  it('names the picture, keeps the worker’s name whole in a title, and marks a segment for a pointer', () => {
    const one = api(workers)
    expect(one.rootProps['aria-label']).toBe('The workers of run 4127')
    expect(one.lanes[0].labelProps.title).toBe('worldgen-01')
    expect(one.lanes[0].spans[0].spanProps.title).toBe('reading files — 0.0 s → 4.0 s')
  })

  it('carries a tone as a tone, and nothing when there is none', () => {
    expect(api(workers).lanes[1].spans.map((span) => span.spanProps['data-tone'])).toEqual(['ok', 'running'])
    expect(api([{ id: 'a', label: 'a', spans: [{ label: 'x', start: 0, end: 1 }] }]).lanes[0].spans[0].spanProps['data-tone']).toBeUndefined()
  })

  it('keys a segment by its own id, and by its place when it has none', () => {
    expect(api(workers).lanes[1].spans.map((span) => span.key)).toEqual(['0', '1'])
    expect(api([{ id: 'a', label: 'a', spans: [{ id: 'first', label: 'x', start: 0, end: 1 }] }]).lanes[0].spans[0].key).toBe('first')
  })
})
