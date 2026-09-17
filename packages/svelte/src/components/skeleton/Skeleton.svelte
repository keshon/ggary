<script lang="ts">
  import { connect, type SkeletonProps } from '@ggary/core/skeleton'
  import { svelteNormalizer } from '@ggary/core'

  /* Put aria-busy on the region that is loading; the bars themselves say nothing. */
  let { lines, title }: SkeletonProps = $props()
  const api = $derived(connect({ lines, title }, svelteNormalizer))
</script>

<span {...api.rootProps}>
  {#each api.bars as bar (bar.key)}
    <span {...bar.props}></span>
  {/each}
</span>
