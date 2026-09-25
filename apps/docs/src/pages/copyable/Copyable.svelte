<script lang="ts">
  import { Cluster, Copyable, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { hash, leadId, path } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="value"><Copyable value={leadId} /></Specimen>
    <Specimen label="value · copyValue"><Copyable value={hash.value} copyValue={hash.copyValue} /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="long value"><Copyable value={path} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="beside a label">
      <Cluster gap="tight">
        <Text emphasis="low">Build</Text>
        <Copyable value={hash.value} copyValue={hash.copyValue} />
      </Cluster>
    </Specimen>
  {/snippet}
</DemoPage>
