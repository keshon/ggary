<script lang="ts">
  import { Approval, Composer, Failure, Thinking, Turn } from '../../../packages/svelte/src/index'

  let { component, ...props }: any = $props()
</script>

{#snippet copy()}<button type="button">Copy</button>{/snippet}
{#snippet draft()}<button type="button">Draft</button>{/snippet}
{#snippet always()}<button type="button">Always allow</button>{/snippet}
{#snippet skip()}<button type="button">Skip the file</button>{/snippet}

{#if component === 'turn'}
  {@const { body, actions, ...rest } = props}
  <Turn {...rest} actions={actions ? copy : undefined}>{body}</Turn>
{:else if component === 'composer'}
  {@const { extra, ...rest } = props}
  {#if extra}
    <Composer {...rest}>{@render draft()}</Composer>
  {:else}
    <Composer {...rest} />
  {/if}
{:else if component === 'thinking'}
  {@const { body, ...rest } = props}
  <Thinking {...rest}>{body}</Thinking>
{:else if component === 'approval'}
  {@const { extra, ...rest } = props}
  <Approval {...rest} actions={extra ? always : undefined} />
{:else if component === 'failure'}
  {@const { extra, ...rest } = props}
  <Failure {...rest} actions={extra ? skip : undefined} />
{/if}
