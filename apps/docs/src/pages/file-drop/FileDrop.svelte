<script lang="ts">
  import { Field, FileDrop } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { holdFileOver } from './data'

  const zone = { name: 'import', accept: '.json,.csv', multiple: true, hint: 'JSON or CSV · up to 20 MB' }
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="hint" wide><FileDrop {...zone} /></Specimen>
    <Specimen label="files" wide><FileDrop {...zone} files={['leads-2026-09.csv', 'contacts.json']} /></Specimen>
    <Specimen label="dragging" wide>
      <div {@attach holdFileOver}><FileDrop {...zone} /></div>
    </Specimen>
    <Specimen label="disabled" wide><FileDrop {...zone} disabled /></Specimen>
    <Specimen label="invalid" wide><FileDrop {...zone} invalid /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="Field + FileDrop · invalid" wide>
      <Field label="Leads to import" error="Choose a file to import" invalid required>
        <FileDrop {...zone} required />
      </Field>
    </Specimen>
  {/snippet}
</DemoPage>
