<script lang="ts">
  import { Meter } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { SIZES } from '../../data/display'
  import { toned } from './data'

  const tokens = { label: 'Tokens', value: 184_320, max: 250_000, locale: 'en-GB' }
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no tone" wide><Meter {...tokens} /></Specimen>
    {#each toned as { tone, label, value, max } (tone)}
      <Specimen label={`tone="${tone}"`} wide><Meter {label} {value} {max} {tone} locale="en-GB" /></Specimen>
    {/each}
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`} wide><Meter {...tokens} {size} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="value over max" wide><Meter {...tokens} value={262_144} /></Specimen>
    <Specimen label={"showValue={false}"} wide><Meter {...tokens} showValue={false} /></Specimen>
    <Specimen label="hideLabel" wide><Meter {...tokens} hideLabel /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={`valueText="237 of 240 GB"`} wide><Meter label="Disk on the runner" value={237} max={240} tone="warn" valueText="237 of 240 GB" /></Specimen>
  {/snippet}
</DemoPage>
