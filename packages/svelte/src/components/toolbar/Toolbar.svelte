<script lang="ts">
  import { connect, type ToolbarProps } from '@ggary/core/toolbar'
  import { attachToolbarKeys, svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let {
    label, orientation = 'horizontal', children, ...rest
  }: ToolbarProps & { children: Snippet; [key: string]: unknown } = $props()

  const api = $derived(connect({ label, orientation }, svelteNormalizer))
</script>

<div
  {...rest}
  {...api.rootProps}
  {@attach (root) => (api.managed ? attachToolbarKeys(root, orientation) : undefined)}
>
  {@render children()}
</div>
