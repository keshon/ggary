<script lang="ts">
  import { Button, Card, Field, Input, Stack } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { gaps, tiles } from '../../data/layout'
</script>

<DemoPage>
  {#snippet variants()}
    {#each gaps as gap (gap)}
      <Specimen label={`gap="${gap}"`}>
        <Stack {gap}>
          {#each tiles.slice(0, 2) as tile (tile.title)}<Card title={tile.title}>{tile.value}</Card>{/each}
          <Button emphasis="low">All weeks</Button>
        </Stack>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="Field · Field · Button" wide>
      <Stack>
        <Field label="Name"><Input defaultValue="Daria M." /></Field>
        <Field label="Signature"><Input defaultValue="Daria M., sales" /></Field>
        <Button emphasis="high">Save</Button>
      </Stack>
    </Specimen>
  {/snippet}
</DemoPage>
