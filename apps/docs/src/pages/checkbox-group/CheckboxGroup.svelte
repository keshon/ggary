<script lang="ts">
  import { CheckboxGroup, Fieldset } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { notifyItems } from '../../data/inputs-basic'
  import { withLocked } from './data'

  const ORIENTATIONS = ['vertical', 'horizontal'] as const
</script>

<DemoPage>
  {#snippet variants()}
    {#each ORIENTATIONS as orientation (orientation)}
      <Specimen label={`orientation="${orientation}"`} wide={orientation === 'horizontal'}>
        <CheckboxGroup label="Notifications" {orientation} items={notifyItems} defaultValue={['mentions', 'replies']} />
      </Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="items[].disabled">
      <CheckboxGroup label="Notifications" items={withLocked} defaultValue={['mentions', 'security']} />
    </Specimen>
    <Specimen label="disabled">
      <CheckboxGroup label="Notifications" disabled items={notifyItems} defaultValue={['mentions']} />
    </Specimen>
    <Specimen label="invalid"><CheckboxGroup label="Notifications" invalid items={notifyItems} /></Specimen>
    <Specimen label="required"><CheckboxGroup label="Notifications" required items={notifyItems} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="in a Fieldset, invalid error">
      <Fieldset legend="Notifications" hint="Pick at least one" error="Pick at least one kind" invalid required>
        <CheckboxGroup items={notifyItems} />
      </Fieldset>
    </Specimen>
  {/snippet}
</DemoPage>
