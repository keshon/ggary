<script lang="ts">
  import { connect, type DividerProps } from '@ggary/core/divider'
  import { svelteNormalizer } from '@ggary/core'

  let { orientation, label, align, emphasis, ...rest }: DividerProps & { [key: string]: unknown } = $props()
  const api = $derived(connect({ orientation, label, align, emphasis }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{#if api.label}<span {...api.labelProps}>{api.label}</span>{/if}</div>
