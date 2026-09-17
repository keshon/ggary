<script lang="ts">
  import { connect, type TextareaProps } from '@ggary/core/textarea'
  import { attachAutosize, mergeProps, onFormReset, svelteNormalizer, type Autosize } from '@ggary/core'
  import { getContext, untrack } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from '../field/context'

  type Props = TextareaProps & {
    /** Bindable: `bind:value` is the Svelte way; a one-way `value` works too. */
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    [key: string]: unknown
  }

  let {
    size,
    name,
    placeholder,
    rows,
    minLength,
    maxLength,
    autoComplete,
    disabled,
    readOnly,
    required,
    invalid,
    resize,
    autoResize,
    maxRows,
    value = $bindable(),
    defaultValue,
    onValueChange,
    ...rest
  }: Props = $props()

  untrack(() => {
    if (value === undefined && defaultValue !== undefined) value = defaultValue
  })
  const initial = untrack(() => value)

  const field = getContext<FieldContext | undefined>(FIELD_CONTEXT)

  const api = $derived(
    connect(
      { size, name, placeholder, rows, minLength, maxLength, autoComplete, disabled, readOnly, required, invalid, resize, autoResize, maxRows },
      svelteNormalizer,
      { onValueChange, field: field?.control }
    )
  )

  const attrs = $derived(mergeProps(rest, api.rootProps))

  let element: HTMLTextAreaElement
  // A native form reset rewrites the DOM without an event. Svelte sets these
  // as properties, not the attributes a reset restores to, so the initial state
  // is written back to the binding AND to the element.
  $effect(() =>
    onFormReset(element, () => {
      value = initial
      element.value = initial ?? ''
      autosize?.update()
    })
  )
  // Not state: the effects below must depend on the props, not on this handle.
  let autosize: Autosize | null = null

  $effect(() => {
    if (!autoResize) return
    const instance = untrack(() => attachAutosize(element, { maxRows }))
    autosize = instance
    return () => {
      instance.destroy()
      autosize = null
    }
  })

  $effect(() => {
    const options = { maxRows }
    untrack(() => autosize?.setOptions(options))
  })

  // A value set from outside fires no input event, so nothing re-measured it.
  $effect(() => {
    void value
    untrack(() => autosize?.update())
  })
</script>

<textarea bind:this={element} {...attrs} bind:value></textarea>
