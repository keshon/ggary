<script lang="ts">
  import { Heatmap } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { runQuarter, runYear } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={"weekStart={1}"} wide><Heatmap days={runYear} weekStart={1} unit="runs" label="Runs a day" locale="en-GB" /></Specimen>
    <Specimen label={"weekStart={0}"} wide><Heatmap days={runYear} weekStart={0} unit="runs" label="Runs a day" locale="en-GB" /></Specimen>
    <Specimen label="13 weeks"><Heatmap days={runQuarter} unit="runs" label="Runs a day" locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label={"days={[]}"}><Heatmap days={[]} unit="runs" label="Runs a day" locale="en-GB" /></Specimen>
  {/snippet}
</DemoPage>
