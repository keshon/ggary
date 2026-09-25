<script lang="ts">
  import { CodeBlock, Diff, Panel, Stack, Step } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { filtersAfter, filtersBefore, filtersExcerpt, shardOutput } from '../../data/agent'
  import { failedOutput, readCall, testCall } from './data'

  const read = { name: 'read_file', argument: 'src/grid/filters.ts', detail: '240 lines', duration: 320, locale: 'en-GB' }
  const tests = { name: 'run_tests', argument: '--shard 4 --retry', locale: 'en-GB' }
</script>

{#snippet excerpt()}{filtersExcerpt}{/snippet}
{#snippet shard()}{shardOutput}{/snippet}
{#snippet failed()}{failedOutput}{/snippet}

<DemoPage>
  {#snippet states()}
    <Specimen label="no state" wide><Step name="run_tests" argument="--shard 5" locale="en-GB" /></Specimen>
    <Specimen label={`state="running" streaming defaultOpen`} wide>
      <Step {...tests} state="running" detail="29 of 41" duration={17000} streaming defaultOpen output={shard} />
    </Specimen>
    <Specimen label={`state="ok"`} wide><Step {...read} state="ok" output={excerpt} /></Specimen>
    <Specimen label={`state="failed" defaultOpen`} wide>
      <Step {...tests} state="failed" detail="3 failing" duration={57000} defaultOpen output={failed} />
    </Specimen>
    <Specimen label={"defaultOpen outputLines={240} onShowAll"} wide>
      <Step {...read} state="ok" defaultOpen outputLines={240} onShowAll={() => {}} output={excerpt} />
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="children: the call, output: what came back" wide>
      <Step {...read} state="ok" defaultOpen output={excerpt}><CodeBlock code={readCall} label="The call" /></Step>
    </Specimen>
    <Specimen label="children: Diff" wide>
      <Step name="edit_file" argument="src/grid/filters.ts" state="ok" detail="+3 −1" duration={1400} locale="en-GB" defaultOpen>
        <Diff path="src/grid/filters.ts" change="modified" before={filtersBefore} after={filtersAfter} context={2} locale="en-GB" />
      </Step>
    </Specimen>
    <Specimen label="steps, in a Panel" wide>
      <Panel title="agent-01 on shard 4">
        <Stack gap="tight">
          <Step {...read} state="ok" output={excerpt}><CodeBlock code={readCall} label="The call" /></Step>
          <Step name="edit_file" argument="src/grid/filters.ts" state="ok" detail="+3 −1" duration={1400} locale="en-GB">
            <Diff path="src/grid/filters.ts" change="modified" before={filtersBefore} after={filtersAfter} context={2} locale="en-GB" />
          </Step>
          <Step {...tests} state="running" detail="29 of 41" duration={17000} streaming output={shard}><CodeBlock code={testCall} label="The call" /></Step>
        </Stack>
      </Panel>
    </Specimen>
  {/snippet}
</DemoPage>
