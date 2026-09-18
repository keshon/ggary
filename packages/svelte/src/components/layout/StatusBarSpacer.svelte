<script lang="ts">
  import { connect } from '@ggary/core/status-bar'
  import { svelteNormalizer } from '@ggary/core'

  /** Everything after it stands at the far end of the strip. */
  const api = connect({}, svelteNormalizer)
</script>

<span {...api.spacerProps}></span>
