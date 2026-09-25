<script lang="ts">
  import { Button, Card, Field, Grid, Input, Section, Stack } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { tiles } from '../../data/layout'

  const RANKS = ['lead', 'default', 'support'] as const
</script>

{#snippet week()}
  <Grid columns="tight">
    {#each tiles.slice(0, 4) as tile (tile.title)}<Card title={tile.title} headingLevel={4}>{tile.value}</Card>{/each}
  </Grid>
{/snippet}

{#snippet details()}
  <Stack>
    <Field label="Signature"><Input defaultValue="Daria M., sales" /></Field>
    <Button emphasis="high">Save</Button>
  </Stack>
{/snippet}

{#snippet allWeeks()}<Button size="sm" emphasis="minimal">All weeks</Button>{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each RANKS as rank (rank)}
      <Specimen label={`rank="${rank}"`} wide>
        <Section title="This week" headingLevel={3} {rank}>{@render week()}</Section>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="title · description" wide>
      <Section title="Your details" headingLevel={3} description="Shown to the leads you write to.">{@render details()}</Section>
    </Specimen>
    <Specimen label="title · actions" wide>
      <Section title="This week" headingLevel={3} actions={allWeeks}>{@render week()}</Section>
    </Specimen>
    <Specimen label="Section after Section" wide>
      <Section title="This week" headingLevel={3}>{@render week()}</Section>
      <Section title="Your details" headingLevel={3} rank="support" description="Shown to the leads you write to.">{@render details()}</Section>
    </Specimen>
  {/snippet}
</DemoPage>
