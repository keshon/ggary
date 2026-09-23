<script lang="ts">
  import { connect, type RingProps } from '@ggary/core/ring'
  import { svelteNormalizer } from '@ggary/core'

  /** The same share as a meter's, in the size of a control. The geometry is core's; this only draws it. */
  let props: RingProps = $props()

  const api = $derived(connect(props, svelteNormalizer))
</script>

<svg {...api.rootProps}>
  <circle {...api.trackProps}></circle>
  <circle {...api.arcProps}></circle>
  {#if api.showValue}<text {...api.valueProps}>{api.shareText}</text>{/if}
</svg>
