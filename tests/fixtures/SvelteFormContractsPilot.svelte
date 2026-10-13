<script lang="ts">
 import Form from '../../packages/svelte/src/components/form/Form.svelte'
 import Field from '../../packages/svelte/src/components/field/Field.svelte'
 import Fieldset from '../../packages/svelte/src/components/fieldset/Fieldset.svelte'
 import NumberField from '../../packages/svelte/src/components/number-field/NumberField.svelte'
 let submissions = $state(0)
</script>
<Form onSubmit={async () => { submissions++; return { errors: { count: 'Server rejected count' } } }}>
 <Field label="Count" name="count" hint="Choose between one and ten" required>
  <NumberField name="count" defaultValue={4} min={1} max={10} axis="X" />
 </Field>
 <Fieldset disabled legend="Disabled controls">
  <NumberField label="Blocked count" name="blocked" defaultValue={5} axis="Y" />
 </Fieldset>
 <button type="submit">Save</button>
 <button type="reset">Reset</button>
 <output aria-label="Submission count">{submissions}</output>
</Form>
