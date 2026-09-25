<script lang="ts">
  import { Avatar, Gantt } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { hold, lateStart, midRange, rolloutGroups, rolloutPlan, stageChange, type RolloutTask } from './data'

  const SCALES = ['day', 'week', 'month'] as const
  const plan = { groups: rolloutGroups, locale: 'en-GB', words: { label: 'CRM rollout' } }

  /** Runs `stage` on the chart inside once, as the page loads. */
  const staged = (stage: (host: HTMLElement) => void) => (host: HTMLElement) => {
    requestAnimationFrame(() => stage(host))
  }
</script>

{#snippet owner(task: RolloutTask)}<Avatar name={task.owner} size="sm" decorative /> {task.title}{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each SCALES as scale (scale)}
      <Specimen label={`scale="${scale}"`} wide><Gantt tasks={rolloutPlan} {scale} {...plan} /></Specimen>
    {/each}
    <Specimen label="range" wide><Gantt tasks={rolloutPlan} range={midRange} {...plan} /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="onTaskChange · locked" wide><Gantt tasks={rolloutPlan} onTaskChange={hold} {...plan} /></Specimen>
    <Specimen label="saving" wide>
      <div {@attach staged(stageChange)}><Gantt tasks={rolloutPlan} onTaskChange={hold} {...plan} /></div>
    </Specimen>
    <Specimen label="conflict" wide><Gantt tasks={lateStart} {...plan} /></Specimen>
    <Specimen label={`defaultCollapsed={["phase-prep", "phase-pilot"]}`} wide>
      <Gantt tasks={rolloutPlan} defaultCollapsed={['phase-prep', 'phase-pilot']} {...plan} />
    </Specimen>
    <Specimen label={"tasks={[]}"} wide><Gantt tasks={[]} {...plan} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="Avatar + title" wide><Gantt tasks={rolloutPlan} {...plan} title={owner} /></Specimen>
  {/snippet}
</DemoPage>
