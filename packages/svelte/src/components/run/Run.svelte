<script lang="ts">
  import { connect, type RunProps, type RunWords } from '@ggary/core/run'
  import { svelteNormalizer } from '@ggary/core'

  type Props = RunProps & {
    /** The fixed text of the reading. */
    words?: Partial<RunWords>
    [key: string]: unknown
  }

  /** The countable units of one run: phases, attempts or shards, each carrying its own outcome. */
  let { units, label, showValue, locale, words, ...rest }: Props = $props()
  const api = $derived(connect({ units, label, showValue, locale }, svelteNormalizer, words))
</script>

<span {...rest} {...api.rootProps}>
  <span {...api.unitsProps}>
    {#each api.units as unit (unit.key)}<span {...unit.dotProps}></span>{/each}
  </span>
  {#if api.showValue}<span {...api.valueProps}>{api.valueText}</span>{/if}
</span>
