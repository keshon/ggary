<script lang="ts">
  import { connect, type CardProps } from '@ggary/core/card'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = CardProps & { children?: Snippet; [key: string]: unknown }

  let { title, subtitle, headingLevel, href, interactive, plain, rank, tone, children, ...rest }: Props = $props()
  const api = $derived(connect({ title, subtitle, headingLevel, href, interactive, plain, rank, tone }, svelteNormalizer))
</script>

<svelte:element this={api.element} {...api.rootProps} {...rest}>
  {#if api.showHeader}
    <div {...api.headerProps}>
      {#if title !== undefined}
        <svelte:element this={api.titleElement} {...api.titleProps}>{title}</svelte:element>
      {/if}
      {#if subtitle !== undefined}
        <p {...api.subtitleProps}>{subtitle}</p>
      {/if}
    </div>
  {/if}
  {@render children?.()}
</svelte:element>
