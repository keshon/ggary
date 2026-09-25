<script lang="ts">
  import { Anchor } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { guide, thisPage } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="items, offset"><Anchor label="On this page" items={thisPage} offset={56} /></Specimen>
    <Specimen label="float">
      <div class="frame"><Anchor label="On this page" items={guide} current="#usage" float /></div>
    </Specimen>
    <Specimen label="float defaultOpen">
      <div class="frame"><Anchor label="On this page" items={guide} current="#usage" float defaultOpen /></div>
    </Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label={`current="#usage"`}><Anchor label="On this page" items={guide} current="#usage" /></Specimen>
    <Specimen label={`current="#events"`}><Anchor label="On this page" items={guide} current="#events" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={"float={1024}"}><Anchor label="On this page" items={guide} current="#install" float={1024} /></Specimen>
  {/snippet}
</DemoPage>
