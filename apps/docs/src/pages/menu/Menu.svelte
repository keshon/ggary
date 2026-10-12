<script lang="ts">
  import { Button, Menu } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { applyView, documentMenu, initialView, viewMenu } from '../../data/actions'

  // The view menu stays open as it is used: its toggles are the owner's, and it answers them.
  let view = $state(initialView)
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="Actions">
      <Menu items={documentMenu}>
        {#snippet trigger(props)}<Button {...props}>Document</Button>{/snippet}
      </Menu>
    </Specimen>
    <Specimen label={"closeOnSelect={false}"}>
      <Menu label="View options" closeOnSelect={false} items={viewMenu(view)} onSelect={(value, { checked }) => (view = applyView(view, value, checked))}>
        {#snippet trigger(props)}<Button emphasis="low" {...props}>View</Button>{/snippet}
      </Menu>
    </Specimen>
  {/snippet}
</DemoPage>
