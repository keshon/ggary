<script lang="ts">
  import { connectGroup, type AvatarGroupProps } from '@ggary/core/avatar'
  import { svelteNormalizer } from '@ggary/core'
  import Avatar from './Avatar.svelte'

  let props: AvatarGroupProps = $props()
  const api = $derived(connectGroup(props, svelteNormalizer))
</script>

<span {...api.groupProps}>
  {#each api.shown as person, index (`${person.name}-${index}`)}
    <Avatar {...person} size={props.size} />
  {/each}
  {#if api.hidden > 0}
    <span {...api.moreProps}>{api.moreText}</span>
  {/if}
</span>
