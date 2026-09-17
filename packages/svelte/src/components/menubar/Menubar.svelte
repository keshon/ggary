<script lang="ts">
  import { connect, createMenubarMachine, type MenubarMenu, type MenubarSelectDetails } from '@ggary/core/menubar'
  import { attachMenubarKeys, rovingFocus, svelteNormalizer, uid } from '@ggary/core'
  import { untrack } from 'svelte'
  import MenuContent from '../menu/MenuContent.svelte'

  type Props = {
    /** The bar's menus. A label may mark its access key with `&`: `&File`. */
    menus: MenubarMenu[]
    /** Called with the item's value when the user activates it, in any menu at any depth. */
    onSelect?: (value: string, details: MenubarSelectDetails) => void
    /** Called with the value of the menu that opened, or null when the bar closes. */
    onOpenChange?: (menu: string | null) => void
    /** The bar's accessible name, such as "Application". */
    label?: string
    /** Page-wide keys: Alt+key opens a menu by its access key, a held Alt underlines them, F10 goes to the bar. */
    mnemonics?: boolean
    /** Close after an item is activated. Default true; an item can override it. */
    closeOnSelect?: boolean
  }

  let { menus, onSelect, onOpenChange, label, mnemonics = false, closeOnSelect }: Props = $props()

  const id = uid('gg-menubar')
  const machine = untrack(() =>
    createMenubarMachine({
      id,
      menus,
      closeOnSelect,
      onSelect: (value, details) => onSelect?.(value, details),
      onOpenChange: (menu) => onOpenChange?.(menu),
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label, mnemonics }))

  $effect(() => machine.send({ type: 'SYNC_MENUS', menus }))
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', closeOnSelect }))

  // The tab stop moves with the arrows while no menu is open; focus follows it,
  // but only when it is already on the bar.
  let root: HTMLDivElement
  $effect(() => {
    const { focusIndex, openIndex } = snapshot
    untrack(() => {
      if (openIndex === -1 && root.contains(document.activeElement)) rovingFocus(document, api.ids.item(focusIndex))
    })
  })

  $effect(() => {
    if (!mnemonics) return
    return attachMenubarKeys(document, {
      onMnemonic: (key, code) => {
        const before = machine.getState()
        machine.send({ type: 'MNEMONIC', key, code })
        return machine.getState() !== before
      },
      onShowMnemonics: (show) => machine.send({ type: 'SHOW_MNEMONICS', show }),
      onFocusBar: () => {
        // Focus first, then close: a menu that closes with focus outside it hands nothing back.
        document.getElementById(untrack(() => api.ids.item(0)))?.focus()
        machine.send({ type: 'ENTER_BAR' })
      },
    })
  })
</script>

<div bind:this={root} {...api.rootProps}>
  {#each menus as menu, index (menu.value)}
    {@const text = api.labelOf(menu)}
    <button {...api.getItemProps(menu, index)}>
      <span {...api.getItemTextProps()}>{text.before}{#if text.key}<span {...api.mnemonicProps}>{text.key}</span>{/if}{text.after}</span>
    </button>
    {#if snapshot.openIndex === index}
      {#key snapshot.menu.id}
        <MenuContent
          api={api.menu}
          getState={() => machine.getState().menu}
          reference={() => document.getElementById(api.ids.item(index))}
        />
      {/key}
    {/if}
  {/each}
</div>
