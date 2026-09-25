<script lang="ts">
  import { connect, type IconProps } from '@ggary/core/icon'
  import { mergeProps, svelteNormalizer } from '@ggary/core'

  type Props = IconProps & { [key: string]: unknown }

  /** A glyph where the app puts one: decorative, or named with `label`. */
  let { name, label, size, ...rest }: Props = $props()
  const api = $derived(connect({ name, label, size }, svelteNormalizer))
</script>

<span {...mergeProps(rest, api.rootProps)}></span>
