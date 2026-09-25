<script lang="ts">
  import { Badge, History, KeyValueList, Panel, Run, Stack } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { runHistory } from '../../data/agent'
  import { allDone, everyTone, notBegun, runCounters, runPhases } from './data'
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label={`tone="ok" · "warn" · "error" · "neutral" · "running" · none`}><Run units={everyTone} locale="en-GB" /></Specimen>
    <Specimen label="no tone"><Run units={notBegun} locale="en-GB" /></Specimen>
    <Specimen label={`tone="ok"`}><Run units={allDone} locale="en-GB" /></Specimen>
    <Specimen label={"showValue={false}"}><Run units={everyTone} showValue={false} locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="phases, in a Panel" wide>
      <Panel title="audit-worldbox-1">
        {#snippet actions()}
          <History ticks={runHistory} size="sm" label="Nightly audits" locale="en-GB" />
          <Badge tone="running">running</Badge>
        {/snippet}
        <Stack>
          <KeyValueList items={runCounters} tight />
          <KeyValueList items={runPhases} tight>
            {#snippet value(phase)}<Run units={phase.units} label={`${phase.label}: agents finished`} locale="en-GB" />{/snippet}
          </KeyValueList>
        </Stack>
      </Panel>
    </Specimen>
  {/snippet}
</DemoPage>
