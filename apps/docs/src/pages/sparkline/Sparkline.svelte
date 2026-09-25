<script lang="ts">
  import { Legend, Metric, Sparkline } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { runTimeTrend, shardTrend, suiteLegend, suiteSeries, warningTrend } from './data'

  const SERIES = [1, 2, 3, 4, 5, 6] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="values"><Sparkline values={runTimeTrend} locale="en-GB" /></Specimen>
    <Specimen label="area"><Sparkline values={runTimeTrend} area locale="en-GB" /></Specimen>
    <Specimen label={"last={false}"}><Sparkline values={runTimeTrend} last={false} locale="en-GB" /></Specimen>
    {#each SERIES as series (series)}
      <Specimen label={`series={${series}}`}><Sparkline values={warningTrend} {series} locale="en-GB" /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="up · down · level">
      <Sparkline values={warningTrend} label="Warnings: 12, up from 4" />
      <Sparkline values={runTimeTrend} label="Run time: 42 s, down from 58 s" />
      <Sparkline values={shardTrend} label="Shards: 6, level" />
    </Specimen>
    <Specimen label={"values={[42]}"}><Sparkline values={[42]} locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={"describe={false}, beside a Metric"}>
      <Metric label="Run time" value={42} unit="s" delta="18% faster than the last" direction="down" tone="ok" locale="en-GB" />
      <Sparkline values={runTimeTrend} area describe={false} />
    </Specimen>
    <Specimen label="two series, keyed by a Legend">
      {#each suiteSeries as suite (suite.label)}
        <Sparkline values={suite.values} series={suite.series} label={`${suite.label}: ${suite.value} on the last night`} />
      {/each}
      <Legend items={suiteLegend} label="Time by suite" />
    </Specimen>
  {/snippet}
</DemoPage>
