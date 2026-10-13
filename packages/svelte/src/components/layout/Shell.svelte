<script lang="ts">
  import { Dialog as Primitive, mergeProps as mergePrimitiveProps } from 'bits-ui'
  import { SHELL_NARROW, connect, createShellMachine, type ShellChangeDetails, type ShellCollapse } from '@ggary/core/shell'
  import { watchMedia, svelteNormalizer, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    /** The application's name at the top of the side column. */
    brand?: Snippet
    /** The side column: a Nav, a Rail. Without it the shell has no column and no drawer. */
    aside?: Snippet
    /** The strip over the work area. */
    header?: Snippet
    /** The status strip along the bottom. */
    footer?: Snippet
    /** The work area: the page's `main`. */
    children: Snippet
    /** What the column becomes on a narrow screen. Default `drawer`. */
    collapse?: ShellCollapse
    /** Bindable: `bind:open`, the drawer. */
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean, details: ShellChangeDetails) => void
    skipLabel?: string
    toggleLabel?: string
    asideLabel?: string
    style?: string
  }

  let {
    brand, aside, header, footer, children, collapse, open = $bindable(), defaultOpen, onOpenChange,
    skipLabel, toggleLabel, asideLabel, style, ...rest
  }: Props & { [key: string]: unknown } = $props()

  const machine = untrack(() =>
    createShellMachine({
      id: uid('gg-shell'),
      defaultOpen: open ?? defaultOpen,
      collapse,
      onOpenChange: (next, details) => {
        open = next
        onOpenChange?.(next, details)
      },
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { skipLabel, toggleLabel, asideLabel }))

  $effect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  })
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', collapse }))

  let toggle = $state<HTMLButtonElement | null>(null)
  let narrow = $state(false)
  $effect(() => {
    if (!window.matchMedia) { narrow = true; return }
    return watchMedia(document, SHELL_NARROW, next => {
      narrow = next
      if (!next && machine.getState().open) machine.send({ type: 'CLOSE', reason: 'resize' })
    })
  })
  let reason: ShellChangeDetails['reason'] = 'toggle'
  const toggleAttrs = $derived.by(() => {
    const { onclick: _toggle, ...attrs } = api.toggleProps
    return attrs
  })
  const hasColumn = $derived(Boolean(brand || aside))
  const modal = $derived(hasColumn && api.drawer && narrow)
</script>

<Primitive.Root open={modal && api.open} onOpenChange={next => {
  if (!modal) return
  machine.send(next ? { type: 'OPEN', reason: 'toggle' } : { type: 'CLOSE', reason })
  reason = 'toggle'
}}>
<div {...rest} {...api.rootProps} data-backend="bits-ui" {style}>
  <a {...api.skipLinkProps}>{api.skipLabel}</a>
  {#if modal}<Primitive.Overlay forceMount hidden={!api.open} data-scope="shell" data-part="backdrop" data-backend="bits-ui" />{/if}
  {#if hasColumn}
    <Primitive.Content forceMount id={api.ids.aside} trapFocus={modal} preventScroll={modal}
      onOpenAutoFocus={event => { if (!modal) event.preventDefault() }}
      onCloseAutoFocus={event => { event.preventDefault(); if (modal) toggle?.focus({ preventScroll: true }) }}
      onEscapeKeydown={event => { if (!modal) event.preventDefault(); else reason = 'escape' }}
      onInteractOutside={event => { if (!modal) event.preventDefault(); else reason = 'outside' }}>
      {#snippet child({ props: primitiveAttrs })}
        <aside {...mergePrimitiveProps(primitiveAttrs, api.asideProps)} data-backend="bits-ui" role={modal ? 'dialog' : 'complementary'} aria-label={asideLabel ?? 'Navigation'} aria-modal={modal && api.open ? 'true' : undefined} aria-labelledby={undefined} aria-describedby={undefined}>
          {#if brand}<div {...api.brandProps}>{@render brand()}</div>{/if}
          {@render aside?.()}
        </aside>
      {/snippet}
    </Primitive.Content>
  {/if}
  <header {...api.headerProps}>
    {#if hasColumn}
      <Primitive.Trigger bind:ref={toggle} {...toggleAttrs} onclick={() => reason = 'toggle'}><span {...api.toggleIconProps}></span></Primitive.Trigger>
    {/if}
    {@render header?.()}
  </header>
  <main {...api.mainProps}>{@render children()}</main>
  {#if footer}<footer {...api.footerProps}>{@render footer()}</footer>{/if}
</div>

</Primitive.Root>
