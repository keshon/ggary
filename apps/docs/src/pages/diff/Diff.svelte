<script lang="ts">
  import { Diff } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { filtersAfter, filtersBefore } from '../../data/agent'
  import { addedTest, patchRows, removedHelper, renamedAfter, renamedBefore } from './data'

  const path = 'src/grid/filters.ts'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`change="modified"`} wide><Diff {path} change="modified" before={filtersBefore} after={filtersAfter} locale="en-GB" /></Specimen>
    <Specimen label={`change="added"`} wide><Diff path="src/grid/filters.test.ts" change="added" before="" after={addedTest} locale="en-GB" /></Specimen>
    <Specimen label={`change="deleted"`} wide><Diff path="src/grid/blank.ts" change="deleted" before={removedHelper} after="" locale="en-GB" /></Specimen>
    <Specimen label={`change="renamed"`} wide><Diff path="src/grid/match-row.ts" change="renamed" before={renamedBefore} after={renamedAfter} locale="en-GB" /></Specimen>
    <Specimen label={`change="conflict"`} wide><Diff {path} change="conflict" rows={patchRows} locale="en-GB" /></Specimen>
    <Specimen label="no change" wide><Diff {path} before={filtersBefore} after={filtersAfter} locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label={"context={1}"} wide><Diff {path} change="modified" before={filtersBefore} after={filtersAfter} context={1} locale="en-GB" /></Specimen>
    <Specimen label={"context={Infinity}"} wide><Diff {path} change="modified" before={filtersBefore} after={filtersAfter} context={Infinity} locale="en-GB" /></Specimen>
    <Specimen label="rows" wide><Diff {path} change="modified" rows={patchRows} locale="en-GB" /></Specimen>
  {/snippet}
</DemoPage>
