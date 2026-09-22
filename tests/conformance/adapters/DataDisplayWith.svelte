<script lang="ts">
  import { KeyValueList, Metric, MetricRow } from '../../../packages/svelte/src/index'

  let { component, ...props }: Record<string, any> = $props()
</script>

{#snippet strong(item: { value?: string })}<strong>{item.value}</strong>{/snippet}

{#if component === 'metric-row'}
  {@const { metrics, ...rest } = props}
  <MetricRow {...rest}>
    {#each metrics as metric, index (index)}
      <Metric {...metric} />
    {/each}
  </MetricRow>
{:else if component === 'kv'}
  {@const { rich, items, ...rest } = props}
  <KeyValueList {...rest} {items} value={rich ? strong : undefined} />
{/if}
