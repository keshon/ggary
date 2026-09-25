<script lang="ts">
  import { Link, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="href"><Link href="#/link">Export</Link></Specimen>
    <Specimen label="external"><Link href="https://github.com/keshon" external>GitHub</Link></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="in a line" wide>
      <span>12 400 leads match — <Link href="#/link">export them</Link> or read <Link href="https://github.com/keshon" external>the import guide</Link>.</span>
    </Specimen>
    <Specimen label={`beside Text emphasis="low"`}>
      <span><Text emphasis="low">12 400 leads</Text> · <Link href="#/link">Export</Link></span>
    </Specimen>
  {/snippet}
</DemoPage>
