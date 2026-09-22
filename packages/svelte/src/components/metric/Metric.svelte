<script lang="ts">
  import { connect, type MetricProps } from '@ggary/core/metric'
  import { svelteNormalizer } from '@ggary/core'

  let props: MetricProps = $props()
  const api = $derived(connect(props, svelteNormalizer))
</script>

<div {...api.rootProps}>
  <div {...api.labelProps}>{props.label}</div>
  <div {...api.valueProps}>{api.valueText}{#if api.showUnit}<span {...api.unitProps}>{props.unit}</span>{/if}</div>
  {#if api.showDelta}
    <div {...api.deltaProps}>{#if api.showDeltaIcon}<span {...api.deltaIconProps}></span>{/if}{props.delta}</div>
  {/if}
</div>
