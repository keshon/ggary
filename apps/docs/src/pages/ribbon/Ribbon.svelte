<script lang="ts">
  import type { RibbonItem } from '@ggary/core/ribbon'
  import { ToolbarButton, Icon, Ribbon, RibbonGroup, RibbonSeparator, RibbonTool, SegmentedControl, Select } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { levels, overflowGroups, sceneTabs, sceneTabsWithLocked, snapModes, toolTabs } from './data'
</script>

{#snippet panel(item: RibbonItem)}
  {#if item.value === 'modify'}
    <RibbonGroup label="Deform">
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Bend"><Icon name="edit" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Twist"><Icon name="redo" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Taper"><Icon name="filter" /></ToolbarButton>
    </RibbonGroup>
    <RibbonSeparator />
    <RibbonGroup managed={false} label="Snap">
      <SegmentedControl size="sm" label="Snap" items={snapModes} defaultValue="grid" />
    </RibbonGroup>
  {:else if item.value === 'animate'}
    <RibbonGroup label="Playback">
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Play"><Icon name="play" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Stop"><Icon name="stop" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Skip"><Icon name="skip" /></ToolbarButton>
    </RibbonGroup>
    <RibbonSeparator />
    <RibbonGroup managed={false} label="Range">
      <Select size="sm" label="Range" items={levels} defaultValue="mid" />
    </RibbonGroup>
  {:else}
    <RibbonGroup label="Create">
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Box"><Icon name="grid" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Sphere"><Icon name="globe" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Cylinder"><Icon name="database" /></ToolbarButton>
    </RibbonGroup>
    <RibbonSeparator />
    <RibbonGroup managed={false} label="Level">
      <Select size="sm" label="Level" items={levels} defaultValue="base" />
    </RibbonGroup>
    <RibbonSeparator />
    <RibbonGroup label="History">
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Undo"><Icon name="undo" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Redo"><Icon name="redo" /></ToolbarButton>
    </RibbonGroup>
  {/if}
{/snippet}

{#snippet toolPanel(item: RibbonItem)}
  {#if item.value === 'model'}
    <RibbonGroup label="Create">
      <RibbonTool>
        <ToolbarButton size="sm" emphasis="minimal"><Icon name="grid" size="lg" />Box</ToolbarButton>
      </RibbonTool>
      <RibbonTool>
        <ToolbarButton size="sm" emphasis="minimal"><Icon name="globe" size="lg" />Sphere</ToolbarButton>
      </RibbonTool>
      <RibbonTool>
        <ToolbarButton size="sm" emphasis="minimal"><Icon name="database" size="lg" />Cylinder</ToolbarButton>
      </RibbonTool>
    </RibbonGroup>
    <RibbonSeparator />
    <RibbonGroup managed={false} label="Level">
      <Select size="sm" label="Level" items={levels} defaultValue="base" />
    </RibbonGroup>
  {:else if item.value === 'modify'}
    <RibbonGroup label="Deform">
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Bend"><Icon name="edit" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Twist"><Icon name="redo" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Taper"><Icon name="filter" /></ToolbarButton>
    </RibbonGroup>
    <RibbonSeparator />
    <RibbonGroup managed={false} label="Snap">
      <SegmentedControl size="sm" label="Snap" items={snapModes} defaultValue="grid" />
    </RibbonGroup>
  {:else}
    <RibbonGroup label="Playback">
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Play"><Icon name="play" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Stop"><Icon name="stop" /></ToolbarButton>
      <ToolbarButton size="sm" emphasis="minimal" aria-label="Skip"><Icon name="skip" /></ToolbarButton>
    </RibbonGroup>
    <RibbonSeparator />
    <RibbonGroup managed={false} label="Range">
      <Select size="sm" label="Range" items={levels} defaultValue="mid" />
    </RibbonGroup>
  {/if}
{/snippet}

{#snippet overflowPanel(item: RibbonItem)}
  {#each overflowGroups as group, index (group.label)}
    {#if index > 0}<RibbonSeparator />{/if}
    <RibbonGroup label={group.label}>
      {#each group.tools as tool (tool.name)}
        <ToolbarButton size="sm" emphasis="minimal" aria-label={tool.name}><Icon name={tool.icon} /></ToolbarButton>
      {/each}
    </RibbonGroup>
  {/each}
{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label={`label="Scene tools"`} wide>
      <Ribbon label="Scene tools" items={sceneTabs} defaultValue="model" {panel} />
    </Specimen>
    <Specimen label={`variant="cards"`} wide>
      <Ribbon label="Scene tools" variant="cards" items={sceneTabs} defaultValue="model" {panel} />
    </Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled tab" wide>
      <Ribbon label="Scene tools" items={sceneTabsWithLocked} defaultValue="model" {panel} />
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="mixed controls" wide>
      <Ribbon label="Scene tools" items={sceneTabs} defaultValue="modify" {panel} />
    </Specimen>
    <Specimen label="RibbonTool" wide>
      <Ribbon label="Scene tools" variant="cards" items={sceneTabs} defaultValue="model" panel={toolPanel} />
    </Specimen>
    <Specimen label="overflow" wide>
      <Ribbon label="Many tools" items={toolTabs} defaultValue="tools" panel={overflowPanel} />
    </Specimen>
  {/snippet}
</DemoPage>
