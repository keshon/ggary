<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import {
    attachPaletteHotkey,
    attachPaletteSource,
    connect,
    createPaletteMachine,
    revealPaletteItem,
    type PaletteCommand,
    type PaletteLoad,
    type PaletteWords,
  } from '@ggary/core/command-palette'
  import { svelteNormalizer, uid, type Dict } from '@ggary/core'
  import { tick, untrack, type Snippet } from 'svelte'
  import { Dialog as Primitive } from 'bits-ui'

  type Props = {
    commands: PaletteCommand[]
    /** Bindable: whether it is open. */
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    /**
     * Over the page, the rest of it inert (default). False shows it in the page
     * instead — beside what is around it, as a palette set into a panel — and a
     * press elsewhere leaves it open.
     */
    modal?: boolean
    /** A command was chosen. It runs after the palette has closed and given the focus back. */
    onRun?: (command: PaletteCommand) => void
    /** Records from a server, under their own heading on the top level: leads, deals, people. */
    load?: PaletteLoad
    /** How long the typing pauses before the server is asked (default 150 ms), and how much must be typed (default 2). */
    loadOptions?: { debounce?: number; minLength?: number }
    /** Ctrl+K, ⌘K on a Mac. A letter for another; false for none. Default 'k'. */
    hotkey?: string | false
    /** An opener of your own: spread the props onto a button. */
    trigger?: Snippet<[Dict]>
    words?: Partial<PaletteWords>
  }

  /** Ctrl+K from anywhere: a field that finds what to do, and Enter does it. */
  let { commands, open = $bindable(), defaultOpen, onOpenChange, modal = true, onRun, load, loadOptions, hotkey = 'k', trigger, words: ownWords }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'commandPalette', ownWords))

  const machine = untrack(() =>
    createPaletteMachine({
      id: uid('gg-palette'),
      commands,
      defaultOpen: open !== undefined ? open : defaultOpen,
      onOpenChange: (next) => {
        open = next
        onOpenChange?.(next)
      },
      onRun: (command) => onRun?.(command),
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  // Effects that attach on open read this, not the snapshot: a new snapshot on every
  // change would detach and attach them again on each key.
  const isOpen = $derived(snapshot.open)
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { words }))

  $effect(() => machine.send({ type: 'SYNC_COMMANDS', commands }))
  $effect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  })
  $effect(() => {
    const key = hotkey
    if (key === false) return
    return untrack(() => attachPaletteHotkey(document, () => machine.send({ type: 'TOGGLE' }), key))
  })
  $effect(() => {
    if (!load) return
    const options = { debounce: loadOptions?.debounce, minLength: loadOptions?.minLength }
    return untrack(() => attachPaletteSource(machine, (query, signal) => load!(query, signal), options))
  })

  let anchor = $state<HTMLElement | null>(null)
  let inheritedStyle = $state('')
  let dir = $state<'ltr' | 'rtl'>('ltr')
  const part = (name: string) => ({ 'data-scope': 'command-palette', 'data-part': name, 'data-backend': 'bits-ui' })
  $effect(() => {
    if (!isOpen || !anchor) return
    const computed = getComputedStyle(anchor)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    dir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${dir};${vars.join(';')}`
  })

  let listEl = $state<HTMLDivElement | null>(null)
  $effect(() => {
    const id = snapshot.highlighted ? api.ids.item(snapshot.highlighted) : null
    untrack(() => revealPaletteItem(listEl, id))
  })
</script>

{#snippet popup()}
<Primitive.Content {...api.contentProps} data-backend="bits-ui" data-modal={modal ? '' : undefined} trapFocus={modal} preventScroll={modal}
  onOpenAutoFocus={event => { event.preventDefault(); void tick().then(() => document.getElementById(api.ids.input)?.focus()) }}
  onEscapeKeydown={event => { event.preventDefault(); machine.send({ type: 'ESCAPE' }) }}
  onInteractOutside={event => { if (!modal) event.preventDefault() }}>
  {#if snapshot.open}
    <div {...api.controlProps}>
      <span {...api.searchIconProps}></span>
      {#each api.pages as page (page.id)}<span {...api.pageProps}>{page.label}</span>{/each}
      <input {...api.inputProps} />
    </div>
    <div bind:this={listEl} {...api.listProps}>
      {#each api.groups as group, index (group.name || `group-${index}`)}
        <div {...api.getGroupProps(group, index)}>
          {#if group.name}<div {...api.getGroupLabelProps(group, index)}>{group.name}</div>{/if}
          {#each group.commands as command (command.id)}
            <div {...api.getItemProps(command)}>
              <span {...api.itemTextProps}>{command.label}{#if command.description}<span {...api.itemDescriptionProps}>{command.description}</span>{/if}</span>
              {#if command.shortcut}<kbd {...api.itemShortcutProps}>{command.shortcut}</kbd>{/if}
              {#if command.children}<span {...api.itemBranchProps}></span>{/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
    {#if api.isEmpty}<p {...api.emptyProps}>{api.status}</p>{/if}
    <div {...api.statusProps}>{api.status}</div>
    <div {...api.footerProps}>
      <span {...api.hintProps}><kbd {...api.keyProps}>↑</kbd><kbd {...api.keyProps}>↓</kbd>{api.words.hintMove}</span>
      <span {...api.hintProps}><kbd {...api.keyProps}>↵</kbd>{api.words.hintRun}</span>
      <span {...api.hintProps}><kbd {...api.keyProps}>Esc</kbd>{api.pages.length > 0 ? api.words.hintBack : api.words.hintClose}</span>
    </div>
  {/if}
</Primitive.Content>
{/snippet}
<Primitive.Root bind:open={() => isOpen, next => machine.send({ type: next ? 'OPEN' : 'CLOSE' })}>
  <div {...part('anchor')} bind:this={anchor} style="display:contents">
    {#if trigger}<Primitive.Trigger type="button" aria-keyshortcuts={hotkey === false ? undefined : `Control+${hotkey.toUpperCase()} Meta+${hotkey.toUpperCase()}`}>
      {#snippet child({ props: triggerProps })}{@render trigger(triggerProps)}{/snippet}
    </Primitive.Trigger>{/if}
  </div>
  {#if modal}
    <Primitive.Portal>
      <div data-scope="dialog" data-part="layer" data-backend="bits-ui" dir={dir} style={inheritedStyle}>
        <Primitive.Overlay {...part('backdrop')} />
        {@render popup()}
      </div>
    </Primitive.Portal>
  {:else}
    <div {...part('inline-host')} dir={dir} style={inheritedStyle}>{@render popup()}</div>
  {/if}
</Primitive.Root>
