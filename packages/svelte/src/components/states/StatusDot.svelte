<script lang="ts">
  import { connectDot, type StatusDotProps } from '@ggary/core/states'
  import { svelteNormalizer } from '@ggary/core'

  // No children: a dot stands beside a word, never holds one.
  let { tone, ...rest }: StatusDotProps & { [key: string]: unknown } = $props()
  const api = $derived(connectDot({ tone }, svelteNormalizer))
</script>

<span {...rest} {...api.rootProps}></span>
