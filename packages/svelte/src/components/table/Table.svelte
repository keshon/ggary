<script lang="ts" generics="Row">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import {
    connect,
    createTableMachine,
    textOf,
    type TableColumnDef,
    type TableConnectOptions,
    type TableRowKey,
    type TableSort,
    type TableWords,
  } from '@ggary/core/table'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import Checkbox from '../checkbox/Checkbox.svelte'

  type Props = {
    columns: TableColumnDef<Row>[]
    rows: Row[]
    getRowKey?: (row: Row, index: number) => TableRowKey
    /** Read above the table by a screen reader, and shown there. Without it, `label` names the table. */
    caption?: string
    /** The table's accessible name when it carries no caption. */
    label?: string
    /** A checkbox column. Off unless asked for. */
    selectable?: boolean
    /** Bindable: `bind:sort`. A one-way `sort` works too. */
    sort?: TableSort | null
    defaultSort?: TableSort | null
    onSortChange?: (sort: TableSort | null) => void
    /** Bindable: `bind:selection`. A one-way `selection` works too. */
    selection?: TableRowKey[]
    defaultSelection?: TableRowKey[]
    onSelectionChange?: (selection: TableRowKey[]) => void
    /** Reads the row's key for its checkbox. Defaults to the position: "Row 1". */
    rowName?: (row: Row, index: number) => string
    /** A sort button's name, given the column and where it stands. */
    sortLabel?: TableConnectOptions<Row>['sortLabel']
    /** What the table says: empty, select-all. Each entry has an English default. */
    words?: TableWords
    /** A cell of your own; `index` is the position in reading order. */
    cell?: Snippet<[Row, TableColumnDef<Row>, number]>
    [key: string]: unknown
  }

  let {
    columns,
    rows,
    getRowKey,
    caption,
    label,
    selectable,
    sort = $bindable(),
    defaultSort,
    onSortChange,
    selection = $bindable(),
    defaultSelection,
    onSelectionChange,
    rowName,
    sortLabel,
    words: ownWords,
    cell,
    ...rest
  }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'table', ownWords))

  const id = uid('gg-table')

  // Uncontrolled at heart, as `bind:sort` is: a press moves the table and
  // writes the binding, and a new value from outside arrives through SYNC.
  const machine = untrack(() =>
    createTableMachine({
      id,
      columns,
      rows,
      getRowKey,
      selectable,
      sort,
      defaultSort,
      onSortChange: (next) => {
        sort = next
        onSortChange?.(next)
      },
      selection,
      defaultSelection,
      onSelectionChange: (next) => {
        selection = next
        onSelectionChange?.(next)
      },
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { caption, label, rowName, sortLabel, words }))

  $effect(() => machine.send({ type: 'SYNC_ROWS', rows }))
  $effect(() => machine.send({ type: 'SYNC_COLUMNS', columns }))
  $effect(() => {
    if (sort !== undefined) machine.send({ type: 'SYNC_SORT', sort })
  })
  $effect(() => {
    if (selection !== undefined) machine.send({ type: 'SYNC_SELECTION', selection })
  })
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', selectable }))

  const cellText = (column: TableColumnDef<Row>, row: Row) =>
    textOf(column.value ? column.value(row) : (row as Record<string, unknown>)[column.id])
</script>

<table {...rest} {...api.rootProps}>
  {#if caption !== undefined}<caption {...api.captionProps}>{caption}</caption>{/if}
  <thead {...api.headerProps}>
    <tr {...api.headerRowProps}>
      {#if snapshot.selectable}
        <th {...api.selectHeaderCellProps}>
          <Checkbox
            checked={api.allSelected ? true : api.someSelected ? 'indeterminate' : false}
            onCheckedChange={() => api.toggleAll()}
            aria-label={api.texts.selectAll}
          />
        </th>
      {/if}
      {#each snapshot.columns as column (column.id)}
        <th {...api.getHeaderCellProps(column)}>
          {#if column.sortable !== false}
            <button {...api.getSortButtonProps(column)}>
              {column.header}
              <span {...api.getSortIconProps(column)}></span>
            </button>
          {:else}
            {column.header}
          {/if}
        </th>
      {/each}
    </tr>
  </thead>
  <tbody {...api.bodyProps}>
    {#if api.entries.length === 0}
      <tr {...api.emptyRowProps}>
        <td {...api.emptyCellProps()}>
          <span {...api.emptyProps}>{api.texts.empty}</span>
        </td>
      </tr>
    {:else}
      {#each api.entries as entry (entry.key)}
        <tr {...api.getRowProps(entry)}>
          {#if snapshot.selectable}
            <td {...api.getSelectCellProps(entry)}>
              <Checkbox
                checked={entry.selected}
                onCheckedChange={() => api.toggleRow(entry.key)}
                aria-label={`Select ${api.rowNameOf(entry)}`}
              />
            </td>
          {/if}
          {#each snapshot.columns as column (column.id)}
            <td {...api.getCellProps(column, entry)}>
              {#if cell}{@render cell(entry.row, column, entry.index)}{:else}{cellText(column, entry.row)}{/if}
            </td>
          {/each}
        </tr>
      {/each}
    {/if}
  </tbody>
</table>
