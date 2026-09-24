import { describe, expect, it } from 'vitest'
import { connect, type LegendItem } from '../packages/core/src/components/legend'

/** A legend has no state: the contract is the prop bags and the name of the list. */
const same = (p: Record<string, unknown>) => p

const items: LegendItem[] = [
  { label: 'Render', series: 1, value: '18.2 s' },
  { label: 'Physics', series: 2, value: '11.5 s' },
]

describe('legend', () => {
  it('names its parts and hands back the items in the order given', () => {
    const api = connect({ items }, same)
    expect(api.rootProps['data-scope']).toBe('legend')
    expect(api.items).toEqual(items)
    const first = api.getItemProps(items[0]!)
    expect(first.itemProps['data-part']).toBe('item')
    expect(first.labelProps['data-part']).toBe('label')
    expect(first.valueProps['data-part']).toBe('value')
  })

  it('the swatch carries the series as data and is hidden: the label says which', () => {
    const api = connect({ items }, same)
    expect(api.getItemProps(items[0]!).swatchProps).toEqual({
      'data-scope': 'legend',
      'data-part': 'swatch',
      'data-series': '1',
      'aria-hidden': 'true',
    })
    expect(api.getItemProps(items[1]!).swatchProps['data-series']).toBe('2')
  })

  it('one series is not a category: with no series the swatch names none, and the theme gives it the accent', () => {
    const api = connect({ items: [{ label: 'Runs' }] }, same)
    expect(api.getItemProps({ label: 'Runs' }).swatchProps['data-series']).toBeUndefined()
    expect(api.getItemProps({ label: 'Runs', series: 0 as 1 }).swatchProps['data-series']).toBeUndefined()
    expect(api.getItemProps({ label: 'Runs', series: 6 }).swatchProps['data-series']).toBe('6')
    expect(api.getItemProps({ label: 'Runs', series: 7 as 6 }).swatchProps['data-series']).toBeUndefined()
  })

  it('shows a value only when there is one', () => {
    const api = connect({ items }, same)
    expect(api.getItemProps({ label: 'Render', value: '18.2 s' }).showValue).toBe(true)
    expect(api.getItemProps({ label: 'Render' }).showValue).toBe(false)
    expect(api.getItemProps({ label: 'Render', value: '' }).showValue).toBe(false)
  })

  it('the list has a name: the author’s, the words’, or "Chart key"', () => {
    expect(connect({ items }, same).rootProps['aria-label']).toBe('Chart key')
    expect(connect({ items, label: 'Time by module' }, same).rootProps['aria-label']).toBe('Time by module')
    expect(connect({ items }, same, { words: { key: 'Условные обозначения' } }).rootProps['aria-label']).toBe('Условные обозначения')
    // The author's name wins over the default in any language.
    expect(connect({ items, label: 'Time by module' }, same, { words: { key: 'x' } }).rootProps['aria-label']).toBe('Time by module')
  })

  it('runs along the foot of a chart by default, down its side when asked', () => {
    expect(connect({ items }, same).rootProps['data-direction']).toBe('row')
    expect(connect({ items, direction: 'column' }, same).rootProps['data-direction']).toBe('column')
  })

  it('is read, not operated: no role, no tab stop', () => {
    const api = connect({ items }, same)
    expect(api.rootProps.role).toBeUndefined()
    expect(api.rootProps.tabIndex).toBeUndefined()
    expect(api.getItemProps(items[0]!).itemProps.role).toBeUndefined()
  })
})
