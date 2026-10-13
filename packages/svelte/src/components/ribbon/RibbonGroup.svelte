<script lang="ts">
  import { connectGroup } from '@ggary/core/ribbon'
  import { provideToolbar } from '../toolbar/context'
  import Toolbar from '../toolbar/Toolbar.svelte'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let {
    label,
    managed = true,
    children,
    ...rest
  }: { label: string; managed?: boolean; children: Snippet; [key: string]: unknown } = $props()

  provideToolbar(() => false)
  const group = $derived(connectGroup(label, svelteNormalizer))
</script>

<div
  {...rest}
  {...group.groupProps}
  role="group"
>
  <div {...group.bodyProps}>{#if managed}<Toolbar {label} style="display: contents">{@render children()}</Toolbar>{:else}{@render children()}{/if}</div>
  <div {...group.labelProps}>{group.label}</div>
</div>
