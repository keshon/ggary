<script lang="ts">
  import { Metric, MetricRow } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { headlineMetrics, runMetrics, singles } from './data'

  const ROWS = [
    { label: 'MetricRow', joined: false, headline: false, metrics: runMetrics },
    { label: 'MetricRow joined', joined: true, headline: false, metrics: runMetrics },
    { label: 'MetricRow joined headline', joined: true, headline: true, metrics: headlineMetrics },
  ]
</script>

<DemoPage>
  {#snippet variants()}
    {#each singles as { made, metric } (made)}
      <Specimen label={made}><Metric {...metric} locale="en-GB" /></Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    {#each ROWS as { label, joined, headline, metrics } (label)}
      <Specimen {label} wide>
        <MetricRow {joined} {headline}>
          {#each metrics as metric (metric.label)}<Metric {...metric} locale="en-GB" />{/each}
        </MetricRow>
      </Specimen>
    {/each}
  {/snippet}
</DemoPage>
