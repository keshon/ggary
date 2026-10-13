<script lang="ts">
  import { ToggleGroup } from 'bits-ui'
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import type { ChipGroupMode, ChipGroupOrientation, ChipItem } from '@ggary/core/chip-group'
  import { chipAttrs, chipRemoveAttrs, chipRemoveIconAttrs } from '@ggary/core/chip'
  import type { ChipEmphasis, ChipSize } from '@ggary/core/chip'
  import { onFormReset, svelteNormalizer, typeahead, uid } from '@ggary/core'
  import { untrack } from 'svelte'
  type Props = {
    items: ChipItem[]
    label?: string
    mode?: ChipGroupMode
    orientation?: ChipGroupOrientation
    emphasis?: ChipEmphasis
    size?: ChipSize
    removable?: boolean
    disabled?: boolean
    name?: string
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string[]
    defaultValue?: string[]
    onValueChange?: (selection: string[], items: ChipItem[]) => void
    onRemove?: (value: string, item: ChipItem | null) => void
    /** What the group says: `empty` when it holds no chips. */
  words?: { empty?: string }
  }

  let {
    items,
    label,
    mode,
    orientation,
    emphasis,
    size,
    removable,
    disabled = false,
    name,
    value = $bindable(),
    defaultValue,
    onValueChange,
    onRemove,
    words: ownWords = {},
  }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'chipGroup', ownWords))


  const id = uid('gg-chips')
  const initial = untrack(() => value ?? defaultValue ?? [])
  untrack(() => { if (value === undefined) value = initial })
  const selection = $derived(items.filter(item => value?.includes(item.value)).map(item => item.value).slice(0, mode === 'single' ? 1 : undefined))
  const encode = (key: string) => JSON.stringify(key)
  const encoded = $derived(selection.map(encode))
  let root: HTMLDivElement
  let search = { buffer: '', at: 0 }
  $effect(() => onFormReset(root, () => { value = initial }))
  function change(keys: string[]) {
    if (disabled) return
    const decoded = keys.map(key => JSON.parse(key) as string)
    const added = decoded.find(key => !selection.includes(key))
    const next = mode === 'single' ? (added !== undefined ? [added] : decoded.slice(0, 1)) : items.filter(item => decoded.includes(item.value)).map(item => item.value)
    value = next
    onValueChange?.(next, items.filter(item => next.includes(item.value)))
  }
  function remove(item: ChipItem) {
    if (!disabled && !item.disabled && (item.removable ?? removable ?? false)) onRemove?.(item.value, item)
  }
  function extraKeys(event: KeyboardEvent, item: ChipItem, index: number) {
    if (disabled || item.disabled) return
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); remove(item); return }
    if (event.key.length !== 1 || event.key === ' ' || event.ctrlKey || event.metaKey || event.altKey) return
    const result = typeahead(items, { char: event.key, now: Date.now(), state: search, from: index, getText: item => item.label, isDisabled: item => !!item.disabled })
    search = result.state
    event.preventDefault()
    if (result.index >= 0) root.querySelector<HTMLButtonElement>(`[id="${id}-chip-${result.index}"]`)?.focus()
  }
  let focused: HTMLButtonElement | null = null
  // Focus recovery is only for a removed DOM node, not ordinary rerenders.
  $effect(() => {
    void items
    if (!focused || focused.isConnected || !root.isConnected) return
    const index = Number(focused.dataset.chipIndex)
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-chip-index]:not(:disabled)')]
    const next = buttons.find(button => Number(button.dataset.chipIndex) >= index) ?? buttons.at(-1)
    focused = null
    next?.focus()
  })
</script>

<div bind:this={root} data-scope="chip-group" data-part="root" {id} data-orientation={orientation ?? 'horizontal'} data-disabled={disabled ? '' : undefined}>
  {#if label}<span id={`${id}-label`} data-scope="chip-group" data-part="label">{label}</span>{/if}
  <ToggleGroup.Root type="multiple" bind:value={() => encoded, change} {disabled} orientation={orientation ?? 'horizontal'} data-scope="chip-group" data-part="list" aria-labelledby={label ? `${id}-label` : undefined}>
    {#snippet child({ props })}
    <div {...props} role="toolbar" aria-orientation={orientation ?? 'horizontal'}>
    {#if items.length === 0}<span data-scope="chip-group" data-part="empty">{words.empty ?? 'Nothing here'}</span>{/if}
    {#each items as item, index (item.value)}
      <ToggleGroup.Item value={encode(item.value)} disabled={disabled || item.disabled} id={`${id}-chip-${index}`} {...svelteNormalizer(chipAttrs({ emphasis, size, selected: selection.includes(item.value), disabled: disabled || item.disabled, removable: item.removable ?? removable }))} data-chip-index={index} onfocus={(event) => { focused = event.currentTarget }} onblur={(event) => { if (event.relatedTarget) focused = null }} aria-keyshortcuts={(item.removable ?? removable) ? 'Delete' : undefined} onkeydown={(event) => extraKeys(event, item, index)}>
        <span data-scope="chip" data-part="label">{item.label}</span>
        {#if item.removable ?? removable ?? false}
          <span {...svelteNormalizer(chipRemoveAttrs(() => remove(item)))}><span {...svelteNormalizer(chipRemoveIconAttrs())}></span></span>
        {/if}
      </ToggleGroup.Item>
    {/each}
    </div>
    {/snippet}
  </ToggleGroup.Root>
  {#if name}{#each selection as selected (selected)}<input {...{ type: 'hidden', name, value: selected, disabled }} />{/each}{/if}
</div>
