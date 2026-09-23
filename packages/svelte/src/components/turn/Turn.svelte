<script lang="ts">
  import { connect, type TurnProps, type TurnWords } from '@ggary/core/turn'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'
  import Caret from '../states/Caret.svelte'

  type Props = TurnProps & {
    /** What was said. A turn still arriving gets the caret at the end of it. */
    children?: Snippet
    /** Between the head and the body: the reasoning that came before the answer. */
    before?: Snippet
    /** After the body: what the answer produced — steps, a diff, an approval, a failure. */
    after?: Snippet
    /** Copy, retry, branch. The row keeps its space whether or not it is hovered. */
    actions?: Snippet
    /** The units of the head, for another language. */
    words?: TurnWords
  }

  let { who, from, time, tokens, duration, locale, streaming, children, before, after, actions, words }: Props = $props()
  const api = $derived(connect({ who, from, time, tokens, duration, locale, streaming }, svelteNormalizer, words))
</script>

<div {...api.rootProps}>
  <div {...api.headProps}>
    <span {...api.whoProps}>{api.who}</span>
    {#if time !== undefined}<span {...api.timeProps}>{time}</span>{/if}
    {#if api.cost !== undefined}<span {...api.costProps}>{api.cost}</span>{/if}
  </div>
  {@render before?.()}
  {#if children}
    <div {...api.bodyProps}>{@render children()}{#if api.showCaret}<Caret />{/if}</div>
  {/if}
  {@render after?.()}
  {#if actions}
    <div {...api.actionsProps}>{@render actions()}</div>
  {/if}
</div>
