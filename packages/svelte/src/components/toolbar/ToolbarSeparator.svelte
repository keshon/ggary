<script lang="ts">
  import { connect } from '@ggary/core/toolbar'
  import { svelteNormalizer } from '@ggary/core'

  const api = connect({}, svelteNormalizer)
</script>

<span {...api.separatorProps}></span>
