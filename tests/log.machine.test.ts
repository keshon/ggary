import { describe, expect, it } from 'vitest'
import { connect, LOG_TONES, logTime, type LogLine } from '../packages/core/src/components/log'

/** A log has no state: the contract is the columns, the tones and the region. */
const same = (p: Record<string, unknown>) => p

const stream: LogLine[] = [
  { level: 'info', time: '14:32:07', text: 'Starting worldgen-01' },
  { level: 'debug', time: '14:32:08', text: 'seed 4127' },
  { level: 'warn', time: '14:32:11', text: 'chunks.bin is busy, retrying in 1 s' },
  { level: 'error', time: '14:32:16', text: 'EBUSY: could not read chunks.bin' },
]

const api = (lines: LogLine[], props: Record<string, unknown> = {}) => connect({ lines, label: 'The log of the run', ...props }, same)

describe('log', () => {
  it('is a region records are added to, and it has a name', () => {
    const { rootProps } = api(stream)
    expect(rootProps.role).toBe('log')
    expect(rootProps['aria-label']).toBe('The log of the run')
  })

  it('does not speak by default: a machine outruns speech', () => {
    expect(api(stream).rootProps['aria-live']).toBe('off')
    expect(api(stream, { announce: true }).rootProps['aria-live']).toBe('polite')
  })

  it('is reachable from the keyboard, because it scrolls', () => {
    expect(api(stream).rootProps.tabIndex).toBe(0)
  })

  it('colours only what asks to be seen', () => {
    expect(api(stream).lines.map((line) => line.lineProps['data-tone'])).toEqual([undefined, undefined, 'warn', 'error'])
    expect(LOG_TONES).toEqual({ warn: 'warn', error: 'error' })
  })

  it('keeps the level as its own axis beside the tone', () => {
    expect(api(stream).lines.map((line) => line.lineProps['data-level'])).toEqual(['info', 'debug', 'warn', 'error'])
  })

  it('writes the level as a word, never as a colour alone', () => {
    expect(api(stream).lines.map((line) => line.level)).toEqual(['info', 'debug', 'warn', 'error'])
    expect(connect({ lines: stream, label: 'x' }, same, { words: { warn: 'внимание' } }).lines[2].level).toBe('внимание')
  })

  describe('the time', () => {
    it('is printed as given when it is already a string', () => {
      expect(logTime('14:32:07', 'en-GB', 'UTC')).toBe('14:32:07')
    })

    it('is a moment to the second, in 24 hours', () => {
      expect(logTime(Date.UTC(2026, 8, 22, 19, 38, 6), 'en-GB', 'UTC')).toBe('19:38:06')
      expect(logTime(new Date(Date.UTC(2026, 8, 22, 0, 4, 9)), 'en-GB', 'UTC')).toBe('00:04:09')
      // Midnight is 00, not 24: the hour cycle is fixed rather than the locale's.
      expect(logTime(Date.UTC(2026, 8, 22, 0, 0, 0), 'en-US', 'UTC')).toBe('00:00:00')
    })

    it('a line with no time, or an impossible one, leaves the column empty', () => {
      expect(logTime(undefined, 'en-GB', 'UTC')).toBe('')
      expect(logTime(Number.NaN, 'en-GB', 'UTC')).toBe('')
    })
  })

  it('keys a line by its own id, and by its place when it has none', () => {
    expect(api(stream).lines.map((line) => line.key)).toEqual(['0', '1', '2', '3'])
    expect(api([{ id: 'a7', level: 'info', text: 'x' }]).lines[0].key).toBe('a7')
  })

  it('draws three cells and names them, so every line shares the columns', () => {
    const { timeProps, levelProps, messageProps } = api(stream)
    expect(timeProps['data-part']).toBe('time')
    expect(levelProps['data-part']).toBe('level')
    expect(messageProps['data-part']).toBe('message')
  })

  it('an empty log is still a named region', () => {
    const { rootProps, lines } = api([])
    expect(lines).toEqual([])
    expect(rootProps['aria-label']).toBe('The log of the run')
  })
})
