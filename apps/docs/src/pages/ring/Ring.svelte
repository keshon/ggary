<script lang="ts">
  import { Cluster, Ring, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { SIZES, TONES } from '../../data/display'

  const nightly = { label: 'Nightly window used', value: 74, locale: 'en-GB' }
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no tone"><Ring {...nightly} /></Specimen>
    {#each TONES as tone (tone)}
      <Specimen label={`tone="${tone}"`}><Ring {...nightly} {tone} /></Specimen>
    {/each}
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Ring {...nightly} {size} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label={`size="lg" · value over max`}><Ring label="Shards finished" value={72} max={60} size="lg" locale="en-GB" /></Specimen>
    <Specimen label={`size="lg" showValue={false}`}><Ring {...nightly} size="lg" showValue={false} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="decorative, beside its words">
      <Cluster gap="tight"><Ring value={18} max={60} decorative locale="en-GB" /><Text>18 of 60 shards finished</Text></Cluster>
    </Specimen>
  {/snippet}
</DemoPage>
