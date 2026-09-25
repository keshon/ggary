<script lang="ts">
  import { Checkbox, Field, Stack } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { notifyItems } from '../../data/inputs-basic'

  /** One checkbox over three: checked when all are, indeterminate when some are. */
  let on = $state<string[]>(['mentions'])
  const all = $derived(on.length === notifyItems.length ? true : on.length > 0 ? 'indeterminate' : false)
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="unchecked"><Checkbox>Keep logs</Checkbox></Specimen>
    <Specimen label="defaultChecked"><Checkbox defaultChecked>Keep logs</Checkbox></Specimen>
    <Specimen label={`defaultChecked="indeterminate"`}><Checkbox defaultChecked="indeterminate">All notifications</Checkbox></Specimen>
    <Specimen label="disabled"><Checkbox disabled>Keep logs</Checkbox></Specimen>
    <Specimen label="disabled defaultChecked"><Checkbox disabled defaultChecked>Keep logs</Checkbox></Specimen>
    <Specimen label="readOnly defaultChecked"><Checkbox readOnly defaultChecked>Keep logs</Checkbox></Specimen>
    <Specimen label="readOnly"><Checkbox readOnly>Keep logs</Checkbox></Specimen>
    <Specimen label="invalid"><Checkbox invalid>I accept the terms</Checkbox></Specimen>
    <Specimen label="required, in a Field">
      <Field label="Terms" required><Checkbox>I accept the terms</Checkbox></Field>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="no label, aria-label"><Checkbox aria-label="Select row" defaultChecked /></Specimen>
    <Specimen label={`select all, over three`}>
      <Stack gap="tight">
        <Checkbox checked={all} onCheckedChange={(next) => (on = next ? notifyItems.map((item) => item.value) : [])}>All notifications</Checkbox>
        {#each notifyItems as item (item.value)}
          <Checkbox checked={on.includes(item.value)} onCheckedChange={(next) => (on = next ? [...on, item.value] : on.filter((value) => value !== item.value))}>{item.label}</Checkbox>
        {/each}
      </Stack>
    </Specimen>
    <Specimen label="in a Field, invalid error">
      <Field error="Accept the terms to continue" invalid required><Checkbox>I accept the terms</Checkbox></Field>
    </Specimen>
  {/snippet}
</DemoPage>
