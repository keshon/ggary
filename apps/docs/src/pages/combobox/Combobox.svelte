<script lang="ts">
  import { Combobox } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { companies, searchCompanies } from '../../data/inputs-pickers'
  import { tags } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="items"><Combobox label="Company" items={companies} defaultValue="acme" /></Specimen>
    <Specimen label="load, selectedItems">
      <Combobox label="Company" load={searchCompanies} defaultValue="cobalt" selectedItems={[companies[2]]} placeholder="Type to search" />
    </Specimen>
    <Specimen label="multiple" wide><Combobox label="Tags" items={tags} multiple defaultValue={['enterprise', 'renewal', 'partner']} placeholder="Add a tag" /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Combobox {size} label="Company" items={companies} defaultValue="borealis" /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="placeholder"><Combobox label="Company" items={companies} placeholder="Anyone" /></Specimen>
    <Specimen label="disabled"><Combobox label="Company" items={companies} defaultValue="delta" disabled /></Specimen>
    <Specimen label="multiple disabled" wide><Combobox label="Tags" items={tags} multiple defaultValue={['trial', 'startup']} disabled /></Specimen>
  {/snippet}
</DemoPage>
