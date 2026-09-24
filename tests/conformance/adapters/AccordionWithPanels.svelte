<script lang="ts">
  import { Accordion } from '../../../packages/svelte/src/index'

  let rest: any = $props()
</script>

{#snippet panel(item: { label: string })}
  Body {item.label}
{/snippet}

<Accordion {...rest as any} {panel} />
