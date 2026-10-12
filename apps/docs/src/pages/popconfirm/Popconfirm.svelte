<script lang="ts">
  import { Button, Popconfirm } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { never, refused } from './data'

  const lead = {
    title: 'Delete this lead?',
    description: 'Its history goes with it. This cannot be undone.',
    destructive: true,
    confirmLabel: 'Delete',
  }

</script>

{#snippet deleteLead(props: Record<string, unknown>)}<Button {...props} destructive>Delete lead</Button>{/snippet}
{#snippet publish(props: Record<string, unknown>)}<Button {...props}>Publish</Button>{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label="title, confirmLabel" wide>
      <div><Popconfirm title="Publish the page now?" confirmLabel="Publish" trigger={publish} /></div>
    </Specimen>
    <Specimen label="destructive, description" wide>
      <div><Popconfirm {...lead} trigger={deleteLead} /></div>
    </Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="onConfirm: pending" wide>
      <div><Popconfirm {...lead} trigger={deleteLead} onConfirm={never} /></div>
    </Specimen>
    <Specimen label="onConfirm: failed" wide>
      <div><Popconfirm {...lead} trigger={deleteLead} onConfirm={refused} /></div>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="trigger">
      <Popconfirm title="Publish the page now?" confirmLabel="Publish" trigger={publish} />
    </Specimen>
  {/snippet}
</DemoPage>
