<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type RunProps, type RunWords } from '@ggary/core/run'
  import { svelteNormalizer } from '@ggary/core'

  type Props = RunProps & {
    /** The fixed text of the reading. */
    words?: Partial<RunWords>
    [key: string]: unknown
  }

  /** The countable units of one run: phases, attempts or shards, each carrying its own outcome. */
  let { units, label, showValue, locale: ownLocale, words: ownWords, ...rest }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'run', ownWords))
  const api = $derived(connect({ units, label, showValue, locale }, svelteNormalizer, { words }))
</script>

<span {...rest} {...api.rootProps}>
  <span {...api.unitsProps}>
    {#each api.units as unit (unit.key)}<span {...unit.dotProps}></span>{/each}
  </span>
  {#if api.showValue}<span {...api.valueProps}>{api.valueText}</span>{/if}
</span>
