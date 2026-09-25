<script lang="ts">
  import { Cluster, StatusDot, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { toned } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no tone"><Cluster gap="tight"><StatusDot /><Text>Idle</Text></Cluster></Specimen>
    {#each toned as { tone, word } (tone)}
      <Specimen label={`tone="${tone}"`}><Cluster gap="tight"><StatusDot {tone} /><Text>{word}</Text></Cluster></Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label={`no tone, inside Text tone="running"`}><Text tone="running"><StatusDot /> Agents at work</Text></Specimen>
  {/snippet}
</DemoPage>
