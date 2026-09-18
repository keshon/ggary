<script lang="ts">
  import { attachForm, connectForm, createFormMachine, type AttachFormOptions, type FormStatus } from '@ggary/core/form'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { setContext, untrack, type Snippet } from 'svelte'
  import type { HTMLFormAttributes } from 'svelte/elements'
  import { FORM_CONTEXT } from './context.svelte'

  type Props = Omit<HTMLFormAttributes, 'onsubmit'> &
    AttachFormOptions & {
      children?: Snippet
      onStatusChange?: (status: FormStatus) => void
    }

  /**
   * A form that checks itself on submit: the browser's constraints, your
   * `validate` rules, and the errors `onSubmit` returns from a server. Without
   * `onSubmit`, a valid form submits natively, to its `action`.
   */
  let { validate, onSubmit, onStatusChange, children, ...rest }: Props = $props()

  const machine = createFormMachine({ id: uid('gg-form'), onStatusChange: (status) => onStatusChange?.(status) })
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const api = $derived(connectForm(snapshot, svelteNormalizer))
  setContext(FORM_CONTEXT, machine)

  let formEl = $state<HTMLFormElement | null>(null)
  $effect(() => {
    if (!formEl) return
    const form = formEl
    return untrack(() => attachForm(form, machine, () => ({ validate, onSubmit })))
  })
</script>

<form bind:this={formEl} {...rest} {...api.rootProps}>
  {@render children?.()}
</form>
