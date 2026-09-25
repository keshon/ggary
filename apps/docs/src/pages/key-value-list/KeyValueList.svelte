<script lang="ts">
  import { Badge, Copyable, KeyValueList, Link } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { richFacts, runFacts } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no props" wide><KeyValueList items={runFacts} /></Specimen>
    <Specimen label="tight" wide><KeyValueList items={runFacts} tight /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="value: Badge · Link · Copyable" wide>
      <KeyValueList items={richFacts}>
        {#snippet value(fact)}
          {#if fact.label === 'Status'}<Badge tone="running">{fact.value}</Badge>{:else if fact.label === 'Runner'}<Link href="#/key-value-list">{fact.value}</Link>{:else}<Copyable value={fact.value} />{/if}
        {/snippet}
      </KeyValueList>
    </Specimen>
  {/snippet}
</DemoPage>
