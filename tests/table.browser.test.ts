import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, type ReactElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Table, type TableProps } from '../packages/react/src/index'
import type { TableColumnDef } from '../packages/core/src/components/table'
import { deals, type Deal } from '../apps/docs/src/pages/table/data'

/**
 * What only a browser answers about the table: real buttons sorting with
 * `aria-sort` said, and native checkboxes choosing rows.
 */
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) root.unmount()
  roots = []
  document.body.replaceChildren()
})

const columns: TableColumnDef<Deal>[] = [
  { id: 'company', header: 'Company' },
  { id: 'value', header: 'Value' },
  { id: 'stage', header: 'Stage', sortable: false },
]

/** Renders into a fresh host on the body, synchronously, and returns the host. */
const mount = (node: React.ReactNode) => {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(node))
  return host
}

const part = (root: Element, scope: string, name: string) =>
  root.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)!
const parts = (root: Element, scope: string, name: string) =>
  [...root.querySelectorAll<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)]

const tableOf = (props: Partial<TableProps<Deal>> = {}) =>
  mount(h(Table as unknown as (props: TableProps<Deal>) => ReactElement, { label: 'Deals', columns, rows: deals, getRowKey: (row) => row.company, ...props }))

describe('table in a real browser', () => {
  it('is a native table named by its caption, with scoped columns', () => {
    const host = mount(h(Table as unknown as (props: TableProps<Deal>) => ReactElement, { caption: 'Pipeline', columns, rows: deals }))
    const table = part(host, 'table', 'root')
    expect(table.tagName).toBe('TABLE')
    expect(part(host, 'table', 'caption')!.textContent).toBe('Pipeline')
    expect(table.hasAttribute('aria-label')).toBe(false)
    expect(parts(host, 'table', 'header-cell').map((cell) => cell.getAttribute('scope'))).toEqual(['col', 'col', 'col'])
  })

  it('a header press walks asc, desc, unsorted, and says where it stands', async () => {
    const onSortChange = vi.fn()
    const host = tableOf({ onSortChange })
    const value = () => parts(host, 'table', 'row').map((row) => part(row, 'table', 'cell')!.textContent)
    const button = () => part(parts(host, 'table', 'header-cell')[1], 'table', 'sort') as HTMLButtonElement

    expect(value()[0]).toBe('Acme Labs')
    await userEvent.click(button())
    expect(parts(host, 'table', 'header-cell')[1].getAttribute('aria-sort')).toBe('ascending')
    expect(button().getAttribute('aria-label')).toContain('descending')
    expect(value()[0]).toBe('Cobalt Works')

    await userEvent.click(button())
    expect(parts(host, 'table', 'header-cell')[1].getAttribute('aria-sort')).toBe('descending')
    expect(value()[0]).toBe('Granite Holding')

    await userEvent.click(button())
    expect(parts(host, 'table', 'header-cell')[1].getAttribute('aria-sort')).toBe('none')
    expect(value()[0]).toBe('Acme Labs')
    expect(onSortChange).toHaveBeenCalledTimes(3)
    expect(onSortChange).toHaveBeenLastCalledWith(null)
  })

  it('chooses rows with native boxes, all at once from the header', async () => {
    const onSelectionChange = vi.fn()
    const host = tableOf({ selectable: true, onSelectionChange })
    // Pointer users press the drawn box: the label wrapping the native input.
    const boxes = () => parts(host, 'table', 'body')[0].querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>
    const press = (input: HTMLInputElement) => userEvent.click(input.closest('label')!)
    const all = () => parts(host, 'table', 'header-cell')[0].querySelector('input[type="checkbox"]') as HTMLInputElement

    expect(parts(host, 'table', 'row').filter((row) => row.hasAttribute('data-selected'))).toHaveLength(0)
    await press(boxes()[1])
    expect(parts(host, 'table', 'row').filter((row) => row.hasAttribute('data-selected'))).toHaveLength(1)
    expect(all().indeterminate).toBe(true)

    await press(all())
    expect(parts(host, 'table', 'row').filter((row) => row.hasAttribute('data-selected'))).toHaveLength(deals.length)
    expect(onSelectionChange).toHaveBeenLastCalledWith(expect.arrayContaining(['Acme Labs']))
  })
})
