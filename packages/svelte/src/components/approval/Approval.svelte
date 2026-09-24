<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type ApprovalDecision, type ApprovalProps, type ApprovalWords } from '@ggary/core/approval'
  import { svelteNormalizer, uid } from '@ggary/core'
  import type { Snippet } from 'svelte'
  import Button from '../button/Button.svelte'

  type Props = Omit<ApprovalProps, 'id'> & {
    /** The answer. Sending it, and moving the block into a decided state, are the owner's. */
    onDecide?: (decision: ApprovalDecision) => void
    /** A third way out beside the two answers — "always allow". It never replaces "deny". */
    actions?: Snippet
    words?: ApprovalWords
  }

  let { what, state, title, effects, decidedBy, decidedAt, live, onDecide, actions, words: ownWords }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'approval', ownWords))

  const id = uid('gg-approval')
  const api = $derived(connect({ id, what, state, title, effects, decidedBy, decidedAt, live }, svelteNormalizer, { onDecide, words }))
</script>

<div {...api.rootProps}>
  <div {...api.headProps}>
    <span {...api.iconProps}></span>
    <span {...api.titleProps}>{api.title}</span>
  </div>
  <div {...api.whatProps}>{api.what}</div>
  {#if api.effects.length > 0}
    <ul {...api.effectsProps}>
      {#each api.effects as effect (effect.text)}
        <li {...api.getEffectProps(effect)}>{effect.text}</li>
      {/each}
    </ul>
  {/if}
  {#if api.showActions}
    <div {...api.actionsProps}>
      <Button emphasis="high" size="sm" onclick={api.allow.onClick}>{api.allow.label}</Button>
      <Button size="sm" onclick={api.deny.onClick}>{api.deny.label}</Button>
      {@render actions?.()}
    </div>
  {:else}
    <p {...api.verdictProps}>{api.verdict}</p>
  {/if}
</div>
