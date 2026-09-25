<script lang="ts">
  import { Button, Toaster } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { KINDS, pageToaster } from './data'

  const queue = pageToaster()
</script>

<DemoPage>
  {#snippet variants()}
    {#each KINDS as kind (kind.label)}
      <Specimen label={kind.label}><Button emphasis="low" onclick={() => queue.toast(kind.toast)}>{kind.toast.title}</Button></Specimen>
    {/each}
  {/snippet}
</DemoPage>
<Toaster toaster={queue} />
