<script lang="ts">
  import { Badge, Button, Card, Flex, FlexItem, Search } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { tags, uneven } from '../../data/layout'

  const DIRECTIONS = ['row', 'column'] as const
  const JUSTIFIES = ['center', 'end', 'between'] as const
  const ALIGNS = ['start', 'center', 'end', 'baseline'] as const
  const GAPS = ['none', 'tight', 'loose'] as const
</script>

{#snippet cards()}
  {#each uneven as card (card.title)}<Card title={card.title} subtitle={card.subtitle}>{card.value}</Card>{/each}
{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each DIRECTIONS as direction (direction)}
      <Specimen label={`direction="${direction}"`} wide><Flex {direction}>{@render cards()}</Flex></Specimen>
    {/each}
    <Specimen label="wrap" wide>
      <Flex wrap gap="tight">{#each tags as tag (tag)}<Badge>{tag}</Badge>{/each}</Flex>
    </Specimen>
    {#each JUSTIFIES as justify (justify)}
      <Specimen label={`justify="${justify}"`} wide><Flex {justify}>{@render cards()}</Flex></Specimen>
    {/each}
    {#each ALIGNS as align (align)}
      <Specimen label={`align="${align}"`} wide><Flex {align}>{@render cards()}</Flex></Specimen>
    {/each}
    {#each GAPS as gap (gap)}
      <Specimen label={`gap="${gap}"`} wide><Flex {gap}>{@render cards()}</Flex></Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="FlexItem grow" wide>
      <Flex gap="tight" align="center">
        <FlexItem grow><Search aria-label="Search leads" placeholder="Search leads" /></FlexItem>
        <Button>Filter</Button>
        <Button emphasis="high">New lead</Button>
      </Flex>
    </Specimen>
    <Specimen label={"FlexItem grow={2} · grow={1}"} wide>
      <Flex>
        <FlexItem grow={2}><Card title="Pipeline">RUB 12.8M in 214 deals</Card></FlexItem>
        <FlexItem grow={1}><Card title="Won">96</Card></FlexItem>
      </Flex>
    </Specimen>
    <Specimen label={`FlexItem align="end"`} wide>
      <Flex>
        <Card title="New leads" subtitle="This week">1,284</Card>
        <Card title="Won">96</Card>
        <FlexItem align="end"><Button emphasis="low">All weeks</Button></FlexItem>
      </Flex>
    </Specimen>
  {/snippet}
</DemoPage>
