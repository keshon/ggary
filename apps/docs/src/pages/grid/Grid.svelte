<script lang="ts">
  import { Card, Grid } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { tiles } from '../../data/layout'

  const COLUMNS = ['tight', 'default', 'wide'] as const
  const GAPS = ['none', 'tight', 'loose'] as const
</script>

{#snippet cards(count: number)}
  {#each tiles.slice(0, count) as tile (tile.title)}<Card title={tile.title}>{tile.value}</Card>{/each}
{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each COLUMNS as columns (columns)}
      <Specimen label={`columns="${columns}"`} wide><Grid {columns}>{@render cards(6)}</Grid></Specimen>
    {/each}
    {#each GAPS as gap (gap)}
      <Specimen label={`gap="${gap}"`} wide><Grid columns="tight" {gap}>{@render cards(4)}</Grid></Specimen>
    {/each}
  {/snippet}
</DemoPage>
