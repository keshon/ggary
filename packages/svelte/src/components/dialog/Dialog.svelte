<script lang="ts">
  import {
    connect,
    createDialogMachine,
    type DialogChangeDetails,
    type DialogPlacement,
    type DialogRole,
    type DialogSize,
  } from '@ggary/core/dialog'
  import { attachDialog, svelteNormalizer, uid, type AttachedDialog, type Dict } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    /** Bindable: `bind:open`. A one-way `open` works too. */
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean, details: DialogChangeDetails) => void
    title?: string
    description?: string
    /** The body. Rendered only while open. */
    children?: Snippet
    footer?: Snippet
    /** The opener: `{#snippet trigger(props)}<Button {...props}>Open</Button>{/snippet}` */
    trigger?: Snippet<[Dict]>
    size?: DialogSize
    /** `start` or `end` makes it a sheet at that edge. See also `Sheet`. */
    placement?: DialogPlacement
    modal?: boolean
    role?: DialogRole
    closeOnEscape?: boolean
    closeOnOutside?: boolean
    closeButton?: boolean
    closeLabel?: string
  }

  let {
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    title,
    description,
    children,
    footer,
    trigger,
    size,
    placement,
    modal,
    role,
    closeOnEscape,
    closeOnOutside,
    closeButton = true,
    closeLabel,
  }: Props = $props()

  const id = uid('gg-dialog')

  // Uncontrolled at heart, as `bind:open` is: a request closes the dialog and
  // writes the binding, and a new `open` from outside arrives through SYNC_OPEN.
  const machine = untrack(() =>
    createDialogMachine({
      id,
      defaultOpen: open ?? defaultOpen,
      modal,
      role,
      closeOnEscape,
      closeOnOutside,
      onOpenChange: (next, details) => {
        open = next
        onOpenChange?.(next, details)
      },
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  // Effects that attach on open read this, not the snapshot: a new snapshot on every
  // change would detach and attach them again on each key.
  const isOpen = $derived(snapshot.open)

  const api = $derived(
    connect(snapshot, machine.send, svelteNormalizer, {
      title: title != null,
      description: description != null,
      size,
      placement,
      closeLabel,
    })
  )

  $effect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  })
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', modal, role, closeOnEscape, closeOnOutside }))

  let content: HTMLDialogElement
  // Not state: the effects below depend on the snapshot, not on this handle.
  let attached: AttachedDialog | null = null

  $effect(() => {
    if (!isOpen) return
    const instance = untrack(() => {
      const { modal, closeOnEscape, closeOnOutside } = machine.getState()
      return attachDialog(content, {
        modal,
        closeOnEscape,
        closeOnOutside,
        onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }),
        onNativeClose: (returnValue) => machine.send({ type: 'CLOSE', reason: 'native', returnValue }),
        exclude: [document.getElementById(api.ids.trigger)],
        finalFocus: document.getElementById(api.ids.trigger),
      })
    })
    attached = instance
    return () => {
      instance.destroy()
      attached = null
    }
  })

  $effect(() => {
    const options = { modal: snapshot.modal, closeOnEscape: snapshot.closeOnEscape, closeOnOutside: snapshot.closeOnOutside }
    untrack(() => attached?.update(options))
  })
</script>

{#if trigger}
  {@render trigger(api.triggerProps)}
{/if}
<dialog bind:this={content} {...api.contentProps}>
  {#if snapshot.open}
    {#if title != null || closeButton}
      <header {...api.headerProps}>
        {#if title != null}
          <h2 {...api.titleProps}>{title}</h2>
        {/if}
        {#if description != null}
          <p {...api.descriptionProps}>{description}</p>
        {/if}
        {#if closeButton}
          <button {...api.closeProps}><span {...api.closeIconProps}></span></button>
        {/if}
      </header>
    {/if}
    <div {...api.bodyProps}>
      {@render children?.()}
    </div>
    {#if footer}
      <footer {...api.footerProps}>{@render footer()}</footer>
    {/if}
  {/if}
</dialog>
