<script lang="ts">
  import { Lanes } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { idleLanes, runLanes } from './data'
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label={`tone="ok" · "warn" · "error" · "neutral" · "running"`} wide>
      <Lanes label="The shards of run 4127" lanes={runLanes} locale="en-GB" />
    </Specimen>
    <Specimen label={"spans={[]}"} wide><Lanes label="The agents of run 4128" lanes={idleLanes} locale="en-GB" /></Specimen>
    <Specimen label={"start={40000} end={80000}"} wide>
      <Lanes label="The shards of run 4127, 40 s to 80 s" lanes={runLanes} start={40000} end={80000} locale="en-GB" />
    </Specimen>
  {/snippet}
</DemoPage>
