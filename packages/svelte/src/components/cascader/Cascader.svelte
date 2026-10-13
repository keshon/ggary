<script lang="ts">
  import { Popover as Primitive, mergeProps as mergePrimitiveProps } from 'bits-ui'
  import { getConfig } from '../config-provider/context'
  import type { ControlSize } from '@ggary/core'
  import { connect, createCascaderMachine, focusCascaderItem, type CascaderNode } from '@ggary/core/cascader'
  import { onFormReset, svelteNormalizer, uid } from '@ggary/core'
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
  let { size: ownSize, items, label, placeholder, rootLabel, value = $bindable(), defaultValue, onValueChange, selectParents, disabled, name }: Props = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size)

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
  let contentEl = $state<HTMLDivElement | null>(null)

  $effect(() =>
    onFormReset(triggerEl, () => {
      value = initial
      machine.send({ type: 'SYNC_VALUE', value: initial ?? [] })
    })
  )

  const triggerAttrs = $derived.by(() => {
    const { onclick: _toggle, ...attrs } = api.triggerProps
    return attrs
  })
  let inheritedStyle = $state('')
  let inheritedDir = $state<'ltr' | 'rtl'>('ltr')
  $effect(() => {
    if (!isOpen || !triggerEl) return
    const computed = getComputedStyle(triggerEl)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    inheritedDir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${inheritedDir};${vars.join(';')}`
  })
  let outside = false
  let wasOpen = false
  $effect(() => {
    if (isOpen) outside = false
    else if (wasOpen && !outside) queueMicrotask(() => {
      if (!snapshot.open && !outside && triggerEl?.isConnected) triggerEl.focus({ preventScroll: true })
    })
    wasOpen = isOpen
  })
  $effect(() => {
    const id = api.focusedId
    untrack(() => focusCascaderItem(contentEl, id))
  })
</script>

<Primitive.Root bind:open={() => isOpen, next => machine.send({ type: next ? 'OPEN' : 'CLOSE' })}>
<div {...api.rootProps}>
  {#if label}<label {...api.labelProps}>{label}</label>{/if}
  <Primitive.Trigger bind:ref={triggerEl} {...triggerAttrs}>
    <!-- One line: whitespace between the segments would be read out and drawn. -->
    <span {...api.valueProps}>{#if api.chosen.length === 0}{api.placeholder}{:else}{#each api.chosen as node, i (node.value)}{#if i > 0}<span {...api.separatorProps}></span>{/if}<span {...api.valueItemProps}>{node.label}</span>{/each}{/if}</span>
    <span {...api.indicatorProps}></span>
  </Primitive.Trigger>
  <Primitive.Portal>
    <Primitive.Content forceMount id={api.ids.content} side="bottom" align="start" sideOffset={4} customAnchor={triggerEl} strategy="fixed" trapFocus={false} preventScroll={false} dir={inheritedDir} style={inheritedStyle}
      onInteractOutside={() => { outside = true }}
      onOpenAutoFocus={event => { event.preventDefault(); focusCascaderItem(contentEl, api.focusedId, true) }}
      onCloseAutoFocus={event => { event.preventDefault(); if (!outside) triggerEl?.focus({ preventScroll: true }) }}>
      {#snippet child({ props: contentAttrs, wrapperProps })}
        <div {...wrapperProps} data-scope="cascader" data-part="positioner" data-backend="bits-ui" data-state={isOpen ? 'open' : 'closed'}>
          <div bind:this={contentEl} {...mergePrimitiveProps(contentAttrs, api.contentProps, { style: { '--gg-available-width': 'var(--bits-floating-available-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })} data-backend="bits-ui" hidden={!isOpen}>
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
      {/snippet}
    </Primitive.Content>
  </Primitive.Portal>
  {#if name}<input {...api.hiddenInputProps} />{/if}
</div>

</Primitive.Root>
