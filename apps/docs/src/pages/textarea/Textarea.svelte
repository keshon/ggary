<script lang="ts">
  import { Field, Textarea } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { releaseNotes } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`resize="vertical"`}>
      <Textarea resize="vertical" rows={3} aria-label="Description" placeholder="What changed, and why" />
    </Specimen>
    <Specimen label={`resize="none"`}>
      <Textarea resize="none" rows={3} aria-label="Description" placeholder="What changed, and why" />
    </Specimen>
    <Specimen label={"autoResize maxRows={6}"}>
      <Textarea autoResize rows={2} maxRows={6} aria-label="Release notes" defaultValue={releaseNotes} />
    </Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}>
        <Textarea {size} rows={2} aria-label={`Description, ${size}`} placeholder="What changed, and why" />
      </Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled"><Textarea disabled rows={3} aria-label="Summary" defaultValue="Nightly build, no changes to the API." /></Specimen>
    <Specimen label="readOnly"><Textarea readOnly rows={3} aria-label="Summary" defaultValue="Nightly build, no changes to the API." /></Specimen>
    <Specimen label="invalid"><Textarea invalid rows={3} aria-label="Summary" defaultValue="tbd" /></Specimen>
    <Specimen label="required, in a Field">
      <Field label="Summary" required><Textarea rows={3} placeholder="One line on what this run is for" /></Field>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={"in a Field, maxLength={280}"}>
      <Field label="About you" hint="Optional, up to 280 characters"><Textarea rows={3} maxLength={280} /></Field>
    </Specimen>
  {/snippet}
</DemoPage>
