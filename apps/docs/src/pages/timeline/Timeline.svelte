<script lang="ts">
  import { Avatar, Cluster, Text, Timeline } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { boardEvents, dayEvents, reviewEvents, runEvents, withSeconds } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="tone on items" wide><Timeline label="The nightly run" items={runEvents} locale="en-GB" /></Specimen>
    <Specimen label="no tone" wide><Timeline label="Board history" items={boardEvents} locale="en-GB" /></Specimen>
    <Specimen label="timeFormat" wide><Timeline label="The nightly run" items={runEvents} locale="en-GB" timeFormat={withSeconds} /></Specimen>
    <Specimen label="timeLabel" wide><Timeline label="Invoice 2026-0915" items={dayEvents} locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="rich body per item" wide>
      <Timeline label="Review" items={reviewEvents} locale="en-GB">
        {#snippet item(entry)}
          <Cluster gap="tight"><Avatar name={entry.id} size="sm" decorative /><Text strong>{entry.id}</Text><Text>{entry.title}</Text></Cluster>
        {/snippet}
      </Timeline>
    </Specimen>
  {/snippet}
</DemoPage>
