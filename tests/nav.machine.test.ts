import { describe, expect, it } from 'vitest'
import { connect, isNavItemOpen } from '../packages/core/src/components/nav'

/** The side column's sections, with no DOM: when they are open, and what the item holding the current one says. */

const same = (props: Record<string, unknown>) => props
const button = { label: 'Button', href: '#button', items: [{ label: 'Emphasis', href: '#e' }, { label: 'Sizes', href: '#s' }] }

describe('nav sections', () => {
  it('are open while the item or one of its sections is current, unless the reader set them', () => {
    expect(isNavItemOpen(button)).toBe(false)
    expect(isNavItemOpen({ ...button, current: true })).toBe(true)
    expect(isNavItemOpen({ ...button, items: [button.items[0], { ...button.items[1], current: true }] })).toBe(true)
    expect(isNavItemOpen({ ...button, current: true }, { '#button': false })).toBe(false)
    expect(isNavItemOpen(button, { '#button': true })).toBe(true)
  })

  it('draw one level only: a section’s own sections are not a branch; a plain item has none', () => {
    const api = connect({ id: 'n', label: 'Sections', groups: [] }, same)
    expect(api.getBranchProps({ label: 'Chip', href: '#chip' })).toBeNull()
    expect(api.getBranchProps({ ...button, items: [] })).toBeNull()
    const deep = api.getItemProps({ ...button.items[0], items: [{ label: 'x', href: '#x' }] }, 2)
    expect(deep.itemProps).toMatchObject({ 'data-level': 2, 'data-current-branch': undefined, id: undefined })
  })

  it('the button asks to flip its item and names it; words can change the name', () => {
    const asked: [string, boolean][] = []
    const api = connect({ id: 'n', label: 'Sections', groups: [], onOpenChange: (href, open) => void asked.push([href, open]), words: { sections: (label) => `Sections of ${label}` } }, same)
    const branch = api.getBranchProps(button)!
    expect(branch.toggleProps).toMatchObject({ 'aria-expanded': 'false', 'aria-label': 'Sections of Button', 'aria-controls': 'n-sections-_23button' })
    ;(branch.toggleProps as { onClick: () => void }).onClick()
    expect(asked).toEqual([['#button', true]])
  })
})
