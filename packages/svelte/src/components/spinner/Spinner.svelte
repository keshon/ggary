<script lang="ts">
  import { connect, type SpinnerProps } from '@ggary/core/spinner'
  import { svelteNormalizer } from '@ggary/core'

  let { label, size }: SpinnerProps = $props()
  const api = $derived(connect({ label, size }, svelteNormalizer))
</script>

<span {...api.rootProps}><span {...api.trackProps}></span><span {...api.arcProps}></span></span>
