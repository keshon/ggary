import { describe, expect, it, vi } from 'vitest'
import { connect, pressInsert } from '../packages/core/src/components/inserts'

const same = <T,>(props: T) => props

const items = [
  { value: '{{name}}', hint: 'The name of the monitor' },
  { value: '{{target}}', label: 'target' },
]

describe('inserts', () => {
  it('is a named group of real buttons', () => {
    const api = connect({ items, target: 'tpl' }, same)
    expect(api.rootProps).toMatchObject({ 'data-scope': 'inserts', 'data-part': 'root', role: 'group', 'aria-label': 'Inserts' })
    expect(connect({ items, target: 'tpl', label: 'Variables' }, same).rootProps['aria-label']).toBe('Variables')
    const item = api.itemProps(items[0])
    expect(item).toMatchObject({ 'data-part': 'item', type: 'button', 'data-value': '{{name}}' })
    expect(typeof item.onClick).toBe('function')
  })

  it('the text is the value unless a label is given; a hint is a title that adds to the name', () => {
    const api = connect({ items, target: 'tpl' }, same)
    expect(api.itemLabel(items[0])).toBe('{{name}}')
    expect(api.itemLabel(items[1])).toBe('target')
    expect(api.itemProps(items[0]).title).toBe('The name of the monitor')
    expect(api.itemProps(items[1]).title).toBeUndefined()
  })

  it('a press with no field to find, or a field refused by onInsert, changes nothing', () => {
    const doc = { getElementById: () => null } as unknown as Document
    const onInsert = vi.fn()
    expect(pressInsert({ target: 'missing', onInsert }, 'x', doc)).toBe(false)
    expect(pressInsert({ target: () => null, onInsert }, 'x', doc)).toBe(false)
    expect(onInsert).not.toHaveBeenCalled()
  })
})
