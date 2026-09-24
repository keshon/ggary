<script lang="ts">
  import { Menu } from '../../../packages/svelte/src/index'

  let { trigger: triggerLabel, ...rest }: any = $props()
</script>

{#snippet trigger(props: Record<string, unknown>)}
  <button {...props}>{triggerLabel}</button>
{/snippet}

<Menu {...rest} {trigger} />
