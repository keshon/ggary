<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type BudgetProps, type BudgetWords } from '@ggary/core/budget'
  import { svelteNormalizer } from '@ggary/core'
  import Meter from '../meter/Meter.svelte'

  type Props = BudgetProps & {
    /** The fixed text of the forecast. */
    words?: Partial<BudgetWords>
    [key: string]: unknown
  }

  /**
   * Spending against an explicit ceiling, with the forecast of its exhaustion.
   * The bar is the kit's Meter; what is added is the forecast — and a budget
   * with no `rate` has none, which is to say it is a Meter.
   */
  let { value, max, label, rate, tone, size, locale: ownLocale, words: ownWords, ...rest }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'budget', ownWords))
  const api = $derived(connect({ value, max, label, rate, tone, size, locale }, svelteNormalizer, { words }))
</script>

<div {...rest} {...api.rootProps}>
  <Meter {...api.meterProps} />
  <!-- Always in the DOM, empty or not: a live region that arrives with its own text is not announced. -->
  <span {...api.noteProps}>{api.note ?? ''}</span>
</div>
