<script lang="ts" generics="Row">
  import { connectColumns, type DataGridController } from '@ggary/core/data-grid'
  import { svelteNormalizer } from '@ggary/core'
  import { untrack } from 'svelte'
  import Button from '../button/Button.svelte'
  import CheckboxGroup from '../checkbox-group/CheckboxGroup.svelte'
  import Popover from '../popover/Popover.svelte'

  let { grid, words = {} }: { grid: DataGridController<Row>; words?: { label?: string; reset?: string } } = $props()

  let snapshot = $state.raw(untrack(() => grid.getSnapshot()))
  $effect(() => {
    snapshot = grid.getSnapshot()
    return grid.subscribe(() => (snapshot = grid.getSnapshot()))
  })
  const api = $derived(connectColumns(snapshot, grid, svelteNormalizer))
</script>

<Popover title={words.label ?? 'Columns'} placement="bottom-end">
  {#snippet trigger(props)}
    <Button {...props} size="sm" emphasis="low">{words.label ?? 'Columns'}</Button>
  {/snippet}
  <div {...api.rootProps}>
    <CheckboxGroup label={words.label ?? 'Columns'} items={api.items} value={api.value} onValueChange={api.setVisible} />
    <Button {...api.resetProps} size="sm" emphasis="minimal" onclick={api.reset}>{words.reset ?? 'Reset columns'}</Button>
  </div>
</Popover>
