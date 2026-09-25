<script lang="ts">
  import { Approval, Button, Turn } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { chatApproval, chatThread } from '../../data/agent'
</script>

{#snippet alwaysAllow()}<Button size="sm" emphasis="minimal">Always allow</Button>{/snippet}
{#snippet theApproval()}<Approval {...chatApproval} live="assertive" actions={alwaysAllow} />{/snippet}

<DemoPage>
  {#snippet states()}
    <Specimen label={`state="pending"`} wide><Approval {...chatApproval} state="pending" /></Specimen>
    <Specimen label={`state="approved" decidedBy decidedAt`} wide><Approval {...chatApproval} state="approved" decidedBy="You" decidedAt="14:07" /></Specimen>
    <Specimen label={`state="denied" decidedBy decidedAt`} wide><Approval {...chatApproval} state="denied" decidedBy="You" decidedAt="14:07" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="title · no effects" wide><Approval what="git push --force origin main" title="Rewrite the history of main?" /></Specimen>
    <Specimen label="actions" wide><Approval {...chatApproval} actions={alwaysAllow} /></Specimen>
    <Specimen label="in a Turn's after" wide>
      <Turn who="Agent" time="14:06" tokens={612} locale="en-GB" after={theApproval}>{chatThread.working}</Turn>
    </Specimen>
  {/snippet}
</DemoPage>
