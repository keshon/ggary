<script lang="ts">
  import { Breadcrumbs, Button, Icon, PageHeader } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { crumbs, description } from '../../data/layout'
</script>

{#snippet create()}<Button emphasis="high"><Icon name="plus" /> New lead</Button>{/snippet}

<DemoPage>
  {#snippet composition()}
    <Specimen label="title" wide>
      <PageHeader title="Leads" headingLevel={3} />
    </Specimen>
    <Specimen label="title · description" wide>
      <PageHeader title="Leads" {description} headingLevel={3} />
    </Specimen>
    <Specimen label="title · actions" wide>
      <PageHeader title="Leads" headingLevel={3} actions={create} />
    </Specimen>
    <Specimen label="context · title · description · actions" wide>
      <PageHeader title="Leads" {description} headingLevel={3}>
        {#snippet context()}<Breadcrumbs items={crumbs} />{/snippet}
        {#snippet actions()}
          <Button emphasis="low">Import</Button>
          {@render create()}
        {/snippet}
      </PageHeader>
    </Specimen>
  {/snippet}
</DemoPage>
