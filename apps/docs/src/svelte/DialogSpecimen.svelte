<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { DialogSize, DialogPlacement, DialogRole } from '@ggary/core/dialog'
  let { title, description, children, footer, size = 'md', placement = 'center',
    role = 'dialog', closeButton = true }: {
    title?: string; description?: string; children?: Snippet; footer?: Snippet;
    size?: DialogSize; placement?: DialogPlacement; role?: DialogRole; closeButton?: boolean
  } = $props()
  const part = (name: string) => ({ 'data-scope': 'dialog', 'data-part': name })
</script>

<!-- Visual preview only; live examples use the public Dialog/Sheet. -->
<dialog {...part('content')} open data-size={size} data-placement={placement} {role}>
  <header {...part('header')}>
    {#if title != null}<h2 {...part('title')}>{title}</h2>{/if}
    {#if description != null}<p {...part('description')}>{description}</p>{/if}
    {#if closeButton}<span {...part('close')} aria-hidden="true"><span {...part('close-icon')} data-icon="close"></span></span>{/if}
  </header>
  <div {...part('body')}><div class="select-pilot-layout">{@render children?.()}</div></div>
  {#if footer}<footer {...part('footer')}>{@render footer()}</footer>{/if}
</dialog>
