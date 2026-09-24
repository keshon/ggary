import { describe, expect, it } from 'vitest'
import {
  connect,
  connectDetail,
  createArraySource,
  createDataGrid,
  draftOf,
  editorOptions,
  parseDraft,
  rowMenuTarget,
  type CellEdit,
  type ColumnDef,
} from '../packages/core/src/components/data-grid'

/**
 * Editing in place, the detail sheet and the row menu, with no DOM: what a
 * draft reads as, how a save is shown at once and taken back when it fails,
 * and how the detail and the menu follow the grid's rows.
 */

interface Lead {
  id: number
  company: string
  status: string | null
  sum: number | null
  share: number
  closed: boolean
}

const columns: ColumnDef<Lead>[] = [
  { id: 'company', header: 'Company', editable: true, validate: (value) => (value ? null : 'A company needs a name') },
  {
    id: 'status',
    header: 'Status',
    type: 'enum',
    editable: true,
    options: [
      { value: 'new', label: 'New' },
      { value: 'won', label: 'Won' },
    ],
  },
  { id: 'sum', header: 'Paid', type: 'money', editable: (lead) => !lead.closed },
  { id: 'share', header: 'Share', type: 'percent' },
]

const leads = (): Lead[] =>
  Array.from({ length: 300 }, (_, i) => ({ id: i + 1, company: `Acme ${i + 1}`, status: 'new', sum: i * 10, share: 0.25, closed: i === 1 }))

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const same = (props: Record<string, unknown>) => props

async function grid(onCellEdit?: (edit: CellEdit<Lead>) => Promise<Lead | void> | Lead | void, selectable = false) {
  const controller = createDataGrid<Lead>({ columns, source: createArraySource(leads(), columns), rowKey: (lead) => lead.id, onCellEdit, selectable })
  controller.data.ensureRange({ start: 0, end: 100 })
  await settle()
  return controller
}

const api = (controller: Awaited<ReturnType<typeof grid>>) =>
  connect(controller.getSnapshot(), controller, same, { id: 'g', label: 'Leads', locale: 'en-US' })

describe('drafts', () => {
  it('a number is typed the way people type it, and a percentage as a percentage', () => {
    const sum = columns[2]
    expect(parseDraft(sum, '1 250,5')).toEqual({ value: 1250.5 })
    expect(parseDraft(sum, '1,250.5')).toEqual({ value: 1250.5 })
    expect(parseDraft(sum, ' ')).toEqual({ value: null })
    expect(parseDraft(sum, 'lots')).toEqual({ error: 'Enter a number' })
    expect(draftOf(columns[3], 0.125)).toBe('12.5')
    expect(parseDraft(columns[3], '12.5%')).toEqual({ value: 0.125 })
  })

  it('a list offers a way to empty the cell, and its draft is the choice', () => {
    expect(editorOptions(columns[1]).map((option) => option.label)).toEqual(['—', 'New', 'Won'])
    expect(draftOf(columns[1], 'won')).toBe('2')
    expect(parseDraft(columns[1], '2')).toEqual({ value: 'won' })
    expect(parseDraft(columns[1], '0')).toEqual({ value: null })
  })

  it('a date stays a day', () => {
    const day: ColumnDef = { id: 'd', header: 'Day', type: 'date' }
    expect(draftOf(day, '2026-03-09')).toBe('2026-03-09')
    expect(parseDraft(day, '2026-03-09')).toEqual({ value: '2026-03-09' })
    expect(parseDraft(day, '9 March')).toEqual({ error: 'Enter a date' })
  })
})

