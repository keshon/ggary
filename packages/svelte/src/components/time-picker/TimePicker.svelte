<script lang="ts">
  import { Combobox as Primitive, mergeProps as mergePrimitiveProps } from 'bits-ui'
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import type { ControlSize } from '@ggary/core'
  import { timePickerAnatomy, timePickerIds, exampleTime, type TimePickerWords } from '@ggary/core/time-picker'
  import { onFormReset, formatTime, parseTypedTime, timeSteps, minutesOf, uid, type ISOTime } from '@ggary/core'
  import { useFormField } from '../form/context.svelte'
  import { untrack } from 'svelte'

  type Props = {
    /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
    size?: ControlSize
    label?: string
    /** Bindable: `HH:mm`. */
    value?: ISOTime | null
    defaultValue?: ISOTime | null
    onValueChange?: (value: ISOTime | null) => void
    /** Minutes between the times in the list. Default 15. */
    step?: number
    min?: ISOTime
    max?: ISOTime
    /** A time the owner refuses: shown in the list, faded, and not chosen. */
    isTimeDisabled?: (time: ISOTime) => boolean
    /** The clock to read and write in: twelve hours or twenty-four follows it. */
    locale?: string
    /** Submits the time as `HH:mm`. */
    name?: string
    placeholder?: string
    words?: TimePickerWords
    /** Inside another field's box, as DatePicker's time: no label or box of its own; `label` names the input. */
    embedded?: boolean
    /** Fill the available inline space. Standalone controls otherwise use the theme's stable field width. */
    fullWidth?: boolean
  }

  /** A field for a time of day, typed or chosen from a list of times at a step. */
  let { size: ownSize, label, value = $bindable(), defaultValue, onValueChange, step, min, max, isTimeDisabled, locale: ownLocale, name, placeholder, words: ownWords, embedded, fullWidth }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const size = $derived(ownSize ?? kit().size)
  const words = $derived(configWords(kit(), 'timePicker', ownWords))

  const initial = untrack(() => value !== undefined ? value : defaultValue ?? null)
  const id = untrack(() => uid('gg-time'))
  const ids = timePickerIds(id)
  const part = (name: Parameters<typeof timePickerAnatomy.attrs>[0]) => ({ ...timePickerAnatomy.attrs(name), 'data-backend': 'bits-ui' })
  let own = $state(initial)
  const committed = $derived(value !== undefined ? value : own)
  let isOpen = $state(false)
  let draft = $state('')
  let editing = $state(false)
  let invalid = $state(false)
  const text = $derived(editing ? draft : committed ? formatTime(committed, locale) : '')
  const times = $derived(timeSteps(step ?? 15, min ?? null, max ?? null).map(time => ({ time, label: formatTime(time, locale), disabled: unavailable(time) })))
  const bitsItems = $derived(times.map(item => ({ value: item.time, label: item.label, disabled: item.disabled })))
  const form = useFormField(() => name, () => ids.input, () => label)
  const errorText = $derived(invalid ? (words?.invalid ?? (sample => `Enter a time like ${sample}`))(exampleTime(locale)) : '')
  const describedBy = $derived([invalid ? ids.error : undefined, form.field.controlProps['aria-describedby']].filter(Boolean).join(' ') || undefined)
  function unavailable(time: ISOTime) {
    const minutes = minutesOf(time)
    return !!((min && minutes < minutesOf(min)) || (max && minutes > minutesOf(max)) || isTimeDisabled?.(time))
  }
  function commit(next: ISOTime | null) {
    if (next && unavailable(next)) return
    const changed = next !== committed
    own = next
    if (value !== undefined) value = next
    editing = false; invalid = false; draft = ''; isOpen = false
    if (changed) { onValueChange?.(next); form.edited() }
  }
  function commitText() {
    if (!editing) return
    const next = draft.trim() === '' ? null : parseTypedTime(draft, locale)
    if (draft.trim() !== '' && (!next || unavailable(next))) { invalid = true; isOpen = false; return }
    commit(next)
  }
  function domainKey(event: KeyboardEvent) {
    if (event.isComposing) return
    if (event.key === 'Enter' && editing) { event.preventDefault(); commitText(); return }
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key) || (isOpen && !editing && ['Home', 'End'].includes(event.key))) {
      editing = false; invalid = false; draft = ''
    }
    if (event.key === 'Escape' && !isOpen && editing) { event.preventDefault(); editing = false; invalid = false; draft = '' }
  }
  let inputEl = $state<HTMLInputElement | null>(null)
  let controlEl = $state<HTMLDivElement | null>(null)
  $effect(() => onFormReset(inputEl, () => {
    own = initial
    if (value !== undefined) value = initial
    editing = false; invalid = false; draft = ''; isOpen = false
  }))
  let contentEl = $state<HTMLDivElement | null>(null)
  $effect(() => {
    if (!isOpen || !contentEl || !inputEl) return
    const content = contentEl, input = inputEl
    let frame = 0
    const reveal = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const activeId = input.getAttribute('aria-activedescendant')
        const active = activeId ? content.ownerDocument.getElementById(activeId) : null
        const item = active ?? content.querySelector<HTMLElement>('[aria-selected="true"]')
        if (!item || !content.contains(item)) return
        const outer = content.getBoundingClientRect(), inner = item.getBoundingClientRect()
        if (inner.top < outer.top || inner.bottom > outer.bottom) content.scrollTop += inner.top - outer.top - (content.clientHeight - inner.height) / 2
      })
    }
    const observer = new MutationObserver(reveal)
    observer.observe(input, { attributes: true, attributeFilter: ['aria-activedescendant'] })
    observer.observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected'] })
    reveal()
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  })
  let inheritedStyle = $state('')
  let inheritedDir = $state<'ltr' | 'rtl'>('ltr')
  $effect(() => {
    if (!isOpen || !controlEl) return
    const computed = getComputedStyle(controlEl)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    inheritedDir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${inheritedDir};${vars.join(';')}`
  })
</script>

<Primitive.Root type="single" value={committed ?? ''} onValueChange={next => commit(next as ISOTime || null)} bind:open={isOpen} inputValue={text} items={bitsItems} allowDeselect={false} scrollAlignment="center">
<div {...part('root')} id={ids.root} data-size={size ?? 'md'} data-state={isOpen ? 'open' : 'closed'} data-invalid={invalid ? '' : undefined} data-embedded={embedded ? '' : undefined} data-full-width={fullWidth ? '' : undefined}>
  {#if label && !embedded}<label {...part('label')} id={ids.label} for={ids.input}>{label}</label>{/if}
  <div bind:this={controlEl} {...part('control')} data-state={isOpen ? 'open' : 'closed'} data-invalid={invalid ? '' : undefined}>
    <Primitive.Input id={ids.input} bind:ref={inputEl}>
      {#snippet child({ props: inputAttrs })}
        <input {...mergePrimitiveProps({ onkeydown: domainKey }, inputAttrs, part('input'), {
          oninput: (event: Event) => { draft = (event.currentTarget as HTMLInputElement).value; editing = true; invalid = false; isOpen = true },
          onblur: () => { commitText(); isOpen = false }
        })} value={text} type="text" inputmode="text" autocomplete="off" spellcheck={false}
          placeholder={placeholder ?? words?.placeholder ?? exampleTime(locale)} aria-label={embedded ? label ?? 'Time' : undefined}
          aria-controls={ids.content} aria-invalid={invalid || form.error ? 'true' : undefined} data-invalid={invalid || form.error ? '' : undefined} aria-describedby={describedBy} />
      {/snippet}
    </Primitive.Input>
    <Primitive.Trigger {...part('trigger')} id={ids.trigger} type="button" tabindex={-1} aria-label={words?.choose ?? 'Choose time'} aria-controls={ids.content} aria-expanded={isOpen ? 'true' : 'false'}>
      <span {...part('trigger-icon')} data-icon="chevron-down" aria-hidden="true"></span>
    </Primitive.Trigger>
  </div>
  {#if invalid}<span {...part('error')} id={ids.error}>{errorText}</span>{/if}
  <span {...form.field.errorProps}>{form.error}</span>
  {#if name}<input type="hidden" {name} value={committed ?? ''} data-scope="time-picker" data-part="hidden-input" />{/if}
  <Primitive.Portal>
    <Primitive.Content forceMount id={ids.content} side="bottom" align="start" sideOffset={4} customAnchor={controlEl} strategy="fixed" dir={inheritedDir} style={inheritedStyle}>
      {#snippet child({ props: contentAttrs, wrapperProps })}
        <div {...wrapperProps} data-scope="time-picker" data-part="positioner" data-backend="bits-ui" data-state={isOpen ? 'open' : 'closed'}>
          <div bind:this={contentEl} {...mergePrimitiveProps(contentAttrs, part('content'), { style: { width: 'var(--bits-floating-anchor-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })} aria-label={words?.times ?? 'Times'} data-state={isOpen ? 'open' : 'closed'} hidden={!isOpen}>
            {#if isOpen}{#each times as item (item.time)}<Primitive.Item {...part('item')} id={ids.item(item.time)} value={item.time} label={item.label} disabled={item.disabled} aria-disabled={item.disabled ? 'true' : undefined} onpointerup={() => { if (!item.disabled && item.time === committed) commit(item.time) }}>{item.label}</Primitive.Item>{/each}{/if}
          </div>
        </div>
      {/snippet}
    </Primitive.Content>
  </Primitive.Portal>
</div>
</Primitive.Root>
