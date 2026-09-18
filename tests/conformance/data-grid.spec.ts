import { describe, expect, it, vi } from 'vitest'
import type { ColumnDef, GridSource } from '../../packages/core/src/components/data-grid'
import { type Adapter, type DataGridProps, click, freshTarget, part } from './harness'

interface Lead {
  id: number
  name: string
  sum: number | null
  status: string
}

const columns: ColumnDef<Lead>[] = [
  { id: 'name', header: 'Company' },
  { id: 'sum', header: 'Sum', type: 'money', currency: 'USD' },
  {
    id: 'status',
    header: 'Status',
    type: 'enum',
    options: [
      { value: 'new', label: 'New' },
      { value: 'won', label: 'Won' },
    ],
  },
]

const leads: Lead[] = [
  { id: 1, name: 'Acme', sum: 1200, status: 'new' },
  { id: 2, name: 'Borealis', sum: 90, status: 'won' },
  { id: 3, name: 'Cobalt', sum: null, status: 'new' },
]

const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))

/**
 * The grid in each framework. jsdom has no layout, so the grid draws the few
 * rows a one-pixel viewport plus its overscan asks for — enough for three
 * leads; the scrolling of 700k rows is the browser run's.
 */
export function dataGridConformance(adapter: Adapter) {
  describe('data grid', () => {
    const setup = async (props: Partial<DataGridProps> = {}) => {
      // English formats, whatever the machine running the tests speaks.
      const m = await adapter.dataGrid({ columns, rows: leads, label: 'Leads', locale: 'en-US', ...props }, freshTarget())
      // The rows arrive from the source a microtask later.
      await adapter.wait(0)
      const grid = () => part(m.root, 'data-grid', 'root')!
      const headers = () => [...m.root.querySelectorAll('[data-scope="data-grid"][data-part="header-cell"]')] as HTMLElement[]
      const rows = () => [...m.root.querySelectorAll('[data-scope="data-grid"][data-part="row"]')] as HTMLElement[]
      const texts = () => rows().map((row) => [...row.querySelectorAll('[data-part="cell"]:not([data-select])')].map((cell) => cell.textContent))
      const status = () => part(m.root, 'data-grid', 'status')!.textContent
      return { m, grid, headers, rows, texts, status }
    }

    it('is a named grid: a header row, then one row per result, counted for a screen reader', async () => {
      const { m, grid, headers, rows } = await setup()
      expect(grid().getAttribute('role')).toBe('grid')
      expect(grid().getAttribute('aria-label')).toBe('Leads')
      // The header is row 1 of 4.
      expect(grid().getAttribute('aria-rowcount')).toBe('4')
      expect(headers().map((cell) => cell.getAttribute('role'))).toEqual(['columnheader', 'columnheader', 'columnheader'])
      expect(headers().map((cell) => cell.textContent?.trim())).toEqual(['Company', 'Sum', 'Status'])
      expect(rows().map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '3', '4'])
      expect(rows()[0].querySelector('[data-part="cell"]')!.getAttribute('role')).toBe('gridcell')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('writes each cell by its column’s type, and puts numbers at the end of the cell', async () => {
      const { texts, rows } = await setup()
      expect(texts()).toEqual([
        ['Acme', '$1,200.00', 'New'],
        ['Borealis', '$90.00', 'Won'],
        ['Cobalt', '—', 'New'],
      ])
      const sum = rows()[0].querySelectorAll('[data-part="cell"]')[1] as HTMLElement
      expect(sum.dataset.align).toBe('end')
    })

    it('a header press sorts, and says so; Shift adds a second key', async () => {
      const onQueryChange = vi.fn()
      const { headers, texts } = await setup({ onQueryChange })
      await adapter.act(() => click(headers()[1]))
      await adapter.wait(0)
      expect(headers()[1].getAttribute('aria-sort')).toBe('ascending')
      expect(texts().map((row) => row[0])).toEqual(['Borealis', 'Acme', 'Cobalt'])

      await adapter.act(() => click(headers()[1]))
      await adapter.wait(0)
      expect(headers()[1].getAttribute('aria-sort')).toBe('descending')
      // An empty sum stays last in both directions.
      expect(texts().map((row) => row[0])).toEqual(['Acme', 'Borealis', 'Cobalt'])

      await adapter.act(() => headers()[2].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })))
      await adapter.wait(0)
      expect(headers()[2].dataset.sortOrder).toBe('2')
      expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ sort: [{ column: 'sum', direction: 'desc' }, { column: 'status', direction: 'asc' }] }))
    })

    it('one tab stop: the arrows move the active cell, named by aria-activedescendant', async () => {
      const onRowActivate = vi.fn()
      const { grid, rows } = await setup({ onRowActivate })
      expect(grid().tabIndex).toBe(0)
      // Coming into the grid makes its first cell active.
      await adapter.act(() => grid().focus())
      const first = rows()[0].querySelector('[data-part="cell"]')!
      expect(grid().getAttribute('aria-activedescendant')).toBe(first.id)

      await adapter.act(() => {
        key(grid(), 'ArrowDown')
        key(grid(), 'End')
      })
      const active = document.getElementById(grid().getAttribute('aria-activedescendant')!)!
      expect(active.closest('[data-part="row"]')!.getAttribute('aria-rowindex')).toBe('3')
      expect(active.textContent).toBe('Won')
      expect(active.dataset.focused).toBe('')

      await adapter.act(() => {
        key(grid(), 'Enter')
      })
      expect(onRowActivate).toHaveBeenCalledWith(leads[1], 1)
    })

    it('a checkbox selects its row; the header one selects everything matching', async () => {
      const onSelectionChange = vi.fn()
      const { grid, rows, headers, status } = await setup({ selectable: true, onSelectionChange })
      expect(grid().getAttribute('aria-multiselectable')).toBe('true')
      const box = (row: HTMLElement) => row.querySelector('[data-part="checkbox"]') as HTMLInputElement

      await adapter.act(() => click(box(rows()[1])))
      expect(rows()[1].getAttribute('aria-selected')).toBe('true')
      expect(rows()[0].getAttribute('aria-selected')).toBe('false')
      expect(box(rows()[1]).checked).toBe(true)
      expect(status()).toContain('1 selected')

      await adapter.act(() => click(headers()[0].querySelector('[data-part="checkbox"]')!))
      // Some were selected: the header box clears them.
      expect(rows().every((row) => row.getAttribute('aria-selected') === 'false')).toBe(true)
      await adapter.act(() => click(headers()[0].querySelector('[data-part="checkbox"]')!))
      expect(rows().every((row) => row.getAttribute('aria-selected') === 'true')).toBe(true)
      expect(status()).toContain('3 selected')
      expect(onSelectionChange).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'matching' }))

      await adapter.act(() => {
        grid().focus()
        key(grid(), 'Escape')
      })
      expect(status()).not.toContain('selected')
    })

    it('says so when nothing matches, and offers a retry when the rows could not be loaded', async () => {
      const empty = await setup({ rows: [] })
      expect(part(empty.m.root, 'data-grid', 'overlay')!.textContent).toContain('Nothing matches')
      expect(empty.grid().getAttribute('aria-rowcount')).toBe('1')

      let fail = true
      const source: GridSource<Lead> = {
        load: async (request) => {
          if (fail) throw new Error('502')
          return { rows: leads.slice(request.range.start, request.range.end), total: leads.length }
        },
      }
      const broken = await setup({ source })
      const overlay = part(broken.m.root, 'data-grid', 'overlay')!
      expect(overlay.getAttribute('role')).toBe('alert')
      fail = false
      await adapter.act(() => click(overlay.querySelector('button')!))
      await adapter.wait(0)
      expect(part(broken.m.root, 'data-grid', 'overlay')).toBeNull()
      expect(broken.rows()).toHaveLength(3)
    })
  })
}
