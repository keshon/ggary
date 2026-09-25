<script lang="ts">
  import { Spinner } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { SIZES } from '../../data/display'
</script>

<DemoPage>
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Spinner label="Loading runs" {size} /></Specimen>
    {/each}
  {/snippet}
</DemoPage>
