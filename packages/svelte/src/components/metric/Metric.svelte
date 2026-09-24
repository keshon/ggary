<script lang="ts">
  import { connect, type MetricProps } from '@ggary/core/metric'
  import { svelteNormalizer } from '@ggary/core'
  import { applyConfig } from '@ggary/core/config-provider'
  import { getConfig } from '../config-provider/context'

  let own: MetricProps = $props()
  const kit = getConfig()
  const metric = $derived(applyConfig(own, kit(), { locale: true }))
  const api = $derived(connect(metric, svelteNormalizer))
</script>

<div {...api.rootProps}>
  <div {...api.labelProps}>{metric.label}</div>
  <div {...api.valueProps}>{api.valueText}{#if api.showUnit}<span {...api.unitProps}>{metric.unit}</span>{/if}</div>
  {#if api.showDelta}
    <div {...api.deltaProps}>{#if api.showDeltaIcon}<span {...api.deltaIconProps}></span>{/if}{metric.delta}</div>
  {/if}
</div>
