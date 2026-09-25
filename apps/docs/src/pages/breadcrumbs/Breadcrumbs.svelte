<script lang="ts">
  import { Breadcrumbs } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { crumbs, deepCrumbs } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="items" wide><Breadcrumbs label="Location" items={crumbs} /></Specimen>
    <Specimen label="items, six deep" wide><Breadcrumbs label="Location" items={deepCrumbs} /></Specimen>
  {/snippet}
</DemoPage>
