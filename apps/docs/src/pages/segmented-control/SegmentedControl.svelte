<script lang="ts">
  import { SegmentedControl } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { densities, viewModes, viewModesWithLocked } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no fullWidth"><SegmentedControl label="View mode" items={viewModes} defaultValue="list" /></Specimen>
    <Specimen label="fullWidth" wide>
      <SegmentedControl label="Row density" fullWidth items={densities} defaultValue="regular" />
    </Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}>
        <SegmentedControl label={`Row density, ${size}`} {size} items={densities} defaultValue="compact" />
      </Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="no value"><SegmentedControl label="View mode" items={viewModes} /></Specimen>
    <Specimen label="items[].disabled"><SegmentedControl label="View mode" items={viewModesWithLocked} defaultValue="grid" /></Specimen>
    <Specimen label="disabled"><SegmentedControl label="View mode" disabled items={viewModes} defaultValue="list" /></Specimen>
    <Specimen label="required"><SegmentedControl label="View mode" required items={viewModes} /></Specimen>
  {/snippet}
</DemoPage>
