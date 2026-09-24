<script lang="ts">
  import { Banner, Card, EmptyState, Link, Note, Panel, Text } from '../../../packages/svelte/src/index'

  let { component, ...props }: any = $props()
</script>

{#snippet refresh()}<button type="button">Refresh</button>{/snippet}
{#snippet renew()}<button type="button">Renew</button>{/snippet}

{#if component === 'card'}
  <Card {...props}>Body</Card>
{:else if component === 'panel'}
  {@const { actions, ...rest } = props}
  <Panel {...rest} actions={actions ? refresh : undefined}>Body</Panel>
{:else if component === 'banner'}
  {@const { text, actions, ...rest } = props}
  {#if text === undefined}
    <Banner {...rest} actions={actions ? renew : undefined} />
  {:else}
    <Banner {...rest} actions={actions ? renew : undefined}>{text}</Banner>
  {/if}
{:else if component === 'text'}
  {@const { text, ...rest } = props}
  <Text {...rest}>{text}</Text>
{:else if component === 'link'}
  {@const { text, ...rest } = props}
  <Link {...rest}>{text}</Link>
{:else if component === 'note'}
  {@const { text, ...rest } = props}
  <Note {...rest}>{text}</Note>
{:else if component === 'empty-state'}
  {@const { action, ...rest } = props}
  {#if action === undefined}
    <EmptyState {...rest} />
  {:else}
    <EmptyState {...rest}><button type="button">{action}</button></EmptyState>
  {/if}
{/if}
