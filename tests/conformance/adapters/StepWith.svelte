<script lang="ts">
  import { Step } from '../../../packages/svelte/src/index'

  /** The spec hands plain text; Svelte wants snippets, and only where there is something to render. */
  let { input, output, ...rest }: any = $props()
</script>

{#snippet outputBody()}{output}{/snippet}

<Step {...rest} output={output !== undefined ? outputBody : undefined}>
  {#if input !== undefined}{input}{/if}
</Step>
