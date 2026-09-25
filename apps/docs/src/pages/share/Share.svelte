<script lang="ts">
  import { Legend, Share, Stack } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { dayOutcomes, languages, nothing } from './data'

  const SIZES = ['md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="items[].tone" wide><Share items={dayOutcomes} unit="h" label="The last 24 hours" locale="en-GB" /></Specimen>
    <Specimen label="items[].series" wide><Share items={languages} unit="lines" label="Lines by language" locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`} wide><Share items={dayOutcomes} unit="h" label="The last 24 hours" {size} locale="en-GB" /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="every value 0" wide><Share items={nothing} unit="h" label="The last 24 hours" locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="keyed by a Legend" wide>
      <Stack gap="tight">
        <Share items={languages} unit="lines" label="Lines by language" locale="en-GB" />
        <Legend items={languages.map(({ label, series, value }) => ({ label, series, value: `${Math.round(value / 1000)}k` }))} label="Lines by language" />
      </Stack>
    </Specimen>
  {/snippet}
</DemoPage>
