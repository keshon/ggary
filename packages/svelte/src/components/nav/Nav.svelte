<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type NavItem, type NavProps } from '@ggary/core/nav'
  import { svelteNormalizer, uid } from '@ggary/core'

  /**
   * The side column. An item with `items` has sections one level down, opened
   * by the button beside it; which are open is kept here unless `open` is
   * given, and follows the reading until the reader sets it.
   */
  let { label, groups, open, onOpenChange, numbered, words: ownWords, ...rest }: Omit<NavProps, 'id'> & { [key: string]: unknown } = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'nav', ownWords))

  const id = uid('gg-nav')
  let chosen = $state<Record<string, boolean>>({})
  const api = $derived(
    connect(
      {
        id,
        label,
        groups,
        numbered,
        words,
        open: open ?? chosen,
        onOpenChange: (href, next) => {
          if (open === undefined) chosen = { ...chosen, [href]: next }
          onOpenChange?.(href, next)
        },
      },
      svelteNormalizer
    )
  )
</script>

{#snippet link(item: NavItem, level: 1 | 2)}
  {@const parts = api.getItemProps(item, level)}
  <a {...parts.itemProps}>{#if parts.showIcon}<span {...parts.iconProps}></span>{/if}{item.label}{#if parts.showCount}<span {...parts.countProps}>{item.count}</span>{/if}</a>
{/snippet}

<nav {...rest} {...api.rootProps}>
  {#each groups as group, index (group.label ?? index)}
    {@const parts = api.getGroupProps(group, index)}
    <div {...parts.groupProps}>
      {#if parts.showLabel}
        <span {...parts.groupLabelProps}>{group.label}</span>
      {/if}
      {#each group.items as item (item.href)}
        {@const branch = api.getBranchProps(item)}
        {#if branch}
          <div {...branch.branchProps}>
            {@render link(item, 1)}
            <button {...branch.toggleProps}><span {...branch.toggleIconProps}></span></button>
            <div {...branch.subitemsProps}>{#each branch.sections as section (section.href)}{@render link(section, 2)}{/each}</div>
          </div>
        {:else}
          {@render link(item, 1)}
        {/if}
      {/each}
    </div>
  {/each}
</nav>
