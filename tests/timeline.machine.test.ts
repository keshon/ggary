import { describe, expect, it } from 'vitest'
import { connect, timelineTimeLabel, type TimelineItem } from '../packages/core/src/components/timeline'

const same = (p: Record<string, unknown>) => p
const utc: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }

const items: TimelineItem[] = [
  { id: 'done', title: 'Run finished', detail: '4 files changed', time: '2026-09-22T14:36:00Z', tone: 'ok' },
  { id: 'index', title: 'Indexing, running', time: '2026-09-22T14:32:00Z', tone: 'running' },
  { id: 'queued', title: 'Queued' },
]

describe('timeline connect', () => {
  it('is an ordered list, named only when a label is given', () => {
    expect(connect({ items }, same).rootProps).toEqual({ 'data-scope': 'timeline', 'data-part': 'root', 'aria-label': undefined })
    expect(connect({ items, label: 'Run history' }, same).rootProps['aria-label']).toBe('Run history')
  })

  it('puts the tone on the item, so everything inside reads it, and none when there is none', () => {
    const api = connect({ items, timeFormat: utc }, same)
    expect(api.getItemProps(items[0]).itemProps).toEqual({ 'data-scope': 'timeline', 'data-part': 'item', 'data-tone': 'ok' })
    expect(api.getItemProps(items[2]).itemProps['data-tone']).toBeUndefined()
  })

  it('hides the dot: the title says the tone in words', () => {
    const parts = connect({ items }, same).getItemProps(items[1])
    expect(parts.dotProps).toEqual({ 'data-scope': 'timeline', 'data-part': 'dot', 'aria-hidden': 'true' })
  })

  it('a time is a machine value and a label in the locale: hour and minute by default', () => {
    const parts = connect({ items, locale: 'en-GB', timeFormat: utc }, same).getItemProps(items[0])
    expect(parts.timeProps).toEqual({ 'data-scope': 'timeline', 'data-part': 'time', dateTime: '2026-09-22T14:36:00Z' })
    expect(parts.timeLabel).toBe('14:36')
    expect(parts.showTime).toBe(true)
    const us = connect({ items, locale: 'en-US', timeFormat: { ...utc, hour12: true } }, same).getItemProps(items[0])
    expect(us.timeLabel).toMatch(/^02:36\sPM$/)
  })

  it('takes a format of the author’s, and a label of the author’s over any format', () => {
    const dated = connect({ items, locale: 'en-GB', timeFormat: { day: 'numeric', month: 'short', timeZone: 'UTC' } }, same)
    // ICU versions differ on "Sep" and "Sept".
    expect(dated.getItemProps(items[0]).timeLabel).toMatch(/^22 Sept?$/)
    const own = { ...items[0], timeLabel: 'just now' }
    expect(dated.getItemProps(own).timeLabel).toBe('just now')
    expect(dated.getItemProps(own).timeProps.dateTime).toBe('2026-09-22T14:36:00Z')
  })

  it('no time, no time element; a time that does not parse is shown as given', () => {
    const api = connect({ items, timeFormat: utc }, same)
    expect(api.getItemProps(items[2]).showTime).toBe(false)
    expect(api.getItemProps(items[2]).timeLabel).toBeUndefined()
    const odd = api.getItemProps({ id: 'x', title: 'Odd', time: 'yesterday' })
    expect(odd.timeLabel).toBe('yesterday')
  })

  it('a label with no machine time still shows, with no datetime to claim', () => {
    const parts = connect({ items }, same).getItemProps({ id: 'y', title: 'Started', timeLabel: 'Monday' })
    expect(parts.showTime).toBe(true)
    expect(parts.timeProps.dateTime).toBeUndefined()
  })

  it('shows a detail only when there is one', () => {
    const api = connect({ items }, same)
    expect(api.getItemProps(items[0]).showDetail).toBe(true)
    expect(api.getItemProps(items[1]).showDetail).toBe(false)
    expect(api.getItemProps({ id: 'z', title: 'Empty', detail: '' }).showDetail).toBe(false)
  })

  it('timelineTimeLabel formats with the formatter it is given', () => {
    const format = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', timeZone: 'UTC' })
    expect(timelineTimeLabel({ id: 'a', title: 'A', time: '2026-09-22T09:05:00Z' }, format)).toBe('09')
  })
})
