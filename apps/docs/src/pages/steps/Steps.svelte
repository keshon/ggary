<script lang="ts">
  import { Steps } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { imported, importing, notStarted, noted } from './data'
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label={`state="done" · "current" · "todo"`} wide><Steps label="Import" items={importing} /></Specimen>
    <Specimen label={`state="current" · "todo"`} wide><Steps label="Import" items={notStarted} /></Specimen>
    <Specimen label={`state="done"`} wide><Steps label="Import" items={imported} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="note" wide><Steps label="Import" items={noted} /></Specimen>
  {/snippet}
</DemoPage>
