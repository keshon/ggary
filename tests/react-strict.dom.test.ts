import { afterEach, describe, expect, it } from 'vitest'
import { StrictMode, act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DataGrid } from '../packages/react/src/index'
import type { ColumnDef } from '../packages/core/src/components/data-grid'

/**
 * React's StrictMode takes every component away once and puts it back, in
 * development. A component that tore itself down on the first unmount is dead
 * for good — which is how the sandbox's grid once sat on "Loading…" forever
 * while every conformance test passed, because the harness renders without it.
 */
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.replaceChildren()
})

describe('React StrictMode', () => {
  it('the data grid survives being unmounted and remounted, and loads', async () => {
    const columns: ColumnDef<{ id: number; name: string }>[] = [{ id: 'name', header: 'Name' }]
    const rows = [
      { id: 1, name: 'Acme' },
      { id: 2, name: 'Borealis' },
    ]
    const host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    await act(async () => {
      root!.render(createElement(StrictMode, null, createElement(DataGrid<{ id: number; name: string }>, { columns, rows, rowKey: (row) => row.id, label: 'Leads' })))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    const loaded = host.querySelectorAll('[data-part="row"]:not([data-placeholder])')
    expect([...loaded].map((row) => row.textContent)).toEqual(['Acme', 'Borealis'])
    expect(host.querySelector('[data-part="status"]')!.textContent).toBe('2 rows')
  })
})
