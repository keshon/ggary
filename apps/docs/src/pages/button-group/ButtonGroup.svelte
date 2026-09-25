<script lang="ts">
  import { Button, ButtonGroup, Icon, Menu } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { runMenu } from './data'

  const EMPHASES = ['high', 'medium', 'low', 'minimal'] as const
  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    {#each EMPHASES as emphasis (emphasis)}
      <Specimen label={`emphasis="${emphasis}"`}>
        <ButtonGroup>
          <Button {emphasis}>Run</Button>
          <Button {emphasis}>Schedule</Button>
        </ButtonGroup>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}>
        <ButtonGroup {size}>
          <Button {size} emphasis="medium">Left</Button>
          <Button {size} emphasis="medium">Centre</Button>
          <Button {size} emphasis="medium">Right</Button>
        </ButtonGroup>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled">
      <ButtonGroup>
        <Button emphasis="medium">Run</Button>
        <Button emphasis="medium" disabled>Schedule</Button>
      </ButtonGroup>
    </Specimen>
    <Specimen label="loading">
      <ButtonGroup>
        <Button emphasis="medium" loading>Run</Button>
        <Button emphasis="medium">Schedule</Button>
      </ButtonGroup>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={`label="History", icon only`}>
      <ButtonGroup label="History">
        <Button emphasis="medium" aria-label="Undo"><Icon name="undo" /></Button>
        <Button emphasis="medium" aria-label="Redo"><Icon name="redo" /></Button>
      </ButtonGroup>
    </Specimen>
    <Specimen label="icon + label">
      <ButtonGroup>
        <Button emphasis="medium"><Icon name="download" /> Export</Button>
        <Button emphasis="medium"><Icon name="share" /> Share</Button>
      </ButtonGroup>
    </Specimen>
    <Specimen label="Button + Menu">
      <ButtonGroup>
        <Button emphasis="high">Run</Button>
        <span>
          <Menu items={runMenu} label="Run options" placement="bottom-end">
            {#snippet trigger(props)}
              <Button emphasis="high" aria-label="Run options" {...props}><Icon name="chevron-down" /></Button>
            {/snippet}
          </Menu>
        </span>
      </ButtonGroup>
    </Specimen>
  {/snippet}
</DemoPage>
