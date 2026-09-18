<script lang="ts">
  import { Split } from '../../../packages/svelte/src/index'
  import type { SplitProps } from '../harness'

  let { first: firstText, second: secondText, ...rest }: SplitProps = $props()
</script>

<Split {...rest}>
  {#snippet first()}<p>{firstText}</p>{/snippet}
  {#snippet second()}<p>{secondText}</p>{/snippet}
</Split>
