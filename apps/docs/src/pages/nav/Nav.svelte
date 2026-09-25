<script lang="ts">
  import { Nav } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { decoratedGroups, groups, withSections } from './data'

  // Opened by the reader, not by the reading: the sections stay open though none is current.
  let open = $state<Record<string, boolean>>({ '#/menu': true })
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="groups"><Nav label="Sections" {groups} /></Specimen>
    <Specimen label="icon · count"><Nav label="Sections" groups={decoratedGroups} /></Specimen>
    <Specimen label="numbered"><Nav label="Sections" numbered {groups} /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="items"><Nav label="Components" groups={withSections('#/button')} /></Specimen>
    <Specimen label="items · current"><Nav label="Components" groups={withSections('#/context-menu')} /></Specimen>
    <Specimen label="items · open"><Nav label="Components" groups={withSections('#/button')} {open} onOpenChange={(href, next) => (open = { ...open, [href]: next })} /></Specimen>
  {/snippet}
</DemoPage>
