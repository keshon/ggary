<script lang="ts">
  import type { TabItem } from '@ggary/core/tabs'
  import { Tabs } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { openFiles, openFilesModified, panels, properties, propertiesWithPhysics } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const
  // Closing a document tab asks the owner, who removes it.
  let files = $state(openFiles)
  let filesModified = $state(openFilesModified)
</script>

{#snippet panel(item: TabItem)}<p>{panels[item.value]}</p>{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label={`variant="sections"`} wide><Tabs label="Object properties" items={properties} /></Specimen>
    <Specimen label={`variant="documents"`} wide>
      <Tabs variant="documents" label="Open files" items={files} onClose={(value) => (files = files.filter((item) => item.value !== value))} />
    </Specimen>
    <Specimen label={`orientation="vertical"`} wide><Tabs label="Object properties" orientation="vertical" items={properties} {panel} /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Tabs label="Object properties" {size} items={properties} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled" wide><Tabs label="Object properties" items={propertiesWithPhysics} /></Specimen>
    <Specimen label="modified" wide>
      <Tabs variant="documents" label="Open files" items={filesModified} onClose={(value) => (filesModified = filesModified.filter((item) => item.value !== value))} />
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="panels" wide><Tabs label="Object properties" items={properties} defaultValue="material" {panel} /></Specimen>
  {/snippet}
</DemoPage>
