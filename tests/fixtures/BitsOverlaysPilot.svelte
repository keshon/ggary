<script lang="ts">
  import Dialog from '../../packages/svelte/src/components/dialog/Dialog.svelte'
  import Popover from '../../packages/svelte/src/components/popover/Popover.svelte'
  import Tooltip from '../../packages/svelte/src/components/tooltip/Tooltip.svelte'
  import Select from '../../packages/svelte/src/components/select/Select.svelte'
</script>
<Dialog title="Overlay pilot">
  {#snippet trigger(props)}<button {...props}>Open overlays</button>{/snippet}
  <Popover title="Nested settings" closeButton>
    {#snippet trigger(props)}<button {...props}>Nested settings</button>{/snippet}
    <Select label="Nested stage" items={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }]} />
  </Popover>
  <Tooltip content="Helpful text" openDelay={0} closeDelay={60}>
    {#snippet trigger(props)}<button {...props}>Help trigger</button>{/snippet}
  </Tooltip>
</Dialog>
<Tooltip content="Outside help" openDelay={0} closeDelay={60}>
  {#snippet trigger(props)}<button {...props}>Outside help trigger</button>{/snippet}
</Tooltip>
