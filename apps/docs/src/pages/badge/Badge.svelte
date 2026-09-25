<script lang="ts">
  import { Avatar, Badge, Icon } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'

  const TONES = [
    ['neutral', 'Draft'],
    ['running', 'Running'],
    ['ok', 'Passed'],
    ['warn', 'Slow'],
    ['error', 'Failed'],
  ] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no tone"><Badge>Beta</Badge></Specimen>
    {#each TONES as [tone, word] (tone)}
      <Specimen label={`tone="${tone}"`}><Badge {tone}>{word}</Badge></Specimen>
    {/each}
    {#each TONES as [tone, word] (tone)}
      <Specimen label={`tone="${tone}" emphasis="low"`}><Badge {tone} emphasis="low">{word}</Badge></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label={"dot={false}"}><Badge tone="ok" dot={false}>Passed</Badge></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="count, on an icon"><Icon name="bell" size="lg" /><Badge count tone="error">3</Badge></Specimen>
    <Specimen label="count, beside an avatar"><Avatar name="Anna Petrova" /><Badge count>12</Badge></Specimen>
  {/snippet}
</DemoPage>
