<script lang="ts">
  import { Link, Note } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { toned } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="no tone" wide><Note>The bar only groups; the words carry the meaning.</Note></Specimen>
    {#each toned as { tone, text } (tone)}
      <Specimen label={`tone="${tone}"`} wide><Note {tone}>{text}</Note></Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="children with a Link" wide><Note tone="warn">runner-02 has not reported for 5 minutes. <Link href="#/note">Open the runner</Link></Note></Specimen>
  {/snippet}
</DemoPage>
