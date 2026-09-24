<script lang="ts">
  import { Tabs } from '../../../packages/svelte/src/index'

  let { panels = true, ...rest }: any = $props()
</script>

{#snippet panel(item: { label: string })}
  Panel {item.label}
{/snippet}

<Tabs {...rest} panel={panels ? panel : undefined} />
