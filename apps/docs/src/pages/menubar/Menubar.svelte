<script lang="ts">
  import { Menubar } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { appMenus, applyView, initialView } from '../../data/actions'

  let view = $state(initialView)
  const menus = $derived(appMenus(view))
  const onSelect = (value: string, { checked }: { checked?: boolean }) => (view = applyView(view, value, checked))

</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="disabled" wide><Menubar label="Application" {menus} {onSelect} /></Specimen>
    <Specimen label="mnemonics" wide><Menubar label="Application" mnemonics {menus} {onSelect} /></Specimen>

  {/snippet}
</DemoPage>
