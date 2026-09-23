<script lang="ts">
  import { connect, type FailureProps, type FailureWords } from '@ggary/core/failure'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'
  import Button from '../button/Button.svelte'

  type Props = FailureProps & {
    /** Try again. Sending it, and moving the block into a resolved state, are the owner's. */
    onRetry?: () => void
    /** The other ways out beside the retry: skip the file, cancel the run. */
    actions?: Snippet
    words?: FailureWords
  }

  let { title, code, reason, state, tried, resolvedAt, live, onRetry, actions, words }: Props = $props()
  const api = $derived(connect({ title, code, reason, state, tried, resolvedAt, live }, svelteNormalizer, { onRetry }, words))
</script>

<div {...api.rootProps}>
  <div {...api.headProps}>
    <span {...api.iconProps}></span>
    <span {...api.titleProps}>{api.title}</span>
  </div>
  <div {...api.reasonProps}>{api.reason}</div>
  {#if api.tried.length > 0}
    <ul {...api.triedProps}>
      {#each api.tried as attempt (attempt)}
        <li {...api.attemptProps}>{attempt}</li>
      {/each}
    </ul>
  {/if}
  {#if api.showActions}
    <div {...api.actionsProps}>
      <Button emphasis="high" size="sm" onclick={api.retry.onClick}>{api.retry.label}</Button>
      {@render actions?.()}
    </div>
  {:else}
    <p {...api.verdictProps}>{api.verdict}</p>
  {/if}
</div>
