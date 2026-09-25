<script lang="ts">
  import { Button, Popconfirm } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { never, pressConfirm, refused } from './data'

  const lead = {
    title: 'Delete this lead?',
    description: 'Its history goes with it. This cannot be undone.',
    destructive: true,
    confirmLabel: 'Delete',
  }

  /** Its question answered "yes" as the page loads. */
  const answered = (host: HTMLElement) => pressConfirm(host)
</script>

{#snippet deleteLead(props: Record<string, unknown>)}<Button {...props} destructive>Delete lead</Button>{/snippet}
{#snippet publish(props: Record<string, unknown>)}<Button {...props}>Publish</Button>{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label="title, confirmLabel" wide>
      <div class="frame"><Popconfirm defaultOpen title="Publish the page now?" confirmLabel="Publish" trigger={publish} /></div>
    </Specimen>
    <Specimen label="destructive, description" wide>
      <div class="frame"><Popconfirm defaultOpen {...lead} trigger={deleteLead} /></div>
    </Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="onConfirm: pending" wide>
      <div class="frame" {@attach answered}><Popconfirm defaultOpen {...lead} trigger={deleteLead} onConfirm={never} /></div>
    </Specimen>
    <Specimen label="onConfirm: failed" wide>
      <div class="frame" {@attach answered}><Popconfirm defaultOpen {...lead} trigger={deleteLead} onConfirm={refused} /></div>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="trigger">
      <Popconfirm title="Publish the page now?" confirmLabel="Publish" trigger={publish} />
    </Specimen>
  {/snippet}
</DemoPage>
