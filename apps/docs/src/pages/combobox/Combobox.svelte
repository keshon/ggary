<script lang="ts">
  import { Button, Combobox, Dialog } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { companies, searchCompanies } from '../../data/inputs-pickers'
  import { tags } from './data'

  let dialogOpen = $state(false)
  let createdTags = $state([...tags])
  let submitted = $state('No submission yet')
  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<div class="combobox-pilot-page">
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
  {#snippet composition()}
    <Specimen label="Dialog + multiple selection" wide>
      <Dialog title="Manage tags" bind:open={dialogOpen}>
        {#snippet trigger(props)}<Button {...props}>Edit tags</Button>{/snippet}
        <div class="select-pilot-layout"><Combobox label="Dialog tags" items={tags} multiple defaultValue={['enterprise']} /></div>
        {#snippet footer()}<Button emphasis="high" onclick={() => dialogOpen = false}>Done</Button>{/snippet}
      </Dialog>
    </Specimen>
    <Specimen label="Form submission and reset" wide>
      <form class="select-pilot-layout" onsubmit={event => { event.preventDefault(); submitted = new FormData(event.currentTarget).getAll('tags').join(', ') || 'Empty selection' }}>
        <Combobox label="Form tags" name="tags" items={tags} multiple defaultValue={['enterprise']} />
        <div class="select-pilot-actions"><Button type="submit">Submit tags</Button><Button type="reset">Reset tags</Button><output>{submitted}</output></div>
      </form>
    </Specimen>
    <Specimen label="Create a tag" wide>
      <Combobox label="Create tags" items={createdTags} multiple placeholder="Type a new tag" onCreate={async text => {
        if (text.toLowerCase() === 'error') throw new Error('Demo creation failure; try another name')
        const item = { value: `created:${text}`, label: text }; createdTags = [...createdTags, item]; return item
      }} />
    </Specimen>
  {/snippet}
</DemoPage>
</div>
