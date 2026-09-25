<script lang="ts">
  import { Cluster, Progress, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { SIZES } from '../../data/display'

  const ofTotal = (value: number) => `${value} of 120`
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`shape="bar"`} wide><Progress label="Importing leads" value={64} /></Specimen>
    <Specimen label={`shape="ring"`}><Progress shape="ring" label="Importing leads" value={64} /></Specimen>
    <Specimen label={`tone="ok"`} wide><Progress label="Import finished" value={100} tone="ok" /></Specimen>
    <Specimen label={`tone="warn"`} wide><Progress label="Import stalled" value={40} tone="warn" /></Specimen>
    <Specimen label={`tone="error"`} wide><Progress label="Sync with 1C" value={64} tone="error" /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`} wide><Progress label="Importing leads" value={64} {size} /></Specimen>
    {/each}
    {#each SIZES as size (size)}
      <Specimen label={`shape="ring" size="${size}"`}><Progress shape="ring" label="Storage" value={73} {size} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label={"value={null}"} wide><Progress label="Connecting to 1C" value={null} /></Specimen>
    <Specimen label={`shape="ring" value={null}`}><Progress shape="ring" label="Connecting" value={null} /></Specimen>
    <Specimen label="hideLabel" wide><Progress label="Importing leads" value={64} hideLabel /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={"max={120} valueText={(value) => …}"} wide><Progress label="Importing leads" value={48} max={120} valueText={ofTotal} /></Specimen>
    <Specimen label={`tone="error" valueText="Failed at 64%"`} wide><Progress label="Sync with 1C" value={64} tone="error" valueText="Failed at 64%" /></Specimen>
    <Specimen label={`shape="ring" hideLabel, beside its words`}>
      <Cluster gap="tight"><Progress shape="ring" label="Import" value={48} max={120} hideLabel /><Text emphasis="low">48 of 120 imported</Text></Cluster>
    </Specimen>
  {/snippet}
</DemoPage>
