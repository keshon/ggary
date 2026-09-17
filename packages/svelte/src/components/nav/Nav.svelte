<script lang="ts">
  import { connect, type NavProps } from '@ggary/core/nav'
  import { svelteNormalizer, uid } from '@ggary/core'

  let { label, groups, ...rest }: Omit<NavProps, 'id'> & { [key: string]: unknown } = $props()

  const id = uid('gg-nav')
  const api = $derived(connect({ id, label, groups }, svelteNormalizer))
</script>

<nav {...rest} {...api.rootProps}>
  {#each groups as group, index (group.label ?? index)}
    {@const parts = api.getGroupProps(group, index)}
    <div {...parts.groupProps}>
      {#if parts.showLabel}
        <span {...parts.groupLabelProps}>{group.label}</span>
      {/if}
      {#each group.items as item (item.href)}
        {@const link = api.getItemProps(item)}
        <a {...link.itemProps}>
          {#if link.showIcon}
            <span {...link.iconProps}></span>
          {/if}
          {item.label}
          {#if link.showCount}
            <span {...link.countProps}>{item.count}</span>
          {/if}
        </a>
      {/each}
    </div>
  {/each}
</nav>
