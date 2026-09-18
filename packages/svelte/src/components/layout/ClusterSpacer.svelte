<script lang="ts">
  import { connectCluster } from '@ggary/core/flow'
  import { svelteNormalizer } from '@ggary/core'

  /** Everything after it in a Cluster stands at the far end. */
  const api = connectCluster({}, svelteNormalizer)
</script>

<span {...api.spacerProps}></span>
