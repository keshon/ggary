<script lang="ts">
  import type { ControlSize } from '@ggary/core'
  import { connect, createTimePickerMachine, type TimePickerWords } from '@ggary/core/time-picker'
  import { attachPopover, mergeProps, onFormReset, scrollIntoCenter, scrollIntoViewIfNeeded, svelteNormalizer, uid, type ISOTime } from '@ggary/core'
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
  }

  /** A field for a time of day, typed or chosen from a list of times at a step. */
  let { size, label, value = $bindable(), defaultValue, onValueChange, step, min, max, isTimeDisabled, locale, name, placeholder, words, embedded }: Props = $props()

  const initial = untrack(() => (value !== undefined ? value : (defaultValue ?? null)))
  const machine = untrack(() =>
    createTimePickerMachine({
      id: uid('gg-time'),
      defaultValue: initial,
      step, min, max, isTimeDisabled, locale,
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
        form.edited()
      },
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const isOpen = $derived(snapshot.open)
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { ...words, locale, name, placeholder: placeholder ?? words?.placeholder, size, embedded, label }))
  // Inside a Form, by name: the error its rules hold for this time.
  const form = useFormField(() => name, () => api.ids.input, () => label)

  $effect(() => machine.send({ type: 'SYNC_OPTIONS', locale, step, min, max, isTimeDisabled }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  })

  let inputEl = $state<HTMLInputElement | null>(null)
  let controlEl = $state<HTMLDivElement | null>(null)
  let positionerEl = $state<HTMLDivElement | null>(null)
  let contentEl = $state<HTMLDivElement | null>(null)

  $effect(() =>
    onFormReset(inputEl, () => {
      value = initial
      machine.send({ type: 'SYNC_VALUE', value: initial })
    })
  )

  $effect(() => {
    const positioner = positionerEl
    if (!isOpen || !controlEl || !positioner) return
    // The focus stays in the field: placement and dismissal only.
    return untrack(() => {
      const popover = attachPopover(controlEl!, positioner, { sameWidth: true, gutter: 4, onDismiss: () => machine.send({ type: 'CLOSE' }) })
      return () => popover.destroy()
    })
  })

  // Opening, the list stands its time in the middle; walking, it scrolls no more than it must.
  let wasOpen = false
  $effect(() => {
    const time = snapshot.highlighted
    const opening = isOpen && !wasOpen
    wasOpen = isOpen
    if (!isOpen || !time) return
    untrack(() =>
      queueMicrotask(() => {
        const item = document.getElementById(api.ids.item(time))
        if (opening) scrollIntoCenter(item, contentEl)
        else scrollIntoViewIfNeeded(item, contentEl)
      })
    )
  })
</script>

<div {...api.rootProps}>
  {#if label && !embedded}<label {...api.labelProps}>{label}</label>{/if}
  <div bind:this={controlEl} {...api.controlProps}>
    <input bind:this={inputEl} {...mergeProps(api.inputProps, form.field.controlProps)} />
    <button {...api.triggerProps}><span {...api.triggerIconProps}></span></button>
  </div>
  {#if api.invalid}<span {...api.errorProps}>{api.errorText}</span>{/if}
  <span {...form.field.errorProps}>{form.error}</span>
  {#if name}<input {...api.hiddenInputProps} />{/if}
  <div bind:this={positionerEl} {...api.positionerProps}>
    <div bind:this={contentEl} {...api.contentProps}>
      {#if snapshot.open}
        {#each api.times as { time, label: words } (time)}<div {...api.getItemProps(time)}>{words}</div>{/each}
      {/if}
    </div>
  </div>
</div>
