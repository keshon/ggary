<script lang="ts">
  import { connect, type ProgressProps } from '@ggary/core/progress'
  import { svelteNormalizer, uid } from '@ggary/core'

  type Props = ProgressProps & {
    /** Show the value text. Default: over a bar with a label, and inside a large ring. */
    showValue?: boolean
  }

  /** How far along: a bar, or a ring. No value: busy, the amount unknown. */
  let props: Props = $props()

  const id = uid('gg-progress')
  const api = $derived(connect({ ...props, id }, svelteNormalizer))
  const shape = $derived(props.shape ?? 'bar')
  const label = $derived(props.hideLabel ? undefined : props.label)
  const showValue = $derived(!api.indeterminate && (props.showValue ?? (shape === 'bar' ? label !== undefined : props.size === 'lg')))
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
