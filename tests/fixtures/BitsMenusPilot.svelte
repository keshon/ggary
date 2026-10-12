<script lang="ts">
  import Menu from '../../packages/svelte/src/components/menu/Menu.svelte'
  import ContextMenu from '../../packages/svelte/src/components/context-menu/ContextMenu.svelte'
  import Menubar from '../../packages/svelte/src/components/menubar/Menubar.svelte'
  import Dialog from '../../packages/svelte/src/components/dialog/Dialog.svelte'
  import type { MenuEntry } from '../../packages/core/src/components/menu'
  let grid = $state(false)
  let selected = $state('')
  let selectedMenu = $state('')
  const items = $derived<MenuEntry[]>([
    { value: 'edit', label: 'Edit' }, { value: 'disabled', label: 'Unavailable', disabled: true },
    { type: 'checkbox', value: 'grid', label: 'Show grid', checked: grid, closeOnSelect: false },
    { type: 'submenu', value: 'recent', label: 'Recent', items: [{ value: 'alpha', label: 'Alpha' }, { type: 'submenu', value: 'more', label: 'More', items: [{ value: 'beta', label: 'Beta' }] }] },
    { value: 'docs', label: 'Docs', href: '#docs' },
    { type: 'group', label: 'Empty key', items: [{ type: 'radio', value: '', label: 'Empty radio', closeOnSelect: false }, { type: 'radio', value: 'other', label: 'Other radio', closeOnSelect: false }] },
  ])
  function select(value: string, details: { checked?: boolean }) { selected = value; if (value === 'grid') grid = details.checked ?? false }
</script>
<Menu {items} onSelect={select}>
  {#snippet trigger(props)}<button {...props}>Actions</button>{/snippet}
</Menu>
<ContextMenu {items} onSelect={select}>
  {#snippet trigger(props)}<div {...props} style="padding:30px;border:1px solid">Context target</div>{/snippet}
</ContextMenu>
<Menubar menus={[{ value: 'file', label: '&File', items }, { value: 'view', label: '&View', items: [{ value: 'zoom', label: 'Zoom' }] }, { value: '', label: '&Empty', items: [{ value: 'empty-action', label: 'Empty action' }] }]} label="Application" mnemonics onSelect={(value, details) => { selected = value; selectedMenu = details.menu }} />
<Dialog title="Menu layers">
  {#snippet trigger(props)}<button {...props}>Open menu dialog</button>{/snippet}
  <Menu {items} onSelect={select}>
    {#snippet trigger(props)}<button {...props}>Nested actions</button>{/snippet}
  </Menu>
</Dialog>
<output aria-label="Selection">{selected}</output>
<output aria-label="Selected menu">{selectedMenu}</output>
