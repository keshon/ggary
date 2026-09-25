<script lang="ts">
  import { DatePicker } from '@ggary/svelte'
  import { rangePresets } from '@ggary/core/date-picker'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'

  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`mode="single"`}><DatePicker label="Follow up on" locale="en-GB" mode="single" defaultValue="2026-10-14" /></Specimen>
    <Specimen label={`mode="range"`} wide>
      <DatePicker label="Registered between" locale="en-GB" mode="range" defaultValue={{ start: '2026-10-12', end: '2026-10-16' }} />
    </Specimen>
    <Specimen label={`mode="range" months={2}`} wide>
      <DatePicker label="Stay" locale="en-GB" mode="range" months={2} defaultValue={{ start: '2026-10-26', end: '2026-11-06' }} />
    </Specimen>
    <Specimen label="time" wide><DatePicker label="Meeting starts" locale="en-GB" time defaultValue="2026-10-14T15:30" /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><DatePicker {size} label="Close by" locale="en-GB" defaultValue="2026-11-30" /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="empty"><DatePicker label="Follow up on" locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={`mode="range" presets={rangePresets()}`} wide>
      <DatePicker label="Registered between" locale="en-GB" mode="range" presets={rangePresets()} />
    </Specimen>
  {/snippet}
</DemoPage>
