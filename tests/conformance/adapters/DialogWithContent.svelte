<script lang="ts">
  import { Button, Dialog } from '../../../packages/svelte/src/index'

  let { trigger: triggerLabel, triggerIsButton, body = 'Body', footer: footerLabel, ...rest }: Record<string, any> = $props()
</script>

{#snippet trigger(props: Record<string, unknown>)}
  {#if triggerIsButton}
    <Button {...props}>{triggerLabel}</Button>
  {:else}
    <button {...props}>{triggerLabel}</button>
  {/if}
{/snippet}

{#snippet footer()}
  <button type="button">{footerLabel}</button>
{/snippet}

<Dialog {...rest} trigger={triggerLabel ? trigger : undefined} footer={footerLabel ? footer : undefined}>
  <p>{body}</p>
  <button type="button">Body action</button>
</Dialog>
