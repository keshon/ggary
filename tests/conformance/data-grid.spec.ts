import { describe, expect, it, vi } from 'vitest'
import type { ColumnDef, GridSource } from '../../packages/core/src/components/data-grid'
import { setInputValue } from '../../packages/core/src/index'
import { type Adapter, type DataGridProps, type GridToolsProps, click, freshTarget, part, parts } from './harness'

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

/**
 * The working surface: a filter bar, a column picker and a bulk bar sharing
 * one grid. Driven as a person would — open the editor, type, apply; select,
 * take the offer; untick a column.
 */
export function gridToolsConformance(adapter: Adapter) {
  describe('grid tools', () => {
    const many: Lead[] = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: i % 3 === 0 ? `Acme ${i}` : `Borealis ${i}`,
      sum: i * 100,
      status: i % 2 ? 'won' : 'new',
    }))

    const setup = async (props: Partial<GridToolsProps> = {}) => {
      const m = await adapter.gridTools({ columns, rows: many, locale: 'en-US', ...props }, freshTarget())
      await adapter.wait(0)
      await adapter.wait(0)
      const q = (selector: string) => m.root.querySelector<HTMLElement>(selector)
      const chips = () => [...m.root.querySelectorAll<HTMLElement>('[data-scope="grid-filters"][data-part="chip"]')]
      const chipText = () =>
        chips().map((chip) => `${part(chip, 'grid-filters', 'chip-name')!.textContent} ${part(chip, 'grid-filters', 'chip-value')!.textContent}`)
      const rowCount = () => part(m.root, 'data-grid', 'root')!.getAttribute('aria-rowcount')
      const button = (text: string) =>
        [...m.root.querySelectorAll<HTMLButtonElement>('button')].find((candidate) => candidate.textContent?.trim() === text)!
      return { m, q, chips, chipText, rowCount, button }
    }

    it('adds a filter from the editor, shows it as a chip, and the grid follows', async () => {
      const { m, chipText, rowCount, button } = await setup()
      expect(part(m.root, 'grid-filters', 'root')!.getAttribute('role')).toBe('group')
      expect(rowCount()).toBe('13')

      await adapter.act(() => click(button('Add a filter')))
      const forms = [...document.querySelectorAll<HTMLFormElement>('[data-scope="grid-filters"][data-part="editor"]')]
      const form = forms[forms.length - 1]
      // The field, not the column picker's hidden form input.
      const input = form.querySelector<HTMLInputElement>('input:not([type="hidden"])')!
      await adapter.act(() => setInputValue(input, 'acme'))
      await adapter.act(() => form.requestSubmit())
      await adapter.wait(0)

      expect(chipText()).toEqual(['Company contains “acme”'])
      expect(rowCount()).toBe('5')
    })

    it('a chip’s × removes its filter, and Clear all removes every one', async () => {
      const { m, chips, rowCount, button } = await setup()
      // A filter set on the grid shows as a chip, whoever set it.
      await adapter.act(() => click(button('Add a filter')))
      const forms = [...document.querySelectorAll<HTMLFormElement>('[data-scope="grid-filters"][data-part="editor"]')]
      const form = forms[forms.length - 1]
      await adapter.act(() => setInputValue(form.querySelector<HTMLInputElement>('input:not([type="hidden"])')!, 'borealis'))
      await adapter.act(() => form.requestSubmit())
      await adapter.wait(0)
      expect(chips()).toHaveLength(1)
      const remove = part(chips()[0], 'grid-filters', 'chip-remove')!
      expect(remove.getAttribute('aria-label')).toContain('Company')
      await adapter.act(() => click(remove))
      await adapter.wait(0)
      expect(chips()).toHaveLength(0)
      expect(rowCount()).toBe('13')
      expect(button('Clear all')).toBeUndefined()
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('the bulk bar appears with a selection and offers everything the query matches', async () => {
      const { m, q, button } = await setup()
      const bar = () => part(m.root, 'grid-bulk', 'root')
      const visible = () => Boolean(bar()) && !bar()!.hidden
      expect(visible()).toBe(false)

      const box = m.root.querySelectorAll<HTMLInputElement>('[data-part="row"] [data-part="checkbox"]')[0]
      await adapter.act(() => click(box))
      expect(visible()).toBe(true)
      expect(part(bar()!, 'grid-bulk', 'count')!.textContent).toBe('1 selected')
      expect(bar()!.getAttribute('aria-label')).toBe('Selection')
      expect(q('[data-scope="grid-bulk"][data-part="actions"] button')!.textContent).toBe('Assign')

      await adapter.act(() => click(button('Select all 12')))
      expect(part(bar()!, 'grid-bulk', 'count')!.textContent).toBe('All 12 selected')

      await adapter.act(() => click(part(bar()!, 'grid-bulk', 'clear')!))
      expect(visible()).toBe(false)
    })

    it('a date filter is edited with the kit’s date picker, and the grid follows', async () => {
      const dated = many.map((lead, i) => ({ ...lead, registered: `2026-09-${String(i + 1).padStart(2, '0')}` }))
      const withDate = [...columns, { id: 'registered', header: 'Registered', type: 'date' as const }]
      const { m, chips, rowCount } = await setup({
        columns: withDate,
        rows: dated,
        views: [{ id: 'sept', label: 'September', query: { filters: [{ column: 'registered', kind: 'date', from: '2026-09-01' }] } }],
      })
      // A view puts the filter in force; its chip opens the editor on it.
      const viewButton = [...m.root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === 'Views')!
      await adapter.act(() => click(viewButton))
      await adapter.wait(0)
      const item = [...document.querySelectorAll<HTMLElement>('[data-scope="menu"][data-part="item"]')].find((row) => row.textContent?.includes('September'))!
      await adapter.act(() => click(item))
      await adapter.wait(0)
      expect(rowCount()).toBe('13')
      await adapter.act(() => click(part(chips()[0], 'grid-filters', 'chip-button')!))
      await adapter.wait(0)
      const forms = [...document.querySelectorAll<HTMLFormElement>('[data-scope="grid-filters"][data-part="editor"]')]
      const form = forms[forms.length - 1]
      const pickers = [...form.querySelectorAll<HTMLElement>('[data-scope="date-picker"][data-part="root"]')]
      expect(pickers).toHaveLength(2)
      const [from, to] = pickers.map((picker) => part(picker, 'date-picker', 'input') as HTMLInputElement)
      expect(from.value).toBe('Sep 1, 2026')
      await adapter.act(() => setInputValue(to, '9/5/2026'))
      await adapter.act(() => void to.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })))
      await adapter.act(() => form.requestSubmit())
      await adapter.wait(0)
      expect(rowCount()).toBe('6')
      expect(part(chips()[0], 'grid-filters', 'chip-value')!.textContent).toBe('Sep 1, 2026 – Sep 5, 2026')
    })

    it('the column picker hides a column and brings every one back', async () => {
      const { m, button } = await setup()
      const headers = () => [...m.root.querySelectorAll('[data-scope="data-grid"][data-part="header-cell"]:not([data-select])')].map((cell) => cell.textContent?.trim())
      expect(headers()).toEqual(['Company', 'Sum', 'Status'])
      await adapter.act(() => click(button('Columns')))
      const picker = [...document.querySelectorAll<HTMLElement>('[data-scope="grid-columns"][data-part="root"]')].pop()!
      const sum = [...picker.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find((box) => box.value === 'sum')!
      await adapter.act(() => click(sum))
      expect(headers()).toEqual(['Company', 'Status'])
      await adapter.act(() => click([...picker.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === 'Reset columns')!))
      expect(headers()).toEqual(['Company', 'Sum', 'Status'])
    })
  })
}

