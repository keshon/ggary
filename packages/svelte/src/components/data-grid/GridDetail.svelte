<script lang="ts" generics="Row">
  import { connectDetail, type DataGridController, type DetailWords } from '@ggary/core/data-grid'
  import type { DialogSize } from '@ggary/core/dialog'
  import { svelteNormalizer } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import Sheet from '../dialog/Sheet.svelte'

  type Props = {
    grid: DataGridController<Row>
    /** The sheet's heading for a row: a lead's company, an order's number. */
    title: (row: Row) => string
    description?: (row: Row) => string
    /** The row, laid out: fields, history, a form that saves with `grid.saveCell`. */
    children: Snippet<[Row, number]>
    /** Beside the previous and next buttons. */
    footer?: Snippet<[Row, number]>
    words?: DetailWords
    /** Shown while a row stepped to is still loading. */
    loadingText?: string
    side?: 'start' | 'end'
    size?: DialogSize
    /** Default false: the grid stays usable beside the sheet. */
    modal?: boolean
  }

  let { grid, title, description, children, footer: footerSlot, words, loadingText = 'Loading…', side, size, modal = false }: Props = $props()

  /*
   * One row in a sheet beside the grid. It opens on Enter or a double click on
   * a row, walks to the previous and next rows without closing, and follows
   * the grid: arrow keys or a press on another row show that row.
   */
  $effect(() => grid.provide('detail'))

  let snapshot = $state.raw(untrack(() => grid.getSnapshot()))
  $effect(() => {
    snapshot = grid.getSnapshot()
    return grid.subscribe(() => (snapshot = grid.getSnapshot()))
  })
  const api = $derived(connectDetail(snapshot, grid, svelteNormalizer, { words }))
</script>

<Sheet
  open={api.open}
  onOpenChange={api.onOpenChange}
  {side}
  {size}
  {modal}
  closeOnOutside={false}
  title={api.row === undefined ? loadingText : title(api.row)}
  description={api.row === undefined || !description ? undefined : description(api.row)}
>
  {#if api.row === undefined || api.index === null}
    <p>{loadingText}</p>
  {:else}
    {@render children(api.row, api.index)}
  {/if}
  {#snippet footer()}
    <div {...api.navProps}>
      <button {...api.prevProps}><span {...api.prevIconProps}></span></button>
      <span {...api.positionProps}>{api.positionText}</span>
      <button {...api.nextProps}><span {...api.nextIconProps}></span></button>
    </div>
    {#if api.row !== undefined && api.index !== null}{@render footerSlot?.(api.row, api.index)}{/if}
  {/snippet}
</Sheet>
