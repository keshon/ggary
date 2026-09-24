<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { attachLogTail, connect, type LogProps, type LogWords } from '@ggary/core/log'
  import { svelteNormalizer } from '@ggary/core'

  type Props = LogProps & {
    /** The levels in words, where the machine's word is not the reader's. */
    words?: LogWords
    /**
     * Hold the bottom as lines arrive, and let go the moment the reader
     * scrolls up. Default true — a log nobody scrolls should show its newest line.
     */
    tail?: boolean
    [key: string]: unknown
  }

  let { lines, label, locale: ownLocale, timeZone, announce, words: ownWords, tail = true, ...rest }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'log', ownWords))
  const api = $derived(connect({ lines, label, locale, timeZone, announce }, svelteNormalizer, { words }))

  let root = $state<HTMLDivElement | null>(null)
  $effect(() => {
    if (!tail || !root) return
    const following = attachLogTail(root)
    return () => following.dispose()
  })
</script>

<div bind:this={root} {...rest} {...api.rootProps}>
  {#each api.lines as line (line.key)}
    <div {...line.lineProps}>
      <span {...api.timeProps}>{line.time}</span>
      <span {...api.levelProps}>{line.level}</span>
      <span {...api.messageProps}>{line.text}</span>
    </div>
  {/each}
</div>
