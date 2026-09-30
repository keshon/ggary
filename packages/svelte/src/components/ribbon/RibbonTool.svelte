<script lang="ts">
  import { connectTool } from '@ggary/core/ribbon'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { children, ...rest }: { children: Snippet; [key: string]: unknown } = $props()

  const { toolProps } = connectTool(svelteNormalizer)
</script>

<div {...rest} {...toolProps}>{@render children()}</div>
