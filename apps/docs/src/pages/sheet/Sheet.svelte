<script lang="ts">
  import { Button, Field, Input, Select, Sheet, Switch } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { roles } from '../../data/overlays'

  /** Shown with the page, beside it rather than over it, so it can be seen without being opened. */
  const shown = { defaultOpen: true, modal: false, closeOnOutside: false } as const
</script>

{#snippet parameters()}
  <Select label="Model" items={roles} defaultValue="editor" />
  <Field label="Agents" hint="1 to 12"><Input type="number" defaultValue="7" /></Field>
  <Switch defaultChecked>Keep logs</Switch>
{/snippet}

{#snippet apply()}<Button emphasis="high">Apply</Button>{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each ['end', 'start'] as const as side (side)}
      <Specimen label={`side="${side}"`} wide>
        <div class="frame">
          <Sheet {...shown} {side} title="Run parameters" description="Applied to the next run." footer={apply}>{@render parameters()}</Sheet>
        </div>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet sizes()}
    {#each ['sm', 'md', 'lg'] as const as size (size)}
      <Specimen label={`size="${size}"`} wide>
        <div class="frame">
          <Sheet {...shown} {size} title="Run parameters" footer={apply}>{@render parameters()}</Sheet>
        </div>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="trigger">
      <Sheet title="Run parameters" description="Applied to the next run." footer={apply}>
        {#snippet trigger(props)}<Button {...props}>Parameters…</Button>{/snippet}
        {@render parameters()}
      </Sheet>
    </Specimen>
  {/snippet}
</DemoPage>
