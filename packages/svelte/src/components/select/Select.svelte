<script lang="ts">
  import { Select as Primitive, mergeProps } from 'bits-ui'
  import { untrack } from 'svelte'
  import { getConfig } from '../config-provider/context'
  import { onFormReset, type ControlSize } from '@ggary/core'
  import type { SelectItem } from '@ggary/core/select'
  import { useFormField } from '../form/context.svelte'

  type Props = {
    size?: ControlSize
    items: SelectItem[]
    label?: string
    placeholder?: string
    /** Two-way with bind:value; callbacks report user choices without echoing owner updates. */
    value?: string | null
    defaultValue?: string | null
    disabled?: boolean
    /** Fill the available inline space. Standalone controls otherwise use the theme's stable field width. */
    fullWidth?: boolean
    name?: string
    onValueChange?: (value: string | null, item: SelectItem | null) => void
  }
  let { size: ownSize, items, label, placeholder = 'Select...', value = $bindable(),
    defaultValue, disabled = false, fullWidth, name, onValueChange }: Props = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size ?? 'md')
  const componentId = $props.id()
  const id = `gg-bits-select-${componentId}`
  const initial = untrack(() => value !== undefined ? value : (defaultValue ?? null))
  let localValue = $state(initial)
  let isOpen = $state(false)
  const selected = $derived(value !== undefined ? value : localValue)
  // Bits reserves an empty string for no selection; GGary allows it as an item value.
  const bitsItems = $derived(items.map(item => ({ ...item, value: `gg:${item.value}` })))
  const bitsValue = $derived(selected == null ? '' : `gg:${selected}`)
  const selectedItem = $derived(items.find(item => item.value === selected))
  const form = useFormField(() => name, () => `${id}-trigger`, () => label)
  let triggerEl = $state<HTMLButtonElement | null>(null)
  $effect(() => onFormReset(triggerEl, () => { value = initial; localValue = initial }))
  const part = (name: string) => ({ 'data-scope': 'select', 'data-part': name, 'data-backend': 'bits-ui' })
  function changed(next: string) {
    const nextValue = next === '' ? null : next.slice(3)
    value = nextValue; localValue = nextValue
    onValueChange?.(nextValue, items.find(item => item.value === nextValue) ?? null)
    form.edited()
  }
  let inheritedStyle = $state('')
  let inheritedDir = $state<'ltr' | 'rtl'>('ltr')
  $effect(() => {
    if (!isOpen || !triggerEl) return
    const computed = getComputedStyle(triggerEl)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) {
      const key = computed[i]
      if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`)
    }
    inheritedDir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${inheritedDir};${vars.join(';')}`
  })
</script>

<div {...part('root')} data-size={size} data-disabled={disabled ? '' : undefined} data-full-width={fullWidth ? '' : undefined}>
  <Primitive.Root type="single" value={bitsValue} onValueChange={changed} bind:open={isOpen}
    items={bitsItems} {disabled} allowDeselect={false} loop>
    {#if label}
      <label {...part('label')} id={`${id}-label`} for={`${id}-trigger`} data-disabled={disabled ? '' : undefined}>{label}</label>
    {/if}
    <Primitive.Trigger {...part('trigger')} id={`${id}-trigger`} bind:ref={triggerEl}
      role="combobox" aria-controls={isOpen ? `${id}-content` : undefined}
      aria-invalid={form.error ? 'true' : undefined} aria-describedby={form.field.controlProps['aria-describedby']}
      data-invalid={form.error ? '' : undefined}
      aria-labelledby={label ? `${id}-label` : undefined}>
      <span {...part('value')} data-placeholder={!selectedItem ? '' : undefined}>{selectedItem?.label ?? placeholder}</span>
      <span {...part('indicator')} data-icon="chevron-down" aria-hidden="true" data-state={isOpen ? 'open' : 'closed'}></span>
    </Primitive.Trigger>
    <Primitive.Portal>
      <Primitive.Content id={`${id}-content`} sideOffset={4} align="start" strategy="fixed" dir={inheritedDir} style={inheritedStyle}>
        {#snippet child({ props: contentProps, wrapperProps })}
          <div {...wrapperProps} {...part('positioner')} data-state={isOpen ? 'open' : 'closed'}>
            <div {...mergeProps(contentProps, part('content'), { style: { '--gg-anchor-width': 'var(--bits-floating-anchor-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })} aria-labelledby={label ? `${id}-label` : undefined}>
              {#if items.length === 0}<div {...part('empty')}>No options</div>{/if}
              {#each items as item (item.value)}
                <Primitive.Item {...part('item')} value={`gg:${item.value}`} label={item.label} disabled={item.disabled} aria-disabled={item.disabled ? 'true' : undefined}>
                  <span {...part('item-text')}>{item.label}</span>
                  <span {...part('item-indicator')} data-icon="check" aria-hidden="true"></span>
                </Primitive.Item>
              {/each}
            </div>
          </div>
        {/snippet}
      </Primitive.Content>
    </Primitive.Portal>
  </Primitive.Root>
  <span {...form.field.errorProps}>{form.error}</span>
  {#if name}<input type="hidden" {name} value={selected ?? ''} {disabled} data-scope="select" data-part="hidden-input" />{/if}
</div>
