<script lang="ts">
  import { Dialog, Popconfirm, CommandPalette } from '../../packages/svelte/src/index'
  let runs = $state('')
  let focusAtRun = $state('')
  const commands = [{ id: 'branch', label: 'Move card', children: [{ id: 'review', label: 'Review' }] }, { id: 'plain', label: 'Open report' }]
</script>
<button>Before palette</button>
<CommandPalette {commands} onRun={command => { runs = command.id; focusAtRun = document.activeElement?.textContent ?? '' }}>
  {#snippet trigger(props)}<button {...props}>Open palette</button>{/snippet}
</CommandPalette>
<CommandPalette {commands} modal={false} defaultOpen hotkey={false} words={{ label: 'Inline commands' }} />
<Dialog title="Confirmations">
  {#snippet trigger(props)}<button {...props}>Open confirmations</button>{/snippet}
  <Popconfirm title="Delete item?" destructive confirmLabel="Delete" onConfirm={() => Promise.reject(new Error('Item is locked'))}>
    {#snippet trigger(props)}<button {...props}>Ask to delete</button>{/snippet}
  </Popconfirm>
</Dialog>
<output aria-label="Run">{runs}</output>
<output aria-label="Focus at run">{focusAtRun}</output>
