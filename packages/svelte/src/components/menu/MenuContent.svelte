<script lang="ts">
  import { hasIndicator, menuFocusTarget, type MenuApi, type MenuItem, type MenuNode, type MenuState } from '@ggary/core/menu'
  import { attachPopover, submenuOffsets, focusMenuTarget, revealMenuTarget, type AttachedPopover, type VirtualElement } from '@ggary/core'
  import { untrack } from 'svelte'

  type Props = {
    api: MenuApi
    /** The machine's current state, read at the moment an effect runs. */
    getState: () => MenuState
    /** What the menu is anchored to: a Menu's trigger, a Menubar's item. Focus goes back to it on close. */
    reference: () => HTMLElement | null
    /** Where the menu stands when that is not the reference: a context menu stands at the pointer. */
    anchor?: () => Element | VirtualElement | null
    /** A press on the reference closes the menu, as for a context menu. Default false: a trigger toggles. */
    dismissOnReference?: boolean
  }

  let { api, getState, reference, anchor, dismissOnReference }: Props = $props()

  /*
   * The menu panel and every submenu under it, shared by Menu and Menubar, which
   * differ only in what opens the panel.
   */
  let content: HTMLDivElement
  let attached: AttachedPopover | null = null

  const open = $derived(api.open)

  $effect(() => {
    if (!open) return
    const instance = untrack(() => {
      const element = reference()
      if (!element) return null
      return attachPopover(element, content, {
        placement: getState().placement,
        gutter: 4,
        // Focus goes back to the anchor on close; while open it follows the focus target, below.
        manageFocus: true,
        onDismiss: (reason) => api.dismiss(reason),
        // Placement is asynchronous and shortens the list: keep the row in view after it.
        onPlaced: () => revealMenuTarget(document, menuFocusTarget(getState())),
        anchor: anchor?.() ?? undefined,
        excludeReference: !dismissOnReference,
      })
    })
    attached = instance
    return () => {
      instance?.destroy()
      attached = null
    }
  })

  $effect(() => {
    const next = { placement: api.placement }
    untrack(() => attached?.update(next))
  })

  // After the attach above, so the menu is shown and can take focus. A submenu
  // that shows later focuses again from its own attachment.
  $effect(() => {
    const target = api.focusTarget
    if (open) untrack(() => focusMenuTarget(document, target))
  })

  /*
   * A submenu is shown for as long as it is rendered. The attachment runs once
   * per submenu element: its function is cached per path, so Svelte, which
   * re-attaches only when the function changes, does not re-attach on every
   * state change, and its body is untracked for the same reason.
   */
  const submenus = new Map<string, (element: HTMLElement) => () => void>()
  function submenu(path: number[]) {
    const key = path.join('-')
    let attachment = submenus.get(key)
    if (!attachment) {
      attachment = (element: HTMLElement) =>
        untrack(() => {
          const row = document.getElementById(api.ids.item(path))
          if (!row) return () => {}
          const instance = attachPopover(row, element, {
            placement: 'right-start',
            ...submenuOffsets(row, element),
            // The menu is the dismiss layer for the whole tree.
            dismissable: false,
            onDismiss: () => {},
            onPlaced: () => revealMenuTarget(document, menuFocusTarget(getState())),
          })
          focusMenuTarget(document, menuFocusTarget(getState()))
          return () => instance.destroy()
        })
      submenus.set(key, attachment)
    }
    return attachment
  }
</script>

{#snippet row(item: MenuItem, path: number[])}
  {@const props = api.getItemProps(item, path)}
  {#if props.href}
    <a {...props}>{@render inner(item)}</a>
  {:else}
    <div {...props}>{@render inner(item)}</div>
  {/if}
  {#if item.type === 'submenu' && api.isSubmenuOpen(path)}
    <div {@attach submenu(path)} {...api.getSubmenuProps(path)}>
      {@render level(api.nodesOf(item), path)}
    </div>
  {/if}
{/snippet}

{#snippet inner(item: MenuItem)}
  <span {...api.getItemTextProps()}>{item.label}</span>
  {#if 'shortcut' in item && item.shortcut}
    <span {...api.getItemShortcutProps()}>{item.shortcut}</span>
  {/if}
  {#if hasIndicator(item)}
    <span {...api.getItemIndicatorProps(item)}></span>
  {/if}
  {#if item.type === 'submenu'}
    <span {...api.submenuIndicatorProps}></span>
  {/if}
{/snippet}

{#snippet level(nodes: MenuNode[], parent: number[])}
  {#each nodes as node (node.key)}
    {#if node.kind === 'separator'}
      <div {...api.separatorProps}></div>
    {:else if node.kind === 'item'}
      {@render row(node.item, [...parent, node.index])}
    {:else}
      <div {...api.getGroupProps(node, parent)}>
        {#if node.label}
          <div {...api.getGroupLabelProps(node, parent)}>{node.label}</div>
        {/if}
        {#each node.items as entry (entry.item.value)}
          {@render row(entry.item, [...parent, entry.index])}
        {/each}
      </div>
    {/if}
  {/each}
{/snippet}

<div bind:this={content} {...api.contentProps}>
  {@render level(api.nodes, [])}
</div>
