<script lang="ts">
  import { Cascader } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { regions, teams } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Cascader {size} label="City" items={regions} defaultValue={['rs', 'beg']} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="placeholder"><Cascader label="City" items={regions} placeholder="Choose a city" /></Specimen>
    <Specimen label="defaultValue"><Cascader label="City" items={regions} defaultValue={['ru', 'tat', 'kzn']} /></Specimen>
    <Specimen label="disabled"><Cascader label="City" items={regions} defaultValue={['kz', 'ala']} disabled /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="selectParents"><Cascader label="Team" items={teams} selectParents defaultValue={['sales', 'smb']} placeholder="Any team" /></Specimen>
    <Specimen label="stable default · fullWidth" wide>
      <div style="display:grid;gap:12px;inline-size:100%">
        <Cascader label="Default width" items={regions} defaultValue={['rs', 'beg']} />
        <Cascader fullWidth label="Full row" items={regions} defaultValue={['ru', 'tat', 'kzn']} />
      </div>
    </Specimen>
  {/snippet}
</DemoPage>
