<script lang="ts">
  import { Select } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { stages } from '../../data/inputs-pickers'

  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Select {size} label="Stage" items={stages} defaultValue="talks" /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="placeholder"><Select label="Stage" items={stages} placeholder="Choose a stage" /></Specimen>
    <Specimen label="defaultValue"><Select label="Stage" items={stages} defaultValue="offer" /></Specimen>
    <Specimen label="disabled"><Select label="Stage" items={stages} defaultValue="won" disabled /></Specimen>
  {/snippet}
</DemoPage>
