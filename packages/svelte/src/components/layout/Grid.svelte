<script lang="ts">
  import { connectGrid, type GridProps } from '@ggary/core/flow'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  /** Cards in columns that fall to fewer as the width narrows. */
  let { gap, columns, children, ...rest }: GridProps & { children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connectGrid({ gap, columns }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children?.()}</div>
