import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import type { CellEdit, ColumnDef } from '../packages/core/src/components/data-grid'
import { Fragment, StrictMode, createElement, useState, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DataGrid as ReactGrid, GridDetail, GridRowMenu } from '../packages/react/src/index'
import type { DataGridController } from '../packages/core/src/components/data-grid'

/**
 * Editing in place, the row menu and the detail sheet, where only a real
 * browser can say: a click elsewhere saving, Tab walking the editable cells,
 * an edit surviving its row scrolled out of view in 700,000 rows, the menu
 * standing where the pointer was, and a sheet beside a grid that stays usable.
 */

interface Lead {
  id: number
  name: string
  sum: number
  status: string
  note: string
}

const TOTAL = 700_000
const leads: Lead[] = Array.from({ length: TOTAL }, (_, i) => ({ id: i + 1, name: `Company ${i + 1}`, sum: i, status: 'new', note: '' }))

const columns: ColumnDef<Lead>[] = [
  { id: 'name', header: 'Company', width: 180, editable: true },
  { id: 'sum', header: 'Sum', type: 'number', width: 120, editable: true },
  { id: 'id', header: 'Id', type: 'number', width: 100 },
  {
    id: 'status',
    header: 'Status',
    type: 'enum',
    width: 140,
    editable: true,
    options: [
      { value: 'new', label: 'New' },
      { value: 'won', label: 'Won' },
    ],
  },
]

const frames = (count = 2) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

const until = async (check: () => boolean, ms = 3000) => {
  const started = performance.now()
  while (!check()) {
    if (performance.now() - started > ms) throw new Error('timed out')
    await frames(1)
  }
}

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

interface Extras {
  /** A row menu beside the grid, sharing its controller. */
  menu?: boolean
  /** A detail sheet beside the grid, sharing its controller. */
  detail?: boolean
}

async function mount(extras: Extras = {}) {
  const saves: CellEdit<Lead>[] = []
  const rows = leads.slice(0, 2000).map((lead) => ({ ...lead }))
  let controller: DataGridController<Lead> | undefined
  function Page() {
    const [grid, setGrid] = useState<DataGridController<Lead>>()
    return createElement(
      Fragment,
      null,
      createElement(ReactGrid as ComponentType<any>, {
        columns,
        rows,
        rowKey: (row: Lead) => row.id,
        label: 'Leads',
        locale: 'en-US',
        style: { blockSize: '400px', inlineSize: '640px' },
        onCellEdit: async (edit: CellEdit<Lead>) => void saves.push(edit),
        controllerRef: (next: DataGridController<Lead>) => {
          controller = next
          setGrid(next)
        },
      }),
      grid && extras.menu
        ? createElement(GridRowMenu as ComponentType<any>, {
            grid,
            items: () => [
              { value: 'open', label: 'Open' },
              { value: 'archive', label: 'Archive' },
            ],
            onSelect: () => undefined,
          })
        : null,
      grid && extras.detail
        ? createElement(GridDetail as ComponentType<any>, { grid, title: (row: Lead) => row.name, children: (row: Lead) => `Lead ${row.id}` })
        : null
    )
  }
  const host = document.createElement('div')
  const outside = document.createElement('button')
  outside.textContent = 'Elsewhere'
  document.body.append(host, outside)
  root = createRoot(host)
  root.render(createElement(Page))
  const cell = (row: number, column: number) =>
    host.querySelector<HTMLElement>(`[data-part="row"][aria-rowindex="${row + 2}"]`)?.querySelectorAll<HTMLElement>('[data-part="cell"]')[column]
  await until(() => Boolean(cell(0, 0)?.textContent))
  const scroller = host.querySelector<HTMLElement>('[data-scope="data-grid"][data-part="root"]')!
  const editor = () => host.querySelector<HTMLInputElement & HTMLSelectElement>('[data-part="editor"]')
  return { host, grid: () => controller!, scroller, cell, editor, saves, outside }
}

