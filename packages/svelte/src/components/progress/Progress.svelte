<script lang="ts">
  import { applyConfig } from '@ggary/core/config-provider'
  import { getConfig } from '../config-provider/context'
  import { connect, type ProgressProps } from '@ggary/core/progress'
  import { svelteNormalizer, uid } from '@ggary/core'

  type Props = ProgressProps & {
    /** Show the value text. Default: over a bar with a label, and inside a large ring. */
    showValue?: boolean
  }

  /** How far along: a bar, or a ring. No value: busy, the amount unknown. */
  let own: Props = $props()
  const kit = getConfig()
  // The locale in force: the percentage is written in its form.
  const progress = $derived(applyConfig(own, kit(), { locale: true }))

  const id = uid('gg-progress')
  const api = $derived(connect({ ...progress, id }, svelteNormalizer))
  const shape = $derived(progress.shape ?? 'bar')
  const label = $derived(progress.hideLabel ? undefined : progress.label)
  const showValue = $derived(!api.indeterminate && (progress.showValue ?? (shape === 'bar' ? label !== undefined : progress.size === 'lg')))
</script>

{#if shape === 'ring'}
  <div {...api.rootProps}>
    <div {...api.trackProps}>
      <div {...api.rangeProps}></div>
      {#if showValue}<span {...api.valueTextProps}>{api.valueText}</span>{/if}
    </div>
    {#if label}<span {...api.labelProps}>{label}</span>{/if}
  </div>
{:else}
  <div {...api.rootProps}>
    {#if label || showValue}
      <div {...api.headerProps}>
        {#if label}<span {...api.labelProps}>{label}</span>{/if}
        {#if showValue}<span {...api.valueTextProps}>{api.valueText}</span>{/if}
      </div>
    {/if}
    <div {...api.trackProps}>
      <div {...api.rangeProps}></div>
    </div>
  </div>
{/if}
