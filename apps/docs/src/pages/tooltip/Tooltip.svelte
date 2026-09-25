<script lang="ts">
  import { Button, Icon, Tooltip } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'

  const PLACEMENTS = ['top', 'bottom', 'left', 'right'] as const
</script>

<DemoPage>
  {#snippet variants()}
    {#each PLACEMENTS as placement (placement)}
      <Specimen label={`placement="${placement}" open`}>
        <Tooltip open {placement} content="Bold (Ctrl+B)">
          {#snippet trigger(props)}<Button emphasis="minimal" aria-label="Bold" {...props}><b>B</b></Button>{/snippet}
        </Tooltip>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled">
      <Tooltip disabled content="Italic (Ctrl+I)">
        {#snippet trigger(props)}<Button emphasis="minimal" aria-label="Italic" {...props}><i>I</i></Button>{/snippet}
      </Tooltip>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="trigger, on an icon button">
      <Tooltip content="Settings">
        {#snippet trigger(props)}<Button emphasis="low" aria-label="Settings" {...props}><Icon name="settings" /></Button>{/snippet}
      </Tooltip>
    </Specimen>
  {/snippet}
</DemoPage>