/**
 * What opens from a row: an editor in its cell, a context menu, a detail
 * sheet. The same behaviour in each framework, down to where the focus goes.
 */
export function gridRowsConformance(adapter: Adapter) {
  describe('grid rows: editing, the row menu, the detail sheet', () => {
    const editable: ColumnDef<Lead>[] = [
      { id: 'name', header: 'Company', editable: true },
      { id: 'sum', header: 'Sum', type: 'money', currency: 'USD', editable: true },
      { ...columns[2], editable: true },
      { id: 'id', header: 'Number', type: 'number' },
    ]

    const setup = async () => {
      const saves: { value: unknown; previous: unknown; key: unknown }[] = []
      const chosen: { value: string; id: number; selection: unknown }[] = []
      const control = { reject: null as string | null }
      const m = await adapter.gridRows(
        {
          columns: editable,
          rows: leads.map((lead) => ({ ...lead })),
          locale: 'en-US',
          onCellEdit: async (edit) => {
            saves.push({ value: edit.value, previous: edit.previous, key: edit.key })
            if (control.reject) throw new Error(control.reject)
          },
          menuItems: () => [
            { value: 'open', label: 'Open' },
            { value: 'archive', label: 'Archive' },
          ],
          onMenuSelect: (value, target) => chosen.push({ value, id: target.row.id, selection: target.selection }),
          detailTitle: (row) => row.name,
          detailBody: (row) => `Lead number ${row.id}`,
        },
        freshTarget()
      )
      await adapter.wait(0)
      await adapter.wait(0)
      const grid = () => part(m.root, 'data-grid', 'root')!
      const cell = (row: number, column: number) =>
        [...m.root.querySelectorAll('[data-scope="data-grid"][data-part="row"]')]
          .find((line) => line.getAttribute('aria-rowindex') === String(row + 2))!
          .querySelectorAll<HTMLElement>('[data-part="cell"]')[column]
      const editor = () => part(m.root, 'data-grid', 'editor') as (HTMLInputElement & HTMLSelectElement) | null
      const status = () => part(m.root, 'data-grid', 'status')!.textContent
      const menu = () => part(m.root, 'menu', 'content')!
      const sheet = () => part(m.root, 'dialog', 'content') as HTMLDialogElement
      const press = (target: Element, name: string, init: KeyboardEventInit = {}) => adapter.act(() => void key(target, name, init))
      const focusCell = async (column: number) => {
        await adapter.act(() => grid().focus())
        for (let i = 0; i < column; i += 1) await press(grid(), 'ArrowRight')
      }
      return { m, saves, chosen, control, grid, cell, editor, status, menu, sheet, press, focusCell }
    }

    it('F2 opens the editor in the cell; Enter saves, shows the value and gives the focus back', async () => {
      const { saves, grid, cell, editor, press, focusCell } = await setup()
      expect(cell(0, 1).hasAttribute('data-editable')).toBe(true)
      expect(cell(0, 3).getAttribute('aria-readonly')).toBe('true')
      await focusCell(1)
      await press(grid(), 'F2')
      const input = editor()!
      expect(input.tagName).toBe('INPUT')
      expect(input.getAttribute('aria-label')).toBe('Sum')
      expect(input.value).toBe('1200')
      expect(document.activeElement).toBe(input)
      expect(cell(0, 1).hasAttribute('data-editing')).toBe(true)

      await adapter.act(() => setInputValue(input, '1 500'))
      await press(input, 'Enter')
      await adapter.wait(0)
      expect(saves).toEqual([{ value: 1500, previous: 1200, key: 1 }])
      expect(editor()).toBeNull()
      expect(cell(0, 1).textContent).toBe('$1,500.00')
      expect(document.activeElement).toBe(grid())
    })

    it('Escape puts the cell back as it was, and saves nothing', async () => {
      const { saves, grid, cell, editor, press, focusCell } = await setup()
      await focusCell(0)
      await press(grid(), 'Enter')
      await adapter.act(() => setInputValue(editor()!, 'Zeta'))
      await press(editor()!, 'Escape')
      expect(editor()).toBeNull()
      expect(cell(0, 0).textContent).toBe('Acme')
      expect(saves).toEqual([])
      expect(document.activeElement).toBe(grid())
    })

    it('typing on a cell starts its edit with what was typed', async () => {
      const { grid, editor, press, focusCell } = await setup()
      await focusCell(0)
      await press(grid(), 'Z')
      expect(editor()!.value).toBe('Z')
    })

    it('a failed save puts the old value back and says why', async () => {
      const { control, grid, cell, editor, status, press, focusCell } = await setup()
      control.reject = 'the deal is closed'
      await focusCell(0)
      await press(grid(), 'Z')
      await press(editor()!, 'Enter')
      await adapter.wait(0)
      await adapter.wait(0)
      expect(cell(0, 0).textContent).toBe('Acme')
      expect(cell(0, 0).dataset.save).toBe('failed')
      expect(status()).toContain('Could not save Company: the deal is closed')
    })

    it('a value that is not one keeps the editor open, marked, with the reason', async () => {
      const { saves, grid, editor, m, press, focusCell } = await setup()
      await focusCell(1)
      await press(grid(), 'F2')
      await adapter.act(() => setInputValue(editor()!, 'lots'))
      await press(editor()!, 'Enter')
      expect(editor()!.getAttribute('aria-invalid')).toBe('true')
      const error = part(m.root, 'data-grid', 'editor-error')!
      expect(error.textContent).toBe('Enter a number')
      expect(editor()!.getAttribute('aria-describedby')).toBe(error.id)
      expect(saves).toEqual([])
    })

    it('a list column edits with a select of its options', async () => {
      const { saves, grid, cell, editor, press, focusCell } = await setup()
      await focusCell(2)
      await press(grid(), 'Enter')
      const select = editor()!
      expect(select.tagName).toBe('SELECT')
      expect([...select.options].map((option) => option.textContent)).toEqual(['—', 'New', 'Won'])
      expect(select.value).toBe('1')
      await adapter.act(() => {
        select.value = '2'
        select.dispatchEvent(new Event('input', { bubbles: true }))
        select.dispatchEvent(new Event('change', { bubbles: true }))
      })
      await press(select, 'Enter')
      await adapter.wait(0)
      expect(saves).toEqual([{ value: 'won', previous: 'new', key: 1 }])
      expect(cell(0, 2).textContent).toBe('Won')
    })

    it('a right click opens the row menu at the pointer; a choice reports the row', async () => {
      const { chosen, grid, cell, menu, m } = await setup()
      expect(menu().dataset.state).toBe('closed')
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 60 })
      await adapter.act(() => void cell(1, 0).dispatchEvent(event))
      await adapter.wait(0)
      expect(event.defaultPrevented).toBe(true)
      expect(menu().dataset.state).toBe('open')
      expect(menu().getAttribute('aria-label')).toBe('Row actions')
      const items = parts(m.root, 'menu', 'item')
      expect(items.map((item) => part(item, 'menu', 'item-text')!.textContent)).toEqual(['Open', 'Archive'])
      await adapter.act(() => click(items[1]))
      await adapter.wait(0)
      expect(chosen).toEqual([{ value: 'archive', id: 2, selection: null }])
      expect(menu().dataset.state).toBe('closed')
      expect(document.activeElement).toBe(grid())
    })

    it('Shift+F10 opens the row menu from the keyboard, on its first item', async () => {
      const { grid, menu, press, focusCell } = await setup()
      await focusCell(3)
      await press(grid(), 'F10', { shiftKey: true })
      await adapter.wait(0)
      expect(menu().dataset.state).toBe('open')
      expect(part(document.activeElement!, 'menu', 'item-text')?.textContent).toBe('Open')
    })

    it('Enter on a row opens it in a sheet that walks to the next row', async () => {
      const { grid, sheet, m, press, focusCell } = await setup()
      await focusCell(3)
      await press(grid(), 'Enter')
      await adapter.wait(0)
      expect(sheet().open).toBe(true)
      expect(part(m.root, 'dialog', 'title')!.textContent).toBe('Acme')
      expect(part(m.root, 'dialog', 'body')!.textContent).toBe('Lead number 1')
      expect(part(m.root, 'grid-detail', 'position')!.textContent).toBe('1 of 3')
      expect(part(m.root, 'grid-detail', 'prev')!.getAttribute('aria-disabled')).toBe('true')

      await adapter.act(() => click(part(m.root, 'grid-detail', 'next')!))
      await adapter.wait(0)
      expect(part(m.root, 'dialog', 'title')!.textContent).toBe('Borealis')
      expect(part(m.root, 'grid-detail', 'position')!.textContent).toBe('2 of 3')
      // The grid's active row went along.
      expect(grid().getAttribute('aria-activedescendant')).toMatch(/r1c3$/)

      await adapter.act(() => click(part(m.root, 'dialog', 'close')!))
      await adapter.wait(0)
      expect(sheet().open).toBe(false)
    })
  })
}
