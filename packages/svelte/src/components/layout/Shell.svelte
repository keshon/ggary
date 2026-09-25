<script lang="ts">
  import { connect, createShellMachine, type ShellChangeDetails, type ShellCollapse } from '@ggary/core/shell'
  import { attachShellDrawer, svelteNormalizer, uid } from '@ggary/core'
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

  let root: HTMLDivElement
  let column = $state<HTMLDivElement>()
  let toggle = $state<HTMLButtonElement>()
  $effect(() => {
    if (!api.open || !column) return
    const aside = column
    return untrack(() => attachShellDrawer(root, aside, toggle ?? null, { onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }) }))
  })

  const hasColumn = $derived(Boolean(brand || aside))
</script>

<div bind:this={root} {...rest} {...api.rootProps} {style}>
  <a {...api.skipLinkProps}>{api.skipLabel}</a>
  {#if hasColumn}
    <div bind:this={column} {...api.asideProps}>
      {#if brand}<div {...api.brandProps}>{@render brand()}</div>{/if}
      {@render aside?.()}
    </div>
  {/if}
  <header {...api.headerProps}>
    {#if hasColumn}
      <button bind:this={toggle} {...api.toggleProps}><span {...api.toggleIconProps}></span></button>
    {/if}
    {@render header?.()}
  </header>
  <main {...api.mainProps}>{@render children()}</main>
  {#if footer}<footer {...api.footerProps}>{@render footer()}</footer>{/if}
</div>
