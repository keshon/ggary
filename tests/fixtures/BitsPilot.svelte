<script lang="ts">
  import { Dialog, Select } from '../../packages/svelte/src/index'
  let { onOpenChange, onValueChange, persistent = false }: {
    onOpenChange?: (open: boolean, details: { reason: string; returnValue?: string }) => void
    onValueChange?: (value: string | null) => void
    persistent?: boolean
  } = $props()
  let open = $state(false)
  let value = $state<string | null>('a')
</script>
<button type="button" id="outside-pilot">Outside</button>
<Dialog bind:open title="Pilot settings" {onOpenChange} closeOnOutside={!persistent} closeOnEscape={!persistent}>
  {#snippet trigger(props)}<button {...props}>Open pilot</button>{/snippet}
  <form method="dialog">
    <Select label="Pilot stage" name="stage" bind:value {onValueChange} items={[
      { value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }, { value: 'c', label: 'Charlie', disabled: true }
    ]} />
    <button type="reset">Reset stage</button>
    <button type="submit" value="accepted">Apply pilot</button>
  </form>
</Dialog>
<output aria-label="Pilot state">{open ? 'open' : 'closed'}:{value}</output>
