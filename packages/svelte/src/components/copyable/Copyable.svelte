<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { COPY_IDLE, connect, createCopier, type CopyableProps, type CopyState } from '@ggary/core/copyable'
  import { svelteNormalizer } from '@ggary/core'

  type Props = CopyableProps & { [key: string]: unknown }

  let { value, copyValue, onCopy, words: ownWords, ...rest }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'copyable', ownWords))

  let copy = $state<CopyState>(COPY_IDLE)
  const copier = createCopier((next) => (copy = next))
  // No timer answers into a component that has gone.
  $effect(() => () => copier.destroy())

  const api = $derived(
    connect({ value, copyValue, words, copy }, svelteNormalizer, { onCopyPress: (): void => void copier.copy(api.copyText, { onCopy, words }) })
  )
</script>

<span {...api.rootProps} {...rest}><code {...api.valueProps}>{value}</code><button {...api.copyProps}><span {...api.copyIconProps}></span></button><span {...api.liveProps}>{api.said}</span></span>
