<script lang="ts">
  import { ContextMenu, Popconfirm, Result } from '../../../packages/svelte/src/index'

  /** The components whose trigger or slots are snippets, given plain props by the spec. */
  let { component, ...props }: any = $props()
</script>

{#snippet confirmTrigger(bag: Record<string, unknown>)}<button type="button" {...bag}>{props.triggerLabel}</button>{/snippet}
{#snippet menuTarget(bag: Record<string, unknown>)}<button type="button" {...bag}>{props.targetLabel}</button>{/snippet}
{#snippet resultActions()}{#each props.actions ?? [] as label (label)}<button type="button">{label}</button>{/each}{/snippet}
{#snippet resultDetails()}<p>{props.details}</p>{/snippet}

{#if component === 'popconfirm'}
  {@const { triggerLabel, ...rest } = props}
  <Popconfirm {...rest} trigger={confirmTrigger} />
{:else if component === 'context-menu'}
  {@const { targetLabel, ...rest } = props}
  <ContextMenu {...rest} trigger={menuTarget} />
{:else if component === 'result'}
  {@const { actions, details, ...rest } = props}
  <Result {...rest} actions={actions ? resultActions : undefined} children={details ? resultDetails : undefined} />
{/if}
