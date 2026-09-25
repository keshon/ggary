<script lang="ts">
  import { Menubar } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { appMenus, applyView, initialView } from '../../data/actions'
  import { stageMnemonics, stageOpen } from './data'

  let view = $state(initialView)
  const menus = $derived(appMenus(view))
  const onSelect = (value: string, { checked }: { checked?: boolean }) => (view = applyView(view, value, checked))

  let open = $state<HTMLDivElement | null>(null)
  $effect(() => {
    const host = open
    if (host) requestAnimationFrame(() => stageOpen(host, 'file'))
  })
  $effect(() => {
    requestAnimationFrame(stageMnemonics)
  })
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="disabled" wide><Menubar label="Application" {menus} {onSelect} /></Specimen>
    <Specimen label="mnemonics" wide><Menubar label="Application" mnemonics {menus} {onSelect} /></Specimen>
    <Specimen label="open" wide>
      <div bind:this={open}><Menubar label="Application" {menus} {onSelect} /></div>
    </Specimen>
  {/snippet}
</DemoPage>
