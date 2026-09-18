<script lang="ts">
  import { connect, createFieldMachine } from '@ggary/core/field'
  import { onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { setContext, untrack, type Snippet } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from './context'
  import { useFormField } from '../form/context.svelte'

  type Props = {
    label?: string
    hint?: string
    /** Shown when the field is invalid. Absent, the control's native message is used. */
    error?: string
    invalid?: boolean
    required?: boolean
    disabled?: boolean
    readOnly?: boolean
    /** The control's name, inside a Form: the Field shows the error the form's rules or its server hold for it. */
    name?: string
    children: Snippet
  }

  let { label, hint, error: ownError, invalid: ownInvalid, required, disabled, readOnly, name, children }: Props = $props()

  const id = uid('gg-field')

  // The form's error for this name stands over the Field's own, and shows at once, as an owner's does.
  const form = useFormField(() => name, () => `${id}-control`, () => label)
  const invalid = $derived(ownInvalid || !!form.error)
  const error = $derived(form.error ?? ownError)

  // Built once from the props at mount; they reach it afterwards through SYNC.
  const machine = untrack(() => createFieldMachine({ id, invalid, required, disabled, readOnly }))

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { hint: hint != null, error }))

  $effect(() => machine.send({ type: 'SYNC', invalid, required, disabled, readOnly }))

  // A reset form starts over: no error until the user leaves the control again.
  let root: HTMLDivElement
  $effect(() => onFormReset(root, () => machine.send({ type: 'RESET' })))

  setContext<FieldContext>(FIELD_CONTEXT, {
    get control() {
      return api.control
    },
  })
</script>

<div bind:this={root} {...api.rootProps}>
  {#if label != null}
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label {...api.labelProps}>{label}</label>
  {/if}
  {@render children()}
  {#if hint != null}
    <div {...api.hintProps}>{hint}</div>
  {/if}
  <div {...api.errorProps}>{api.errorText}</div>
</div>
