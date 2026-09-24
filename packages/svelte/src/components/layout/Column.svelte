<script lang="ts">
  import { connectColumn, type ColumnProps } from '@ggary/core/flow'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { span, start, children, ...rest }: ColumnProps & { children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connectColumn({ span, start }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children?.()}</div>
