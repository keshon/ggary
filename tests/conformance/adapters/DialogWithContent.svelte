<script lang="ts">
  import { Button, Dialog, Sheet } from '../../../packages/svelte/src/index'

  let { trigger: triggerLabel, triggerIsButton, body = 'Body', footer: footerLabel, sheet, ...rest }: Record<string, any> = $props()
  const Component = sheet ? Sheet : Dialog
  const side = sheet && sheet !== true ? { side: sheet } : {}
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

<Component {...rest} {...side} trigger={triggerLabel ? trigger : undefined} footer={footerLabel ? footer : undefined}>
  <p>{body}</p>
  <button type="button">Body action</button>
</Component>
