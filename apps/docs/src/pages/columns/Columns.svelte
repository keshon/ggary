<script lang="ts">
  import { Card, Column, Columns, Metric } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { tiles, uneven } from '../../data/layout'

  const GAPS = ['none', 'tight', 'loose'] as const
  const ALIGNS = ['start', 'center', 'end'] as const
</script>

{#snippet thirds()}
  {#each tiles.slice(0, 3) as tile (tile.title)}
    <Column span={4}><Card title={tile.title}>{tile.value}</Card></Column>
  {/each}
{/snippet}

{#snippet pipeline()}<Card title="Pipeline" subtitle="214 open deals">RUB 12.8M</Card>{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each GAPS as gap (gap)}
      <Specimen label={`gap="${gap}"`} wide><Columns {gap}>{@render thirds()}</Columns></Specimen>
    {/each}
    {#each ALIGNS as align (align)}
      <Specimen label={`align="${align}"`} wide>
        <Columns {align}>
          {#each uneven as card (card.title)}
            <Column span={4}><Card title={card.title} subtitle={card.subtitle}>{card.value}</Card></Column>
          {/each}
        </Columns>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label={"Column span={4}"} wide><Columns>{@render thirds()}</Columns></Specimen>
    <Specimen label={"Column span={{ base: 12, medium: 8 }} · span={{ base: 12, medium: 4 }}"} wide>
      <Columns>
        <Column span={{ base: 12, medium: 8 }}>{@render pipeline()}</Column>
        <Column span={{ base: 12, medium: 4 }}><Card title="Won">96</Card></Column>
      </Columns>
    </Specimen>
    <Specimen label={"Column start={4}"} wide>
      <Columns>
        <Column span={6} start={4}><Card title="Unassigned">104,802</Card></Column>
      </Columns>
    </Specimen>
    <Specimen label="Columns in a Column" wide>
      <Columns gap="loose">
        <Column span={{ base: 12, medium: 8 }}>{@render pipeline()}</Column>
        <Column span={{ base: 12, medium: 4 }}>
          <Columns gap="tight">
            <Column span={{ base: 12, narrow: 6 }}><Metric label="Won" value={42} /></Column>
            <Column span={{ base: 12, narrow: 6 }}><Metric label="Lost" value={7} /></Column>
          </Columns>
        </Column>
      </Columns>
    </Specimen>
  {/snippet}
</DemoPage>
