<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, createQueueMachine, type QueueWordsInput, type TaskItem } from '@ggary/core/task'
  import { rovingFocus, svelteNormalizer, uid } from '@ggary/core'
  import { untrack } from 'svelte'

  type Props = {
    tasks: TaskItem[]
    /** The queue's accessible name. */
    label?: string
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string | null
    defaultValue?: string | null
    onValueChange?: (value: string | null) => void
    /** The fixed text of a row's name and of the live region. */
    words?: QueueWordsInput
  }

  /**
   * The queue of an agent's tasks: flat rows, hundreds of them, one tab stop
   * for the list and the arrows inside it. The selection follows the focus.
   */
  let { tasks, label, value = $bindable(), defaultValue, onValueChange, words: ownWords }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'queue', ownWords))

  const id = uid('gg-queue')

  // Uncontrolled at heart, as `bind:value` is: a choice moves the queue and
  // writes the binding, and a new `value` from outside arrives through SYNC_VALUE.
  const machine = untrack(() =>
    createQueueMachine({
      id,
      tasks,
      defaultValue: value !== undefined ? value : defaultValue,
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label, words }))

  $effect(() => machine.send({ type: 'SYNC_TASKS', tasks }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  })

  // Roving focus moves only when the machine asks (the nonce), never on a re-render.
  let lastFocusNonce = 0
  $effect(() => {
    const { focusNonce, focusValue } = api
    if (focusNonce === 0 || focusNonce === lastFocusNonce || focusValue === null) return
    lastFocusNonce = focusNonce
    untrack(() => rovingFocus(document, api.ids.task(focusValue)))
  })
</script>

<div {...api.rootProps}>
  {#each api.tasks as task (task.value)}
    <div {...api.getTaskProps(task)}>
      <span {...api.getGutterProps()}><span {...api.getDotProps()}></span></span>
      <span {...api.getMainProps()}>
        <span {...api.getTitleProps(task)}>{task.title}</span>
        {#if task.detail}<span {...api.getSubProps()}>{task.detail}</span>{/if}
      </span>
      {#if task.meta}<span {...api.getMetaProps()}>{task.meta}</span>{/if}
    </div>
  {/each}
</div>
<div {...api.statusProps}>{api.announcement ?? ''}</div>
