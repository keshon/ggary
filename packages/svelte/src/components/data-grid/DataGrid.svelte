<script lang="ts" generics="Row">
  import {
    connect,
    createArraySource,
    createDataGrid,
    type ColumnDef,
    type DataGridController,
    type GridQuery,
    type GridSource,
    type RowKey,
    type Selection,
  } from '@ggary/core/data-grid'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { onDestroy, untrack, type Snippet } from 'svelte'

  type Props = {
    columns: ColumnDef<Row>[]
    /** Rows in the page: the grid sorts and filters them itself. */
    rows?: readonly Row[]
    /** Or a source that answers queries — a server. Takes precedence over `rows`. */
    source?: GridSource<Row>
    rowKey: (row: Row) => RowKey
    label: string
    selectable?: boolean
    initialQuery?: Partial<GridQuery>
    onQueryChange?: (query: GridQuery) => void
    onSelectionChange?: (selection: Selection) => void
    onRowActivate?: (row: Row, index: number) => void
    /** A cell of your own; `text` is the formatted value. */
    cell?: Snippet<[Row, ColumnDef<Row>, string]>
    /** Shown when the query matches nothing. */
    empty?: Snippet
    emptyText?: string
    errorText?: string
    retryLabel?: string
    locale?: string
    rowHeight?: number
    blockSize?: number
    /** Bindable: the controller, for bulk actions and a filter bar. */
    controller?: DataGridController<Row>
    style?: string
  }

  let {
    columns, rows, source, rowKey, label, selectable, initialQuery, onQueryChange, onSelectionChange, onRowActivate,
    cell, empty, emptyText, errorText, retryLabel = 'Try again', locale, rowHeight, blockSize,
    controller = $bindable(), style,
  }: Props = $props()

  const id = uid('gg-grid')

  const sourceFor = (given: GridSource<Row> | undefined, list: readonly Row[] | undefined) => {
    if (given) return given
    if (list) return createArraySource(list, columns, { locale })
    throw new Error('DataGrid needs `rows` or a `source`.')
  }

  const grid = untrack(() =>
    createDataGrid<Row>({
      columns, source: sourceFor(source, rows), rowKey, selectable, rowHeight, blockSize, query: initialQuery,
      onQueryChange, onSelectionChange, onRowActivate,
    })
  )
  untrack(() => (controller = grid))

  $effect(() => {
    grid.update({ columns, source: sourceFor(source, rows), rowKey, onQueryChange, onSelectionChange, onRowActivate })
  })

  let snapshot = $state.raw(grid.getSnapshot())
  const stop = grid.subscribe(() => (snapshot = grid.getSnapshot()))
  onDestroy(() => {
    stop()
    grid.destroy()
  })

  const api = $derived(connect(snapshot, grid, svelteNormalizer, { id, label, emptyText, errorText, locale }))
</script>

<div {...api.frameProps} {style}>
  <div {...api.rootProps} {@attach (root) => grid.attach(root)}>
    <div {...api.headerProps}>
      {#each api.headerCells as header (header.key)}
        <div {...header.props}>
          {#if header.isSelect}
            <input {...header.checkboxProps} indeterminate={header.indeterminate} />
          {:else}
            <span {...header.labelProps}>{header.label}</span>
            {#if header.sortable}<span {...header.sortProps}></span>{/if}
            <span {...header.resizeProps}></span>
          {/if}
        </div>
      {/each}
    </div>
    <div {...api.bodyProps}>
      {#each api.rows as line (line.key)}
        <div {...line.props}>
          {#each line.cells as item (item.key)}
            <div {...item.props}>
              {#if item.isSelect}
                <input {...item.checkboxProps} />
              {:else if line.row === undefined}
                <span {...api.placeholderProps}></span>
              {:else if cell && item.def}
                {@render cell(line.row, item.def as ColumnDef<Row>, item.text)}
              {:else}
                {item.text}
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  {#if api.overlay}
    <div {...api.overlayProps}>
      {#if api.overlay === 'error'}
        <p>{api.errorText}</p>
        <button type="button" onclick={api.retry}>{retryLabel}</button>
      {:else if empty}
        {@render empty()}
      {:else}
        <p>{api.emptyText}</p>
      {/if}
    </div>
  {/if}
  <div {...api.statusProps}>{api.statusText}</div>
</div>
