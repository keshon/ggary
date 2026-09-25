<script lang="ts">
  import { Card, Skeleton } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no props" wide><Skeleton /></Specimen>
    <Specimen label={"lines={3}"} wide><Skeleton lines={3} /></Specimen>
    <Specimen label="title" wide><Skeleton title /></Specimen>
    <Specimen label={"title lines={3}"} wide><Skeleton title lines={3} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="inside a Card, aria-busy" wide>
      <Card title="Run 1842" aria-busy="true"><Skeleton lines={3} /></Card>
    </Specimen>
  {/snippet}
</DemoPage>