describe('editing a cell', () => {
  it('only an editable cell opens, and it starts from the value or from what was typed', async () => {
    const controller = await grid()
    expect(controller.startEdit(0, 3)).toBe(false) // share: not editable
    expect(controller.startEdit(1, 2)).toBe(false) // a closed lead's sum
    expect(controller.startEdit(0, 2)).toBe(true)
    expect(controller.getSnapshot().grid.editing).toEqual({ row: 0, column: 2, draft: '0' })
    controller.cancelEdit()
    controller.startEdit(0, 0, 'B')
    expect(controller.getSnapshot().grid.editing?.draft).toBe('B')
  })

  it('a save shows the new value at once, and keeps it when the server agrees', async () => {
    const saved: CellEdit<Lead>[] = []
    const controller = await grid(async (edit) => {
      saved.push(edit)
    })
    controller.startEdit(3, 2)
    controller.setDraft('1 500')
    expect(controller.commitEdit()).toBe(true)
    expect(controller.data.rowAt(3)?.sum).toBe(1500)
    let cell = api(controller).rows[3].cells[2]
    expect(cell.text).toBe('1,500.00')
    expect(cell.props['data-save']).toBe('saving')
    await settle()
    expect(saved[0]).toMatchObject({ key: 4, index: 3, value: 1500, previous: 30 })
    cell = api(controller).rows[3].cells[2]
    expect(cell.props['data-save']).toBeUndefined()
  })

  it('a failed save puts the old value back, in that cell only, and says why', async () => {
    let fail = true
    const controller = await grid(async (edit) => {
      if (edit.column.id === 'sum' && fail) throw new Error('the deal is closed')
    })
    controller.startEdit(5, 2)
    controller.setDraft('999')
    controller.commitEdit()
    controller.startEdit(5, 0)
    controller.setDraft('Borealis')
    controller.commitEdit()
    expect(controller.data.rowAt(5)).toMatchObject({ sum: 999, company: 'Borealis' })
    await settle()
    await settle()
    // The sum went back; the company, saved meanwhile, stayed.
    expect(controller.data.rowAt(5)).toMatchObject({ sum: 50, company: 'Borealis' })
    const view = api(controller)
    expect(view.rows[5].cells[2].props['data-save']).toBe('failed')
    expect(view.rows[5].cells[2].props.title).toBe('the deal is closed')
    expect(view.statusText).toBe('Could not save Paid: the deal is closed. 300 rows')
    // The next edit clears the news; a save that works clears the cell.
    fail = false
    controller.startEdit(5, 2)
    controller.setDraft('60')
    controller.commitEdit()
    await settle()
    await settle()
    expect(api(controller).rows[5].cells[2].props['data-save']).toBeUndefined()
    expect(api(controller).statusText).toBe('300 rows')
  })

  it('the server’s answer is shown when it sends the row back', async () => {
    const controller = await grid(async (edit) => ({ ...edit.next, company: edit.next.company.toUpperCase() }))
    controller.startEdit(0, 0, 'zeta')
    controller.commitEdit()
    await settle()
    await settle()
    expect(controller.data.rowAt(0)?.company).toBe('ZETA')
  })

  it('a value the column refuses keeps the editor open with the reason', async () => {
    const controller = await grid()
    controller.startEdit(0, 0, ' ')
    controller.setDraft('')
    expect(controller.commitEdit()).toBe(false)
    const cell = api(controller).rows[0].cells[0]
    expect(cell.editor?.error).toBe('A company needs a name')
    expect(cell.editor?.inputProps['aria-invalid']).toBe('true')
    // Typing again takes the complaint away.
    controller.setDraft('A')
    expect(api(controller).rows[0].cells[0].editor?.error).toBeUndefined()
  })

  it('an edit that changes nothing saves nothing', async () => {
    let calls = 0
    const controller = await grid(() => {
      calls += 1
    })
    controller.startEdit(0, 1)
    controller.commitEdit()
    await settle()
    expect(calls).toBe(0)
  })

  it('Tab goes on to the next editable cell of the row, skipping the rest', async () => {
    const controller = await grid()
    controller.startEdit(0, 0)
    controller.commitEdit({ move: 'next' })
    expect(controller.getSnapshot().grid.editing).toMatchObject({ row: 0, column: 1 })
    controller.commitEdit({ move: 'next' })
    expect(controller.getSnapshot().grid.editing).toMatchObject({ row: 0, column: 2 })
    // Past the last editable one, the focus moves on and the edit ends.
    controller.commitEdit({ move: 'next' })
    expect(controller.getSnapshot().grid.editing).toBeNull()
    expect(controller.getSnapshot().grid.focus).toEqual({ row: 0, column: 3 })
  })

  it('the row being edited is drawn even when it has scrolled out of view', async () => {
    const controller = await grid()
    controller.startEdit(90, 0)
    const indices = api(controller).rows.map((row) => row.index)
    expect(indices).toContain(90)
    expect(api(controller).rows.find((row) => row.index === 90)?.cells[0].editor?.kind).toBe('text')
  })

  it('a new query closes the editor', async () => {
    const controller = await grid()
    controller.startEdit(0, 0)
    controller.send({ type: 'SET_SEARCH', search: 'acme 1' })
    expect(controller.getSnapshot().grid.editing).toBeNull()
  })
})

