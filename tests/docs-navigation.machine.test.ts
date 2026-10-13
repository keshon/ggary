import { describe, expect, it } from 'vitest'
import { navGroups } from '../apps/docs/src/site'

const current = { id: 'button', title: 'Button' }

describe('documentation navigation', () => {
  it('keeps groups semantic and sorts their components alphabetically', () => {
    const groups = navGroups(current)

    expect(groups.slice(0, 3).map((group) => group.label)).toEqual(['Actions', 'Inputs', 'Overlays'])
    expect(groups[0].items.map((item) => item.label)).toEqual([
      'Button', 'ButtonGroup', 'Chip', 'ChipGroup', 'CommandPalette', 'ContextMenu', 'Menu', 'Menubar',
    ])
  })

  it('filters by component name, route words and group', () => {
    expect(navGroups(current, 'range slider').flatMap((group) => group.items.map((item) => item.label))).toEqual(['RangeSlider'])
    expect(navGroups(current, 'context-menu').flatMap((group) => group.items.map((item) => item.label))).toEqual(['ContextMenu'])

    const charts = navGroups(current, 'charts')
    expect(charts).toHaveLength(1)
    expect(charts[0].label).toBe('Charts')
    expect(charts[0].items).toHaveLength(4)
  })

  it('returns no groups when nothing matches', () => {
    expect(navGroups(current, 'definitely missing')).toEqual([])
  })
})