describe('editing in place', () => {
  it('a double click opens the editor; a click elsewhere keeps what was typed', async () => {
    const { cell, editor, saves, outside } = await mount()
    await userEvent.dblClick(cell(1, 0)!)
    expect(document.activeElement).toBe(editor())
    await userEvent.keyboard('{End} Ltd')
    await userEvent.click(outside)
    await until(() => saves.length === 1)
    expect(saves[0].value).toBe('Company 2 Ltd')
    expect(editor()).toBeNull()
    expect(cell(1, 0)!.textContent).toBe('Company 2 Ltd')
    // The focus went where the person took it, not back to the grid.
    expect(document.activeElement).toBe(outside)
  })

  it('Tab goes on to the next editable cell, skipping the ones that are not', async () => {
    const { scroller, editor, saves } = await mount()
    scroller.focus()
    await userEvent.keyboard('{ArrowRight}{F2}')
    expect(editor()!.getAttribute('aria-label')).toBe('Sum')
    await userEvent.keyboard('{Control>}a{/Control}42{Tab}')
    // Id is not editable: Tab lands on Status, a select.
    expect(editor()!.tagName).toBe('SELECT')
    expect(document.activeElement).toBe(editor())
    await userEvent.keyboard('{Escape}')
    await until(() => saves.length === 1)
    expect(saves[0]).toMatchObject({ value: 42, previous: 0 })
    expect(document.activeElement).toBe(scroller)
  })

  it('an edit survives its row scrolling out of view, focus and draft and all', async () => {
    const { scroller, cell, editor, saves } = await mount()
    scroller.focus()
    await userEvent.keyboard('{F2}')
    await userEvent.keyboard('{Control>}a{/Control}Draft')
    scroller.scrollTop = 20_000
    await frames(4)
    // Far from row 1 now, and the editor is still there, still focused, still holding the draft.
    expect(cell(1, 0)).toBeUndefined()
    expect(editor()!.value).toBe('Draft')
    expect(document.activeElement).toBe(editor())
    await userEvent.keyboard('{Enter}')
    await until(() => saves.length === 1)
    expect(saves[0].value).toBe('Draft')
  })

  it('React keeps the edit through the scroll too, under StrictMode', async () => {
    const host = document.createElement('div')
    host.style.blockSize = '400px'
    document.body.append(host)
    const saves: unknown[] = []
    let grid: DataGridController<Lead> | undefined
    function App() {
      const [rows] = useState(() => leads.slice(0, 2000))
      return createElement(ReactGrid as never, {
        columns,
        rows,
        rowKey: (row: Lead) => row.id,
        label: 'Leads',
        locale: 'en-US',
        style: { blockSize: '400px' },
        controllerRef: (controller: DataGridController<Lead>) => (grid = controller),
        onCellEdit: async (edit: CellEdit<Lead>) => void saves.push(edit.value),
      })
    }
    const root = createRoot(host)
    root.render(createElement(StrictMode, null, createElement(App)))
    await until(() => Boolean(host.querySelector('[data-part="row"]:not([data-placeholder])')))
    const scroller = host.querySelector<HTMLElement>('[data-part="root"]')!
    scroller.focus()
    await userEvent.keyboard('{F2}{Control>}a{/Control}Draft')
    scroller.scrollTop = 20_000
    await frames(4)
    const editor = host.querySelector<HTMLInputElement>('[data-part="editor"]')!
    expect(editor.value).toBe('Draft')
    expect(document.activeElement).toBe(editor)
    await userEvent.keyboard('{Enter}')
    await until(() => saves.length === 1)
    expect(saves).toEqual(['Draft'])
    expect(grid?.getSnapshot().grid.editing).toBeNull()
    root.unmount()
  })
})

describe('what opens from a row', () => {
  it('the row menu stands where the pointer was, and gives the focus back to the grid', async () => {
    const { grid, scroller, cell } = await mount({ menu: true })
    await frames()
    const target = cell(3, 1)!
    const box = target.getBoundingClientRect()
    await userEvent.click(target, { button: 'right', position: { x: 20, y: 10 } })
    const content = document.querySelector<HTMLElement>('[data-scope="menu"][data-part="content"]')!
    await until(() => content.dataset.state === 'open' && content.style.transform !== '')
    await frames()
    const placed = content.getBoundingClientRect()
    expect(Math.abs(placed.left - (box.left + 20))).toBeLessThan(12)
    expect(placed.top).toBeGreaterThanOrEqual(box.top + 10 - 1)
    expect(placed.top).toBeLessThan(box.top + 10 + 16)
    await userEvent.keyboard('{Escape}')
    await until(() => content.dataset.state === 'closed')
    expect(document.activeElement).toBe(scroller)
    expect(grid().getSnapshot().grid.focus).toEqual({ row: 3, column: 1 })
  })

  it('a press on another row while the sheet is open shows that row', async () => {
    // Wide enough for the grid and the sheet beside it.
    await page.viewport(1200, 700)
    const { host, cell } = await mount({ detail: true })
    await frames()
    await userEvent.dblClick(cell(2, 2)!)
    const sheet = host.querySelector<HTMLDialogElement>('dialog')!
    await until(() => sheet.open)
    const title = () => sheet.querySelector('[data-part="title"]')!.textContent
    expect(title()).toBe('Company 3')
    // Non-modal: the grid is still there to press.
    const other = cell(5, 2)!
    expect(document.elementFromPoint(other.getBoundingClientRect().left + 5, other.getBoundingClientRect().top + 5)?.closest('[data-part="cell"]')).toBe(other)
    await userEvent.click(other)
    await until(() => title() === 'Company 6')
    expect(sheet.querySelector('[data-part="position"]')!.textContent).toBe('6 of 2,000')
    expect(sheet.open).toBe(true)
  })
})
