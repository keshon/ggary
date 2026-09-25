<script lang="ts">
  import { Thinking, Turn } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { chatThread } from '../../data/agent'
</script>

{#snippet reasoning()}<Thinking duration={4.1} locale="en-GB">{chatThread.reasoning}</Thinking>{/snippet}

<DemoPage>
  {#snippet states()}
    <Specimen label={"duration={4.1}"}><Thinking duration={4.1} locale="en-GB">{chatThread.reasoning}</Thinking></Specimen>
    <Specimen label="no duration"><Thinking>{chatThread.reasoning}</Thinking></Specimen>
    <Specimen label="streaming"><Thinking streaming>{chatThread.reasoning}</Thinking></Specimen>
    <Specimen label="disabled"><Thinking duration={4.1} locale="en-GB" disabled>{chatThread.reasoning}</Thinking></Specimen>
    <Specimen label="defaultOpen" wide><Thinking duration={4.1} locale="en-GB" defaultOpen>{chatThread.reasoning}</Thinking></Specimen>
    <Specimen label="streaming defaultOpen" wide><Thinking streaming defaultOpen>{chatThread.reasoning}</Thinking></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="in a Turn's before" wide>
      <Turn who="Agent" time="14:02" tokens={1284} duration={4.1} locale="en-GB" before={reasoning}>{chatThread.answer}</Turn>
    </Specimen>
  {/snippet}
</DemoPage>
