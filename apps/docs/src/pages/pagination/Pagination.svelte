<script lang="ts">
  import { Pagination, paginationRange } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { edges, href } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const
  // The page is the owner's: a press on a number moves it, and the link is not followed.
  let page = $state(7)
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="pages: 5" wide><Pagination label="Runs, pages" items={paginationRange({ page: 3, pages: 5, href })} /></Specimen>
    <Specimen label="pages: 24" wide><Pagination label="Runs, pages" items={paginationRange({ page: 12, pages: 24, href })} /></Specimen>
    <Specimen label="around: 2" wide><Pagination label="Runs, pages" items={paginationRange({ page: 12, pages: 24, around: 2, href })} /></Specimen>
    <Specimen label="previousLabel · nextLabel" wide><Pagination label="Runs, pages" items={paginationRange({ page: 12, pages: 24, ...edges, href })} /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`} wide><Pagination label="Runs, pages" {size} items={paginationRange({ page: 3, pages: 9, ...edges, href })} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled" wide><Pagination label="Runs, pages" items={paginationRange({ page: 1, pages: 24, ...edges, href })} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="onPageChange" wide>
      <Pagination
        label="Runs, pages"
        items={paginationRange({ page, pages: 24, ...edges, href })}
        onPageChange={(next, event) => {
          event.preventDefault()
          page = next
        }}
      />
    </Specimen>
  {/snippet}
</DemoPage>
