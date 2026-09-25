<script lang="ts">
  import { Card, ContextMenu } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { fileMenu, stageOpen } from './data'

  let opened = $state<HTMLDivElement | null>(null)
  $effect(() => {
    const host = opened
    if (host) requestAnimationFrame(() => stageOpen(host))
  })
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="open">
      <div bind:this={opened}>
        <ContextMenu items={fileMenu} label="Actions for report.pdf">
          {#snippet trigger(props)}<Card {...props} tabindex={0} interactive title="report.pdf" subtitle="PDF · 1.2 MB" />{/snippet}
        </ContextMenu>
      </div>
    </Specimen>
  {/snippet}
</DemoPage>
