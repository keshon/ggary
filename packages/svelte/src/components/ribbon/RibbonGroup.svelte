<script lang="ts">
  import { connectGroup } from '@ggary/core/ribbon'
  import { attachToolbarKeys, svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let {
    label,
    children,
    ...rest
  }: { label: string; children: Snippet; [key: string]: unknown } = $props()

  const group = $derived(connectGroup(label, svelteNormalizer))
</script>

<div
  {...rest}
  {...group.groupProps}
  {@attach (root) => attachToolbarKeys(root, 'horizontal')}
>
  <div {...group.bodyProps}>{@render children()}</div>
  <div {...group.labelProps}>{group.label}</div>
</div>