describe('the detail sheet', () => {
  it('opens on activation when a sheet is there, walks the rows and follows the grid', async () => {
    const controller = await grid()
    controller.press(4, 3, { shiftKey: false, ctrlKey: false, metaKey: false, detail: 2 })
    expect(controller.getSnapshot().grid.detail).toBeNull()
    const release = controller.provide('detail')
    controller.press(4, 3, { shiftKey: false, ctrlKey: false, metaKey: false, detail: 2 })
    expect(controller.getSnapshot().grid.detail).toBe(4)

    let detail = connectDetail(controller.getSnapshot(), controller, same, { words: { locale: 'en-US' } })
    expect(detail.row?.company).toBe('Acme 5')
    expect(detail.positionText).toBe('5 of 300')

    controller.stepDetail(1)
    expect(controller.getSnapshot().grid.detail).toBe(5)
    expect(controller.getSnapshot().grid.focus?.row).toBe(5)
    // Moving in the grid moves the sheet.
    controller.send({ type: 'FOCUS', row: 9, column: 0 })
    expect(controller.getSnapshot().grid.detail).toBe(9)

    controller.send({ type: 'FOCUS', row: 0, column: 0 })
    detail = connectDetail(controller.getSnapshot(), controller, same)
    expect(detail.prevProps['aria-disabled']).toBe('true')
    controller.stepDetail(-1)
    expect(controller.getSnapshot().grid.detail).toBe(0)

    // Gone with the sheet, or with the query.
    release()
    expect(controller.getSnapshot().grid.detail).toBeNull()
    controller.provide('detail')
    controller.openDetail(3)
    controller.send({ type: 'SET_SEARCH', search: 'acme' })
    expect(controller.getSnapshot().grid.detail).toBeNull()
  })

  it('an editable cell edits on a double click; the others open the row', async () => {
    const controller = await grid()
    controller.provide('detail')
    controller.press(4, 0, { shiftKey: false, ctrlKey: false, metaKey: false, detail: 2 })
    expect(controller.getSnapshot().grid.editing).toMatchObject({ row: 4, column: 0 })
    expect(controller.getSnapshot().grid.detail).toBeNull()
  })
})

describe('the row menu', () => {
  it('a right click asks for it only when a menu is there', async () => {
    const controller = await grid()
    const event = () => ({ preventDefault() { this.prevented = true }, prevented: false, clientX: 10, clientY: 20 })
    const first = event()
    ;(api(controller).rows[2].cells[0].props.onContextMenu as (e: unknown) => void)(first)
    expect(first.prevented).toBe(false)
    expect(controller.getSnapshot().grid.menu).toBeNull()

    controller.provide('menu')
    const second = event()
    ;(api(controller).rows[2].cells[0].props.onContextMenu as (e: unknown) => void)(second)
    expect(second.prevented).toBe(true)
    expect(controller.getSnapshot().grid.menu).toEqual({ row: 2, column: 0, point: { x: 10, y: 20 }, nonce: 1 })
    expect(controller.getSnapshot().grid.focus).toEqual({ row: 2, column: 0 })
    expect(rowMenuTarget(controller.getSnapshot(), controller)).toMatchObject({ index: 2, row: { id: 3 }, selection: null })
  })

  it('on a row inside a selection of several, the menu acts on the selection', async () => {
    const controller = await grid(undefined, true)
    controller.provide('menu')
    controller.send({ type: 'TOGGLE', key: 1, index: 0 })
    controller.send({ type: 'TOGGLE', key: 2, index: 1 })
    controller.openMenu(1, 1, null)
    expect(rowMenuTarget(controller.getSnapshot(), controller)?.selection).toEqual({ mode: 'keys', keys: [1, 2] })
    // Outside the selection, the row alone.
    controller.openMenu(5, 1, null)
    expect(rowMenuTarget(controller.getSnapshot(), controller)?.selection).toBeNull()
  })
})
