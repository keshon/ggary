<script lang="ts">
  import { Card, Container } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { description } from '../../data/layout'

  const SIZES = ['default', 'narrow', 'prose', 'full'] as const
</script>

<DemoPage>
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`} wide>
        <Container {size}>
          <Card title="Leads" subtitle="12,400 in all">{description}</Card>
        </Container>
      </Specimen>
    {/each}
  {/snippet}
</DemoPage>
