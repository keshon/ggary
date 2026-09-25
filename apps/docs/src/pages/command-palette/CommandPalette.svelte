<script lang="ts">
  import { Button, CommandPalette, Icon } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { commands, searchCompanies } from './data'
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="defaultOpen" wide>
      <div class="frame">
        <CommandPalette defaultOpen modal={false} hotkey={false} {commands} />
      </div>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={"load, hotkey={false}"}>
      <CommandPalette hotkey={false} {commands} load={searchCompanies} words={{ placeholder: 'Search leads or run a command…', results: 'Leads' }}>
        {#snippet trigger(props)}<Button emphasis="medium" {...props}><Icon name="search" /> Search leads…</Button>{/snippet}
      </CommandPalette>
    </Specimen>
  {/snippet}
</DemoPage>
