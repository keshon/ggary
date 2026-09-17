<script lang="ts">
  import { connect, type AvatarImageStatus, type AvatarProps } from '@ggary/core/avatar'
  import { svelteNormalizer } from '@ggary/core'

  let { name, src, size, decorative }: AvatarProps = $props()

  let status = $state<AvatarImageStatus>('none')
  // A new source starts over: its own load decides.
  $effect.pre(() => {
    status = src ? 'loading' : 'none'
  })
  const api = $derived(connect({ name, src, size, decorative, status }, svelteNormalizer))
</script>

<span {...api.rootProps}>
  <span {...api.fallbackProps}>{api.initials}</span>
  {#if api.showImage}
    <img {...api.imageProps} onload={() => (status = 'loaded')} onerror={() => (status = 'error')} />
  {/if}
</span>
