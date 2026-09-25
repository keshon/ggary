<script lang="ts">
  import { Field, Search } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'

  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Search {size} label={`Search the runs, ${size}`} placeholder="worldgen" /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="placeholder"><Search label="Search the runs" placeholder="worldgen" /></Specimen>
    <Specimen label="defaultValue"><Search label="Search the runs" defaultValue="worldgen" /></Specimen>
    <Specimen label="disabled"><Search disabled label="Search the runs" placeholder="worldgen" /></Specimen>
    <Specimen label="readOnly"><Search readOnly label="Search the runs" defaultValue="worldgen" /></Specimen>
    <Specimen label="invalid"><Search invalid label="Search the runs" defaultValue="run:" /></Specimen>
    <Specimen label="required, in a Field">
      <Field label="Find a lead" required><Search placeholder="Company or email" /></Field>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="in a Field">
      <Field label="Search the runs" hint="By name, id or the agent that started it"><Search name="q" placeholder="worldgen" /></Field>
    </Specimen>
  {/snippet}
</DemoPage>
