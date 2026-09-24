<script lang="ts" generics="Row">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import {
    connect,
    createArraySource,
    createDataGrid,
    type CellEdit,
    type ColumnDef,
    type DataGridController,
    type DataGridWords,
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
    /** Save an edited cell (columns opt in with `editable`); a rejection puts the old value back. */
    onCellEdit?: (edit: CellEdit<Row>) => Promise<Row | void> | Row | void
    /** A cell of your own; `text` is the formatted value. */
    cell?: Snippet<[Row, ColumnDef<Row>, string]>
    /** Shown when the query matches nothing. */
    empty?: Snippet
    /** Everything the grid says: empty, error, retry, saveFailed, notANumber, … */
    words?: DataGridWords
    locale?: string
    rowHeight?: number
    blockSize?: number
    /** Bindable: the controller, for bulk actions and a filter bar. */
    controller?: DataGridController<Row>
    style?: string
  }

  let {
    columns, rows, source, rowKey, label, selectable, initialQuery, onQueryChange, onSelectionChange, onRowActivate,
    cell, empty, words: ownWords, locale: ownLocale, rowHeight, blockSize,
    controller = $bindable(), style, onCellEdit,
  }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'dataGrid', ownWords))

  const id = uid('gg-grid')

  const sourceFor = (given: GridSource<Row> | undefined, list: readonly Row[] | undefined) => {
    if (given) return given
    if (list) return createArraySource(list, columns, { locale })
    throw new Error('DataGrid needs `rows` or a `source`.')
  }

  const grid = untrack(() =>
    createDataGrid<Row>({
      columns, source: sourceFor(source, rows), rowKey, selectable, rowHeight, blockSize, query: initialQuery,
      onQueryChange, onSelectionChange, onRowActivate, onCellEdit, words,
    })
  )
  untrack(() => (controller = grid))

  $effect(() => {
    grid.update({ columns, source: sourceFor(source, rows), rowKey, onQueryChange, onSelectionChange, onRowActivate, onCellEdit })
  })

  let snapshot = $state.raw(grid.getSnapshot())
  const stop = grid.subscribe(() => (snapshot = grid.getSnapshot()))
  onDestroy(() => {
    stop()
    grid.destroy()
  })

  const api = $derived(connect(snapshot, grid, svelteNormalizer, { id, label, locale, words }))

  // The editor takes the focus when it appears, the caret after what it holds.
  const takeFocus = (field: HTMLInputElement | HTMLSelectElement) => {
    field.focus({ preventScroll: true })
    if (field instanceof HTMLInputElement && field.type === 'text') field.setSelectionRange(field.value.length, field.value.length)
  }
</script>

<div {...api.frameProps} style={[api.frameProps.style, style].filter(Boolean).join('; ')}>
  <div {...api.rootProps} {@attach (root) => grid.attach(root)}>
    <div {...api.headerProps}>
      {#each api.headerCells as header (header.key)}
        <div {...header.props}>
          {#if header.isSelect}
            <span {...api.checkboxControlProps}><input {...header.checkboxProps} indeterminate={header.indeterminate} /><span {...header.checkboxIndicatorProps}></span></span>
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
                <span {...api.checkboxControlProps}><input {...item.checkboxProps} /><span {...api.checkboxIndicatorProps}></span></span>
              {:else if line.row === undefined}
                <span {...api.placeholderProps}></span>
              {:else if item.editor}
                {#if item.editor.kind === 'select'}
                  <select {...item.editor.inputProps} {@attach takeFocus}>
                    {#each item.editor.options as option (option.value)}
                      <option {...item.editor.optionProps} value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                {:else}
                  <input {...item.editor.inputProps} {@attach takeFocus} />
                {/if}
                {#if item.editor.error}<span {...item.editor.errorProps}>{item.editor.error}</span>{/if}
              {:else if cell && item.def}
                {@render cell(line.row, item.def as ColumnDef<Row>, item.text)}
              {:else}
                {item.text}
              {/if}{#if item.openProps}<button {...item.openProps}><span {...api.openIconProps}></span></button>{/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  {#if api.overlay}
    <div {...api.overlayProps}>
      {#if api.overlay === 'error'}
        <p {...api.overlayTextProps}>{api.errorText}</p>
        <button {...api.retryProps}>{api.retryText}</button>
      {:else if empty}
        {@render empty()}
      {:else}
        <p {...api.overlayTextProps}>{api.emptyText}</p>
      {/if}
    </div>
  {/if}
  <div {...api.statusProps}>{api.statusText}</div>
</div>
