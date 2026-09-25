<script lang="ts">
  import { Link, Prose } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { article } from './data'

  const SIZES = ['sm', 'md'] as const
</script>

<DemoPage>
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`} wide><Prose {size} html={article} /></Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="children" wide>
      <Prose>
        <h3>Release notes</h3>
        <p>The grid keeps its filters in the address now, so a filtered view can be shared — see <Link href="#/prose">the changelog</Link>.</p>
        <ul>
          <li>Saved views load in a third of the time.</li>
          <li>A failed export says which row it stopped at.</li>
        </ul>
      </Prose>
    </Specimen>
  {/snippet}
</DemoPage>
