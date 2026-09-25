<script lang="ts">
  import { Button, Failure, Turn } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { chatFailure, chatThread } from '../../data/agent'
</script>

{#snippet skipTheFile()}<Button size="sm">Skip the file</Button>{/snippet}
{#snippet theFailure()}<Failure {...chatFailure} actions={skipTheFile} />{/snippet}

<DemoPage>
  {#snippet states()}
    <Specimen label={`state="pending"`} wide><Failure {...chatFailure} state="pending" /></Specimen>
    <Specimen label={`state="resolved" resolvedAt`} wide><Failure {...chatFailure} state="resolved" resolvedAt="14:05" /></Specimen>
    <Specimen label={`state="given-up" resolvedAt`} wide><Failure {...chatFailure} state="given-up" resolvedAt="14:05" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="no tried" wide>
      <Failure title="Could not reach registry.npmjs.org" code="ECONNRESET" reason="The connection was closed by the other side" />
    </Specimen>
    <Specimen label="actions" wide><Failure {...chatFailure} actions={skipTheFile} /></Specimen>
    <Specimen label="in a Turn's after" wide>
      <Turn who="Agent" time="14:04" duration={5.2} locale="en-GB" after={theFailure}>{chatThread.reading}</Turn>
    </Specimen>
  {/snippet}
</DemoPage>
