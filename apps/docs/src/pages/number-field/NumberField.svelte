<script lang="ts">
  import { Field, NumberField } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'

  const SIZES = ['sm', 'md', 'lg'] as const
  const AXES = [
    ['X', 120],
    ['Y', 48],
    ['Z', 0],
  ] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="label"><NumberField label="Retries" min={0} max={10} defaultValue={3} /></Specimen>
    <Specimen label={`axis="X"`}><NumberField axis="X" label="Position X" defaultValue={120} /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><NumberField {size} label={`Retries, ${size}`} defaultValue={3} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="placeholder"><NumberField label="Retries" placeholder="Not set" /></Specimen>
    <Specimen label="disabled"><NumberField disabled label="Retries" defaultValue={3} /></Specimen>
    <Specimen label="readOnly"><NumberField readOnly label="Retries" defaultValue={3} /></Specimen>
    <Specimen label="invalid"><NumberField invalid label="Retries" max={10} defaultValue={14} /></Specimen>
    <Specimen label="required, in a Field">
      <Field label="Agents" hint="1 to 12" required><NumberField min={1} max={12} placeholder="How many" /></Field>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={`axis="X", "Y", "Z"`}>
      {#each AXES as [axis, value] (axis)}
        <NumberField {axis} label={`Position ${axis}`} defaultValue={value} />
      {/each}
    </Specimen>
    <Specimen label={"in a Field, step={0.01}"}>
      <Field label="Opacity" hint="Between 0 and 1, in hundredths"><NumberField step={0.01} min={0} max={1} defaultValue={0.5} /></Field>
    </Specimen>
  {/snippet}
</DemoPage>
