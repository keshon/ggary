<script lang="ts" generics="Row">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connectFilters, type ColumnDef, type DataGridController, type FilterBarWords, type FilterDraft, type GridView } from '@ggary/core/data-grid'
  import { mergeProps, svelteNormalizer } from '@ggary/core'
  import { untrack } from 'svelte'
  import Button from '../button/Button.svelte'
  import Menu from '../menu/Menu.svelte'
  import Popover from '../popover/Popover.svelte'
  import FilterEditor from './FilterEditor.svelte'

  type Props = {
    grid: DataGridController<Row>
    /** Queries a person picks by name: "Top of yesterday", "Unassigned". */
    views?: GridView[]
    words?: FilterBarWords & { apply?: string; clear?: string; column?: string; from?: string; to?: string; contains?: string; add?: string; views?: string; clearAll?: string }
  }

  let { grid, views, words: ownWords = {} }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'gridFilters', ownWords))

  let snapshot = $state.raw(untrack(() => grid.getSnapshot()))
  $effect(() => {
    snapshot = grid.getSnapshot()
    return grid.subscribe(() => (snapshot = grid.getSnapshot()))
  })

  const api = $derived(connectFilters(snapshot, grid, svelteNormalizer, { words }))
  let editing = $state<string | null>(null)
  let adding = $state(false)

  const apply = (column: ColumnDef, draft: FilterDraft) => {
    api.apply(column, draft)
    editing = null
    adding = false
  }
</script>

<div {...api.rootProps}>
  {#if views && views.length > 0}
    <Menu
      items={views.map((view) => ({ value: view.id, label: view.label }))}
      onSelect={(id: string) => {
        const view = views.find((candidate) => candidate.id === id)
        if (view) api.applyView(view)
      }}
    >
      {#snippet trigger(props)}
        <Button {...props} size="sm" emphasis="low">{words.views ?? 'Views'}</Button>
      {/snippet}
    </Menu>
  {/if}
  {#each api.chips as chip (chip.key)}
    <span {...chip.rootProps}>
      <Popover
        title={chip.name}
        placement="bottom-start"
        open={editing === chip.key}
        onOpenChange={(open: boolean) => (editing = open ? chip.key : null)}
      >
        {#snippet trigger(props)}
          <button {...mergeProps(props, chip.buttonProps)}>
            <span {...chip.nameProps}>{chip.name}</span>
            <span {...chip.valueProps}>{chip.value}</span>
          </button>
        {/snippet}
        {#key JSON.stringify(chip.filter)}
          <FilterEditor columns={api.columns} column={chip.column} filter={chip.filter} onApply={apply} {words} parts={api} />
        {/key}
      </Popover>
      <button {...chip.removeProps}><span {...chip.removeIconProps}></span></button>
    </span>
  {/each}
  <Popover title={words.add ?? 'Add a filter'} placement="bottom-start" open={adding} onOpenChange={(open: boolean) => (adding = open)}>
    {#snippet trigger(props)}
      <Button {...props} size="sm" emphasis="minimal">{words.add ?? 'Add a filter'}</Button>
    {/snippet}
    {#if adding}
      <FilterEditor columns={api.columns} onApply={apply} {words} parts={api} />
    {/if}
  </Popover>
  {#if api.hasFilters}
    <Button size="sm" emphasis="minimal" onclick={api.clear}>{words.clearAll ?? 'Clear all'}</Button>
  {/if}
</div>
