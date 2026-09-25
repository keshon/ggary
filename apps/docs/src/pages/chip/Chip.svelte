<script lang="ts">
  import { Chip } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'

  const EMPHASES = ['low', 'medium', 'high'] as const
  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    {#each EMPHASES as emphasis (emphasis)}
      <Specimen label={`emphasis="${emphasis}"`}><Chip {emphasis}>Design</Chip></Specimen>
    {/each}
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Chip {size}>Design</Chip></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="interactive"><Chip interactive>Design</Chip></Specimen>
    <Specimen label="interactive selected"><Chip interactive selected>Design</Chip></Specimen>
    <Specimen label="interactive disabled"><Chip interactive disabled>Legacy</Chip></Specimen>
    <Specimen label="onRemove"><Chip onRemove={() => {}}>Design</Chip></Specimen>
    <Specimen label="onRemove disabled"><Chip onRemove={() => {}} disabled>Legacy</Chip></Specimen>
  {/snippet}
</DemoPage>
