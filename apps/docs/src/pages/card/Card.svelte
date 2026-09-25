<script lang="ts">
  import { Button, Card, Cluster } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { runners } from '../../data/layout'

  const RANKS = ['lead', 'default', 'support'] as const
</script>

<DemoPage>
  {#snippet variants()}
    {#each RANKS as rank (rank)}
      <Specimen label={`rank="${rank}"`}><Card title="Deployments" subtitle="Last 24 hours" {rank}>42 successful, 1 rolled back.</Card></Specimen>
    {/each}
    <Specimen label="plain"><Card title="Deployments" subtitle="Last 24 hours" plain>42 successful, 1 rolled back.</Card></Specimen>
    {#each runners as runner (runner.tone)}
      <Specimen label={`tone="${runner.tone}"`}><Card title={runner.name} tone={runner.tone}>{runner.line}</Card></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="interactive"><Card title="Queue" interactive onclick={() => {}}>Nothing waiting.</Card></Specimen>
    <Specimen label="href"><Card title="Documentation" subtitle="docs.example.com" href="#/card">Setting up a runner.</Card></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="title"><Card title="Archive">Runs older than 90 days.</Card></Specimen>
    <Specimen label="no title"><Card>Runs older than 90 days.</Card></Specimen>
    <Specimen label="Cluster of Buttons inside">
      <Card title="runner-03" subtitle="Has not reported for 5 minutes" tone="warn">
        <Cluster gap="tight">
          <Button size="sm">Restart</Button>
          <Button size="sm" emphasis="minimal">Logs</Button>
        </Cluster>
      </Card>
    </Specimen>
  {/snippet}
</DemoPage>
