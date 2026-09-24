<script lang="ts">
  import { connectColumns, type ColumnsProps } from '@ggary/core/flow'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { gap, align, children, ...rest }: ColumnsProps & { children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connectColumns({ gap, align }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children?.()}</div>
