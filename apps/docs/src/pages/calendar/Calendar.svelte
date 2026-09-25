<script lang="ts">
  import { Calendar } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { isWeekend } from '../../data/inputs-pickers'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`mode="single"`} wide><Calendar locale="en-GB" mode="single" defaultValue="2026-10-14" /></Specimen>
    <Specimen label={`mode="range"`} wide><Calendar locale="en-GB" mode="range" defaultValue={{ start: '2026-10-12', end: '2026-10-16' }} /></Specimen>
    <Specimen label={`mode="range" months={2}`} wide>
      <Calendar locale="en-GB" mode="range" months={2} defaultValue={{ start: '2026-10-26', end: '2026-11-06' }} />
    </Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="defaultMonth" wide><Calendar locale="en-GB" defaultMonth="2026-10-01" /></Specimen>
    <Specimen label="min · max" wide><Calendar locale="en-GB" min="2026-10-05" max="2026-10-23" defaultValue="2026-10-09" /></Specimen>
    <Specimen label="isDateDisabled" wide><Calendar locale="en-GB" isDateDisabled={isWeekend} defaultValue="2026-10-14" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={"weekStart={0}"} wide><Calendar locale="en-GB" weekStart={0} defaultValue="2026-10-14" /></Specimen>
    <Specimen label={`locale="de-DE"`} wide><Calendar locale="de-DE" defaultValue="2026-10-14" /></Specimen>
  {/snippet}
</DemoPage>
