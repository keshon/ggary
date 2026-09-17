<script lang="ts">
  import { connect, createFieldMachine } from '@ggary/core/field'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { setContext, untrack, type Snippet } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from './context'

  type Props = {
    label?: string
    hint?: string
    /** Shown when the field is invalid. Absent, the control's native message is used. */
    error?: string
    invalid?: boolean
    required?: boolean
    disabled?: boolean
    readOnly?: boolean
    children: Snippet
  }

  let { label, hint, error, invalid, required, disabled, readOnly, children }: Props = $props()

  const id = uid('gg-field')

  // Built once from the props at mount; they reach it afterwards through SYNC.
  const machine = untrack(() => createFieldMachine({ id, invalid, required, disabled, readOnly }))

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { hint: hint != null, error }))

  $effect(() => machine.send({ type: 'SYNC', invalid, required, disabled, readOnly }))

  setContext<FieldContext>(FIELD_CONTEXT, {
    get control() {
      return api.control
    },
  })
</script>

<div {...api.rootProps}>
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
