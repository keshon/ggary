<script lang="ts">
  import { Budget } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'

  const SIZES = ['sm', 'md', 'lg'] as const
  const tokens = { label: 'Tokens', value: 186_000, max: 250_000, rate: 90, locale: 'en-GB' }
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no tone" wide><Budget label="Agent minutes" value={31} max={60} rate={0.117} locale="en-GB" /></Specimen>
    <Specimen label={`tone="warn"`} wide><Budget {...tokens} tone="warn" /></Specimen>
    <Specimen label={`tone="error"`} wide><Budget label="Cost, $" value={48.6} max={50} rate={0.02} tone="error" locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`} wide><Budget {...tokens} {size} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label={"rate={0}"} wide><Budget label="Agent minutes" value={31} max={60} rate={0} locale="en-GB" /></Specimen>
    <Specimen label="value > max" wide><Budget label="Tokens" value={262_400} max={250_000} rate={90} tone="error" locale="en-GB" /></Specimen>
    <Specimen label="no rate" wide><Budget label="Wall time, min" value={38} max={60} locale="en-GB" /></Specimen>
  {/snippet}
</DemoPage>
