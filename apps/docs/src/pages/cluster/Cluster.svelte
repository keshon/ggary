<script lang="ts">
  import { Badge, Button, Cluster, ClusterSpacer } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { gaps, tags } from '../../data/layout'

  const JUSTIFIES = ['start', 'end', 'between'] as const
</script>

{#snippet some(count: number)}
  {#each tags.slice(0, count) as tag (tag)}<Badge>{tag}</Badge>{/each}
{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each gaps as gap (gap)}
      <Specimen label={`gap="${gap}"`}><Cluster {gap}>{@render some(6)}</Cluster></Specimen>
    {/each}
    {#each JUSTIFIES as justify (justify)}
      <Specimen label={`justify="${justify}"`} wide><Cluster {justify}>{@render some(4)}</Cluster></Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="ClusterSpacer" wide>
      <Cluster>
        {@render some(3)}
        <ClusterSpacer />
        <Button size="sm" emphasis="low">Edit tags</Button>
      </Cluster>
    </Specimen>
  {/snippet}
</DemoPage>
