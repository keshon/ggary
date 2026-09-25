<script lang="ts">
  import { Approval, Button, Composer, Failure, Icon, Stack, Thinking, Turn } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { chatApproval, chatFailure, chatThread } from '../../data/agent'
</script>

{#snippet answerActions()}
  <Button size="sm" emphasis="minimal" aria-label="Copy"><Icon name="copy" /></Button>
  <Button size="sm" emphasis="minimal" aria-label="Retry"><Icon name="refresh" /></Button>
  <Button size="sm" emphasis="minimal" aria-label="More"><Icon name="more" /></Button>
{/snippet}
{#snippet firstReasoning()}<Thinking duration={4.1} locale="en-GB">{chatThread.reasoning}</Thinking>{/snippet}
{#snippet lastReasoning()}<Thinking duration={2.4} locale="en-GB">{chatThread.reasoning}</Thinking>{/snippet}
{#snippet skipTheFile()}<Button size="sm">Skip the file</Button>{/snippet}
{#snippet pendingFailure()}<Failure {...chatFailure} actions={skipTheFile} />{/snippet}
{#snippet resolvedFailure()}<Failure {...chatFailure} state="resolved" resolvedAt="14:05" />{/snippet}
{#snippet theApproval()}<Approval {...chatApproval} live="assertive" />{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label={`from="user"`} wide><Turn who="You" from="user">{chatThread.ask}</Turn></Specimen>
    <Specimen label={`from="agent"`} wide><Turn who="Agent" from="agent">{chatThread.answer}</Turn></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="streaming" wide><Turn who="Agent" tokens={612} locale="en-GB" streaming>{chatThread.working}</Turn></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="time tokens duration" wide>
      <Turn who="Agent" time="14:02" tokens={1284} duration={4.1} locale="en-GB">{chatThread.answer}</Turn>
    </Specimen>
    <Specimen label="before: Thinking · actions" wide>
      <Turn who="Agent" time="14:02" tokens={1284} duration={4.1} locale="en-GB" before={firstReasoning} actions={answerActions}>{chatThread.answer}</Turn>
    </Specimen>
    <Specimen label="after: Failure" wide>
      <Turn who="Agent" time="14:04" duration={5.2} locale="en-GB" after={pendingFailure}>{chatThread.reading}</Turn>
    </Specimen>
    <Specimen label="a thread, with a Composer" wide>
      <Stack gap="loose">
        <Turn who="You" from="user" time="14:02">{chatThread.ask}</Turn>
        <Turn who="Agent" time="14:02" tokens={1284} duration={4.1} locale="en-GB" before={firstReasoning} actions={answerActions}>{chatThread.answer}</Turn>
        <Turn who="Agent" time="14:04" duration={5.2} locale="en-GB" after={resolvedFailure}>{chatThread.reading}</Turn>
        <Turn who="You" from="user" time="14:06">{chatThread.followUp}</Turn>
        <Turn who="Agent" time="14:06" tokens={612} locale="en-GB" before={lastReasoning} after={theApproval}>{chatThread.working}</Turn>
        <Composer label="Describe a task or ask a question" placeholder="Describe a task or ask a question" busy />
      </Stack>
    </Specimen>
  {/snippet}
</DemoPage>
