import { describe, expect, it, vi } from 'vitest'
import type { TableColumnDef } from '../../packages/core/src/components/table'
import { type Adapter, type TableProps, click, freshTarget, part, parts } from './harness'

type Row = Record<string, unknown>

const columns: TableColumnDef<Row>[] = [
  { id: 'company', header: 'Company' },
  { id: 'value', header: 'Value' },
  { id: 'stage', header: 'Stage', sortable: false },
]

const rows: Row[] = [
  { company: 'Cobalt Works', value: 9500, stage: 'New' },
  { company: 'Acme Labs', value: 120000, stage: 'In talks' },
  { company: 'Delta Retail', value: 73000, stage: 'Won' },
]

/**
 * The DOM contract the stylesheets and screen readers depend on — native
 * table anatomy, sort wiring, the optional checkbox column, form-neutral
 * callbacks. Behaviour in depth is covered once, against the pure machine,
 * in table.machine.test.ts.
 */
export function tableConformance(adapter: Adapter) {
  describe('table', () => {
    const setup = async (props: Partial<TableProps> = {}, target = freshTarget()) => {
      const m = await adapter.table(
        { columns, rows, getRowKey: (row) => String(row.company), caption: 'Pipeline', ...props },
        target
      )
      const headerCells = () => parts(m.root, 'table', 'header-cell')
      const bodyRows = () => parts(parts(m.root, 'table', 'body')[0], 'table', 'row')
      const cellsOf = (row: Element) => parts(row, 'table', 'cell')
      const sortButton = (cell: Element) => part(cell, 'table', 'sort') as HTMLButtonElement | null
      return { m, headerCells, bodyRows, cellsOf, sortButton }
    }

    describe('anatomy', () => {
      it('is a native table: caption, head, body, scoped columns, one row per record', async () => {
        const { m, headerCells, bodyRows, cellsOf } = await setup()
        expect(part(m.root, 'table', 'root')!.tagName).toBe('TABLE')
        expect(part(m.root, 'table', 'caption')!.tagName).toBe('CAPTION')
        expect(part(m.root, 'table', 'caption')!.textContent).toBe('Pipeline')
        expect(part(m.root, 'table', 'header')!.tagName).toBe('THEAD')
        expect(part(m.root, 'table', 'header-row')!.tagName).toBe('TR')
        expect(part(m.root, 'table', 'body')!.tagName).toBe('TBODY')
        expect(headerCells().every((cell) => cell.tagName === 'TH' && cell.getAttribute('scope') === 'col')).toBe(true)
        expect(bodyRows().map((row) => row.tagName)).toEqual(['TR', 'TR', 'TR'])
        expect(cellsOf(bodyRows()[0]).every((cell) => cell.tagName === 'TD')).toBe(true)
        expect(cellsOf(bodyRows()[0]).map((cell) => cell.textContent)).toEqual(['Cobalt Works', '9500', 'New'])
      })

      it('numbers end, text starts; a column can say otherwise', async () => {
        const { bodyRows, cellsOf } = await setup({
          columns: [...columns.slice(0, 2), { ...columns[2], align: 'end' }],
        })
        const cells = cellsOf(bodyRows()[0])
        expect(cells[0].dataset.align).toBe('start')
        expect(cells[1].dataset.align).toBe('end')
        expect(cells[2].dataset.align).toBe('end')
      })

      it('names its glyphs for the theme to draw, and hides them from assistive tech', async () => {
        const { m, headerCells, sortButton } = await setup()
        const icon = part(m.root, 'table', 'sort-icon')!
        expect(icon.dataset.icon).toBe('sort')
        expect(icon.getAttribute('aria-hidden')).toBe('true')
        expect(m.root.querySelector('svg')).toBeNull()
        await adapter.act(() => click(sortButton(headerCells()[0])!))
        expect(part(m.root, 'table', 'sort-icon')!.dataset.icon).toBe('arrow-up')
      })

      it('exposes state as data attributes, not class names', async () => {
        const { m } = await setup()
        expect(m.root.querySelector('[class]')).toBeNull()
      })

      it('without a caption, the table takes the name it is given', async () => {
        const { m } = await setup({ caption: undefined, label: 'Deals' })
        expect(part(m.root, 'table', 'root')!.getAttribute('aria-label')).toBe('Deals')
        expect(part(m.root, 'table', 'caption')).toBeNull()
      })
    })

    describe('sorting', () => {
      it('a header press walks asc, desc, unsorted, and says where it stands', async () => {
        const onSortChange = vi.fn()
        const { headerCells, bodyRows, cellsOf, sortButton } = await setup({ onSortChange })
        const firstCompany = () => cellsOf(bodyRows()[0])[0].textContent

        expect(headerCells()[0].getAttribute('aria-sort')).toBe('none')
        await adapter.act(() => click(sortButton(headerCells()[1])!))
        expect(headerCells()[1].getAttribute('aria-sort')).toBe('ascending')
        expect(firstCompany()).toBe('Cobalt Works')
        await adapter.act(() => click(sortButton(headerCells()[1])!))
        expect(headerCells()[1].getAttribute('aria-sort')).toBe('descending')
        expect(firstCompany()).toBe('Acme Labs')
        await adapter.act(() => click(sortButton(headerCells()[1])!))
        expect(headerCells()[1].getAttribute('aria-sort')).toBe('none')
        expect(firstCompany()).toBe('Cobalt Works')
        expect(onSortChange).toHaveBeenCalledTimes(3)
        expect(onSortChange).toHaveBeenLastCalledWith(null)
      })

      it('a locked column carries no button and no sort state', async () => {
        const { headerCells, sortButton } = await setup()
        expect(sortButton(headerCells()[2])).toBeNull()
        expect(headerCells()[2].hasAttribute('aria-sort')).toBe(false)
      })

      it('a custom cell shows whatever the column renders', async () => {
        const { bodyRows, cellsOf } = await setup({
          renderCell: (row, column) => (column.id === 'company' ? `[${row.company}]` : undefined),
        })
        expect(cellsOf(bodyRows()[0])[0].textContent).toBe('[Cobalt Works]')
        expect(cellsOf(bodyRows()[0])[1].textContent).toBe('9500')
      })
    })

    describe('selection', () => {
      const boxes = (root: Element) =>
        [...root.querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[]

      it('is off unless asked for', async () => {
        const { m } = await setup()
        expect(m.root.querySelector('input[type="checkbox"]')).toBeNull()
        expect(parts(m.root, 'table', 'row').some((row) => row.hasAttribute('data-selected'))).toBe(false)
      })

      it('checks rows with native boxes, all at once from the header', async () => {
        const onSelectionChange = vi.fn()
        const { m, bodyRows } = await setup({ selectable: true, onSelectionChange })
        const headerBox = boxes(m.root)[0]

        await adapter.act(() => click(boxes(m.root)[1]))
        expect(bodyRows()[0].hasAttribute('data-selected')).toBe(true)
        expect(headerBox.indeterminate).toBe(true)
        expect(onSelectionChange).toHaveBeenCalledWith(['Cobalt Works'])

        await adapter.act(() => click(headerBox))
        expect(bodyRows().every((row) => row.hasAttribute('data-selected'))).toBe(true)
        await adapter.act(() => click(headerBox))
        expect(bodyRows().some((row) => row.hasAttribute('data-selected'))).toBe(false)
      })

      it('names each box for its row, and the header box for all of them', async () => {
        const { m } = await setup({ selectable: true })
        const labels = boxes(m.root).map((box) => box.getAttribute('aria-label'))
        expect(labels[0]).toBe('Select all rows')
        expect(labels.slice(1)).toEqual(['Select Row 1', 'Select Row 2', 'Select Row 3'])
      })
    })

    describe('empty', () => {
      it('says so across the whole width, in the table’s own words', async () => {
        const { m, bodyRows, cellsOf } = await setup({ rows: [], words: { empty: 'No deals yet' } })
        expect(bodyRows()).toHaveLength(1)
        expect(bodyRows()[0].hasAttribute('data-empty')).toBe(true)
        const cell = cellsOf(bodyRows()[0])[0]
        expect(cell.getAttribute('colspan')).toBe('3')
        expect(part(cell, 'table', 'empty')!.textContent).toBe('No deals yet')
      })
    })

    describe('controlled', () => {
      const run = adapter.supports.controlled ? it : it.skip

      run('pushes rows, sort and selection in from the owner', async () => {
        const { m, bodyRows, cellsOf } = await setup({ selectable: true, sort: { column: 'value', direction: 'desc' }, selection: ['Acme Labs'] })
        // The first cell holds the row's box; the company stands next to it.
        expect(cellsOf(bodyRows()[0])[1].textContent).toBe('Acme Labs')
        expect(bodyRows()[0].hasAttribute('data-selected')).toBe(true)
        await m.update({ sort: null, selection: [] })
        expect(cellsOf(bodyRows()[0])[1].textContent).toBe('Cobalt Works')
        expect(bodyRows().some((row) => row.hasAttribute('data-selected'))).toBe(false)
      })

      // Svelte's bind: model writes the change back, so a change the owner
      // ignores still moves the component — refusal is React-only.
      const refusal = adapter.supports.refusal ? it : it.skip
      refusal('reports the press but shows only what the owner passes', async () => {
        const onSortChange = vi.fn()
        const { headerCells, bodyRows, cellsOf, sortButton } = await setup({ sort: null, onSortChange })
        await adapter.act(() => click(sortButton(headerCells()[0])!))
        expect(onSortChange).toHaveBeenCalledWith({ column: 'company', direction: 'asc' })
        expect(cellsOf(bodyRows()[0])[0].textContent).toBe('Cobalt Works')
      })
    })

    describe('keyboard', () => {
      it('a sort button holds a tab stop like any button', async () => {
        const { headerCells, sortButton } = await setup()
        await adapter.act(() => sortButton(headerCells()[0])!.focus())
        // jsdom presses buttons on Enter only through a real key sequence, so
        // the press path is click; the contract here is focusability.
        expect(document.activeElement).toBe(sortButton(headerCells()[0]))
      })
    })
  })
}
