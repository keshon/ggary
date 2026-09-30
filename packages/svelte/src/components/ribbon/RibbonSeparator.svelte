<script lang="ts">
  import { connectSeparator } from '@ggary/core/ribbon'
  import { svelteNormalizer } from '@ggary/core'

  const { separatorProps } = connectSeparator(svelteNormalizer)
</script>

<span {...separatorProps}></span>
