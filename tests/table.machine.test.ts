import { describe, expect, it, vi } from 'vitest'
import { compareValues, createTableMachine, sortEntries } from '../packages/core/src/components/table'
import type { TableColumnDef } from '../packages/core/src/components/table'

interface Row {
  company: string
  value: number | null
  updated: string
  active: boolean
  at: Date
}

const columns: TableColumnDef<Row>[] = [
  { id: 'company', header: 'Company' },
  { id: 'value', header: 'Value' },
  { id: 'updated', header: 'Updated' },
  { id: 'active', header: 'Active', sortable: false },
]

const rows: Row[] = [
  { company: 'Cobalt Works', value: 9500, updated: '2026-09-30', active: false, at: new Date('2026-09-30') },
  { company: 'Acme Labs', value: null, updated: '2026-09-28', active: true, at: new Date('2026-09-28') },
  { company: 'Row 10', value: 73000, updated: '2026-09-18', active: true, at: new Date('2026-09-18') },
  { company: 'Row 2', value: 21000, updated: '2026-09-21', active: false, at: new Date('2026-09-21') },
]

describe('table values', () => {
  it('orders numbers by size, words with numbers inside as numbers, and missing values last', () => {
    expect(compareValues(2, 10)).toBeLessThan(0)
    expect(compareValues('Row 2', 'Row 10')).toBeLessThan(0)
    expect(compareValues(null, 1)).toBeGreaterThan(0)
    expect(compareValues(1, null)).toBeLessThan(0)
    expect(compareValues(null, undefined)).toBe(0)
    expect(compareValues(new Date('2026-01-02'), new Date('2026-01-01'))).toBeGreaterThan(0)
  })

  it('sorts stably, and ignores a column that is gone or never sorted', () => {
    const byValue = sortEntries(rows, columns, { column: 'value', direction: 'asc' }).map((entry) => entry.row.company)
    // null sorts last even ascending
    expect(byValue).toEqual(['Cobalt Works', 'Row 2', 'Row 10', 'Acme Labs'])
    const byName = sortEntries(rows, columns, { column: 'company', direction: 'desc' }).map((entry) => entry.row.company)
    expect(byName[0]).toBe('Row 10')
    expect(sortEntries(rows, columns, null).map((entry) => entry.index)).toEqual([0, 1, 2, 3])
    expect(sortEntries(rows, columns, { column: 'active', direction: 'asc' }).map((entry) => entry.index)).toEqual([0, 1, 2, 3])
    expect(sortEntries(rows, columns, { column: 'gone', direction: 'asc' }).map((entry) => entry.index)).toEqual([0, 1, 2, 3])
  })
})

describe('table sort', () => {
  it('a header press walks asc, desc, then unsorted; a locked column is deaf', () => {
    const onSortChange = vi.fn()
    const machine = createTableMachine({ id: 't', columns, rows, onSortChange })
    expect(machine.getState().sort).toBeNull()

    machine.send({ type: 'SORT', column: 'company' })
    expect(machine.getState().sort).toEqual({ column: 'company', direction: 'asc' })
    machine.send({ type: 'SORT', column: 'company' })
    expect(machine.getState().sort).toEqual({ column: 'company', direction: 'desc' })
    machine.send({ type: 'SORT', column: 'company' })
    expect(machine.getState().sort).toBeNull()
    expect(onSortChange).toHaveBeenCalledTimes(3)
    expect(onSortChange).toHaveBeenLastCalledWith(null)

    machine.send({ type: 'SORT', column: 'active' })
    expect(machine.getState().sort).toBeNull()
    expect(onSortChange).toHaveBeenCalledTimes(3)
  })

  it('a lost sort column clears the sort and says so', () => {
    const onSortChange = vi.fn()
    const machine = createTableMachine({ id: 't', columns, rows, defaultSort: { column: 'value', direction: 'asc' }, onSortChange })
    machine.send({ type: 'SYNC_COLUMNS', columns: columns.filter((column) => column.id !== 'value') })
    expect(machine.getState().sort).toBeNull()
    expect(onSortChange).toHaveBeenCalledWith(null)
  })
})

describe('table selection', () => {
  const keyed = { getRowKey: (row: Row) => row.company }

  it('chooses rows one by one, and all at once until they all are', () => {
    const onSelectionChange = vi.fn()
    const machine = createTableMachine({ id: 't', columns, rows, selectable: true, ...keyed, onSelectionChange })

    machine.send({ type: 'SELECT_ROW', key: 'Acme Labs' })
    expect(machine.getState().selection).toEqual(['Acme Labs'])
    machine.send({ type: 'SELECT_ROW', key: 'Acme Labs' })
    expect(machine.getState().selection).toEqual([])
    expect(onSelectionChange).toHaveBeenCalledTimes(2)

    machine.send({ type: 'SELECT_ALL' })
    expect(machine.getState().selection).toHaveLength(4)
    machine.send({ type: 'SELECT_ALL' })
    expect(machine.getState().selection).toEqual([])
  })

  it('forgets rows that went away, and stays silent with nothing to choose', () => {
    const onSelectionChange = vi.fn()
    const machine = createTableMachine({
      id: 't', columns, rows, selectable: true, ...keyed,
      defaultSelection: ['Acme Labs', 'Gone Inc'], onSelectionChange,
    })
    expect(machine.getState().selection).toEqual(['Acme Labs', 'Gone Inc'])
    machine.send({ type: 'SYNC_ROWS', rows: [...rows] })
    expect(machine.getState().selection).toEqual(['Acme Labs'])
    expect(onSelectionChange).toHaveBeenCalledWith(['Acme Labs'])

    machine.send({ type: 'SYNC_ROWS', rows: [] })
    machine.send({ type: 'SELECT_ALL' })
    expect(machine.getState().selection).toEqual([])
  })

  it('a controlled table reports but never moves on its own', () => {
    const onSortChange = vi.fn()
    const onSelectionChange = vi.fn()
    const machine = createTableMachine({
      id: 't', columns, rows, selectable: true, ...keyed,
      sort: null, selection: [], onSortChange, onSelectionChange,
    })
    machine.send({ type: 'SORT', column: 'company' })
    machine.send({ type: 'SELECT_ROW', key: 'Acme Labs' })
    expect(machine.getState().sort).toBeNull()
    expect(machine.getState().selection).toEqual([])
    expect(onSortChange).toHaveBeenCalledWith({ column: 'company', direction: 'asc' })
    expect(onSelectionChange).toHaveBeenCalledWith(['Acme Labs'])
  })
})
