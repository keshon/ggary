<script lang="ts">
  import { connect, createFieldsetMachine } from '@ggary/core/fieldset'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { setContext, untrack, type Snippet } from 'svelte'
  import { FIELDSET_CONTEXT, type FieldsetContext } from './context'

  type Props = {
    legend?: string
    hint?: string
    /** Shown when the group is invalid. Absent, the first failing control's own message is used. */
    error?: string
    invalid?: boolean
    required?: boolean
    disabled?: boolean
    children: Snippet
  }

  let { legend, hint, error, invalid, required, disabled, children }: Props = $props()

  const id = uid('gg-fieldset')
  const machine = untrack(() => createFieldsetMachine({ id, invalid, required, disabled }))

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { legend: legend != null, hint: hint != null, error }))

  $effect(() => machine.send({ type: 'SYNC', invalid, required, disabled }))

  setContext<FieldsetContext>(FIELDSET_CONTEXT, {
    get group() {
      return api.group
    },
  })
</script>

<fieldset {...api.rootProps}>
  {#if legend != null}
    <legend {...api.legendProps}>{legend}</legend>
  {/if}
  <div {...api.contentProps}>
    {@render children()}
  </div>
  {#if hint != null}
    <div {...api.hintProps}>{hint}</div>
  {/if}
  <div {...api.errorProps}>{api.errorText}</div>
</fieldset>
