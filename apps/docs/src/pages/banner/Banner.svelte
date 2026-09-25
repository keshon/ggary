<script lang="ts">
  import { Banner, Button } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { toned } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no tone" wide><Banner title="Maintenance on Sunday">The board is read-only from 02:00 to 03:00 UTC.</Banner></Specimen>
    {#each toned as { tone, title, text } (tone)}
      <Specimen label={`tone="${tone}"`} wide><Banner {tone} {title}>{text}</Banner></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="dismissible" wide><Banner tone="warn" title="Disk almost full" dismissible>Old snapshots will be pruned tonight.</Banner></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="title only" wide><Banner tone="ok" title="Deploy finished" /></Specimen>
    <Specimen label="children only" wide><Banner>Maintenance on Sunday, 02:00 UTC.</Banner></Specimen>
    <Specimen label="actions" wide>
      <Banner tone="warn" title="Disk almost full">
        {#snippet actions()}<Button emphasis="low" size="sm">Review</Button>{/snippet}
        Old snapshots will be pruned tonight.
      </Banner>
    </Specimen>
  {/snippet}
</DemoPage>
