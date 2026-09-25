<script lang="ts">
  import { Cluster, Grid, Icon, Text, iconNames } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { SIZES } from '../../data/display'
  import { sampleGlyphs } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="name · iconNames" wide>
      <Grid columns="tight" gap="tight">
        {#each iconNames as name (name)}
          <Cluster gap="tight"><Icon {name} size="lg" /><Text emphasis="low">{name}</Text></Cluster>
        {/each}
      </Grid>
    </Specimen>
    <Specimen label={`label="Failed"`}><Icon name="status-error" size="lg" label="Failed" /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}>
        {#each sampleGlyphs as name (name)}<Icon {name} {size} />{/each}
      </Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label={`no size, inside Text tone="error"`}><Text tone="error"><Icon name="status-warn" /> Build failed</Text></Specimen>
    <Specimen label="defineIcons: rocket · planet"><Icon name="rocket" size="lg" /><Icon name="planet" size="lg" /></Specimen>
  {/snippet}
</DemoPage>
