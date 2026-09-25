<script lang="ts">
  import { Badge, Button, Icon, Toolbar, ToolbarSeparator, ToolbarSpacer } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`label="Edit"`}>
      <Toolbar label="Edit">
        <Button size="sm" emphasis="minimal" aria-label="Cut"><Icon name="cut" /></Button>
        <Button size="sm" emphasis="minimal" aria-label="Copy"><Icon name="copy" /></Button>
        <Button size="sm" emphasis="minimal" aria-label="Paste"><Icon name="paste" /></Button>
      </Toolbar>
    </Specimen>
    <Specimen label={`label="Zoom" orientation="vertical"`}>
      <Toolbar label="Zoom" orientation="vertical">
        <Button size="sm" emphasis="minimal" aria-label="Zoom in"><Icon name="zoom-in" /></Button>
        <Button size="sm" emphasis="minimal" aria-label="Zoom out"><Icon name="zoom-out" /></Button>
        <ToolbarSeparator />
        <Button size="sm" emphasis="minimal" aria-label="Fit to screen"><Icon name="expand" /></Button>
      </Toolbar>
    </Specimen>
    <Specimen label="no label">
      <Toolbar>
        <Button size="sm" emphasis="low">Filter</Button>
        <Button size="sm" emphasis="low">Sort</Button>
      </Toolbar>
    </Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled">
      <Toolbar label="History">
        <Button size="sm" emphasis="minimal" aria-label="Undo"><Icon name="undo" /></Button>
        <Button size="sm" emphasis="minimal" aria-label="Redo" disabled><Icon name="redo" /></Button>
      </Toolbar>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="ToolbarSeparator · ToolbarSpacer" wide>
      <Toolbar label="Run tools">
        <Button size="sm" emphasis="minimal">Filter</Button>
        <Button size="sm" emphasis="minimal">Sort</Button>
        <ToolbarSeparator />
        <Button size="sm" emphasis="minimal">Export</Button>
        <ToolbarSpacer />
        <Badge tone="running">7 running</Badge>
      </Toolbar>
    </Specimen>
  {/snippet}
</DemoPage>
