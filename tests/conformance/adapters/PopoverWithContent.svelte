<script lang="ts">
  import { Popover } from '../../../packages/svelte/src/index'

  let { trigger: triggerLabel, body = 'Body', ...rest }: any = $props()
</script>

{#snippet trigger(props: Record<string, unknown>)}
  <button {...props}>{triggerLabel}</button>
{/snippet}

<Popover {...rest} {trigger}>
  <p>{body}</p>
  <button type="button">Inside</button>
</Popover>
