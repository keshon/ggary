<script lang="ts">
  import { connectCaret } from '@ggary/core/states'
  import { svelteNormalizer } from '@ggary/core'

  // Placed right after the last character of the streaming text, inside the same line.
  let { ...rest }: { [key: string]: unknown } = $props()
  const api = connectCaret(svelteNormalizer)
</script>

<span {...rest} {...api.rootProps}></span>
