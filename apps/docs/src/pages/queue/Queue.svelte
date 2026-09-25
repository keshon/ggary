<script lang="ts">
  import { Badge, Panel, Queue } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { allTasks, lockedTasks, runTasks } from './data'

  const done = allTasks.filter((task) => task.state === 'done').length
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label={`state="done" · "warn" · "running" · "queued" · "failed" · "skipped"`} wide>
      <Queue tasks={runTasks} label="The queue of agents" />
    </Specimen>
    <Specimen label="defaultValue" wide>
      <Queue tasks={runTasks} label="The queue of agents" defaultValue="coverage-hole" />
    </Specimen>
    <Specimen label="disabled" wide>
      <Queue tasks={lockedTasks} label="The queue of agents" />
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={`in a Panel body="list"`} wide>
      <Panel title="The queue of agents" body="list">
        {#snippet actions()}<Badge>{`${done} of ${allTasks.length}`}</Badge>{/snippet}
        <Queue tasks={allTasks} label="The queue of agents" defaultValue="probes-assert" />
      </Panel>
    </Specimen>
  {/snippet}
</DemoPage>
