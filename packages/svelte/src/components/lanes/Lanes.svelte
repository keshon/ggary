<script lang="ts">
  import { connect, type LanesProps, type LanesWords } from '@ggary/core/lanes'
  import { svelteNormalizer } from '@ggary/core'

  type Props = LanesProps & {
    /** The chart's fixed text: how a stretch is read, and the outcomes in words. */
    words?: LanesWords
    [key: string]: unknown
  }

  let { lanes, label, start, end, locale, words, ...rest }: Props = $props()
  const api = $derived(connect({ lanes, label, start, end, locale }, svelteNormalizer, { words }))
</script>

<ul {...rest} {...api.rootProps}>
  {#each api.lanes as lane (lane.key)}
    <li {...lane.laneProps}>
      <span {...lane.labelProps}>{lane.lane.label}</span>
      <span {...lane.trackProps}>
        {#each lane.spans as span (span.key)}<span {...span.spanProps}></span>{/each}
      </span>
      <span {...api.laneTextProps}>{lane.text}</span>
    </li>
  {/each}
</ul>
