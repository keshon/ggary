<script lang="ts">
  import type { ControlSize } from '@ggary/core'
  import { connect, createCascaderMachine, focusCascaderItem, type CascaderNode } from '@ggary/core/cascader'
  import { attachPopover, onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { untrack } from 'svelte'

  type Props = {
    /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
    size?: ControlSize
    items: CascaderNode[]
    label?: string
    placeholder?: string
    /** The first column's name; the others are named by their parent. */
    rootLabel?: string
    /** Bindable: the chosen path, root first. */
    value?: string[] | null
    defaultValue?: string[] | null
    onValueChange?: (value: string[], nodes: CascaderNode[]) => void
    /** A branch may be chosen itself. Default false: leaves only. */
    selectParents?: boolean
    disabled?: boolean
    /** Submits the chosen leaf's value. */
    name?: string
  }

  /** A choice from a tree, one level to a column. */
  let { size, items, label, placeholder, rootLabel, value = $bindable(), defaultValue, onValueChange, selectParents, disabled, name }: Props = $props()

  const initial = untrack(() => (value !== undefined ? value : (defaultValue ?? null)))
  const machine = untrack(() =>
    createCascaderMachine({
      id: uid('gg-cascader'),
      items,
      defaultValue: initial,
      selectParents,
      disabled,
      onValueChange: (next, nodes) => {
        value = next
        onValueChange?.(next, nodes)
      },
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  // Effects that attach on open read this, not the snapshot: a new snapshot on every
  // change would detach and attach them again on each key.
  const isOpen = $derived(snapshot.open)
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label, placeholder, rootLabel, name, size }))

  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', selectParents, disabled }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: value ?? [] })
  })

  let triggerEl = $state<HTMLButtonElement | null>(null)
  let positionerEl = $state<HTMLDivElement | null>(null)
  let contentEl = $state<HTMLDivElement | null>(null)

  $effect(() =>
    onFormReset(triggerEl, () => {
      value = initial
      machine.send({ type: 'SYNC_VALUE', value: initial ?? [] })
    })
  )

  $effect(() => {
    const positioner = positionerEl
    if (!isOpen || !triggerEl || !positioner) return
    return untrack(() => {
      const popover = attachPopover(triggerEl!, positioner, { placement: 'bottom-start', gutter: 4, sameWidth: false, onDismiss: () => machine.send({ type: 'CLOSE' }) })
      // The columns are drawn in this same update: focus the highlighted item once they are.
      queueMicrotask(() => {
        focusCascaderItem(contentEl, api.focusedId, true)
      })
      return () => {
        const active = document.activeElement
        const inside = !active || active === document.body || positioner.contains(active)
        popover.destroy()
        if (inside) triggerEl?.focus({ preventScroll: true })
      }
    })
  })

  $effect(() => {
    const id = api.focusedId
    untrack(() => focusCascaderItem(contentEl, id))
  })
</script>

<div {...api.rootProps}>
  {#if label}<label {...api.labelProps}>{label}</label>{/if}
  <button bind:this={triggerEl} {...api.triggerProps}>
    <!-- One line: whitespace between the segments would be read out and drawn. -->
    <span {...api.valueProps}>{#if api.chosen.length === 0}{api.placeholder}{:else}{#each api.chosen as node, i (node.value)}{#if i > 0}<span {...api.separatorProps}></span>{/if}<span {...api.valueItemProps}>{node.label}</span>{/each}{/if}</span>
    <span {...api.indicatorProps}></span>
  </button>
  <div bind:this={positionerEl} {...api.positionerProps}>
    <div bind:this={contentEl} {...api.contentProps}>
      {#each api.columns as column, level (level)}
        <ul {...api.getColumnProps(level)}>
          {#each column as node (node.value)}
            <li {...api.getItemProps(node, level)}>
              <span {...api.itemTextProps}>{node.label}</span>
              {#if api.hasChildren(node)}<span {...api.getItemBranchProps(node, level)}></span>{:else}<span {...api.itemIndicatorProps}></span>{/if}
            </li>
          {/each}
        </ul>
      {/each}
    </div>
  </div>
  {#if name}<input {...api.hiddenInputProps} />{/if}
</div>
