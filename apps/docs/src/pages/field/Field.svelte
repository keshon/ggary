<script lang="ts">
  import { Checkbox, Field, Input, InputGroup, NumberField, Switch, Textarea } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="label">
      <Field label="Full name"><Input name="name" autoComplete="name" /></Field>
    </Specimen>
    <Specimen label="label hint">
      <Field label="Full name" hint="As it appears on your ID"><Input name="name" autoComplete="name" /></Field>
    </Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="required">
      <Field label="Email" hint="The receipt goes here" required><Input type="email" placeholder="you@example.com" /></Field>
    </Specimen>
    <Specimen label="invalid error">
      <Field label="Username" hint="Letters and digits" error="That username is taken" invalid><Input defaultValue="garry" /></Field>
    </Specimen>
    <Specimen label="disabled">
      <Field label="Company" hint="Locked while an invoice is open" disabled><Input defaultValue="Atlas Ltd" /></Field>
    </Specimen>
    <Specimen label="readOnly">
      <Field label="Invoice" hint="Selectable, copyable, not editable" readOnly><Input defaultValue="INV-2041" /></Field>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="Field + Textarea">
      <Field label="About you" hint="Optional, up to 280 characters"><Textarea rows={3} maxLength={280} /></Field>
    </Specimen>
    <Specimen label="Field + NumberField">
      <Field label="Opacity" hint="Between 0 and 1, in hundredths"><NumberField step={0.01} min={0} max={1} defaultValue={0.5} /></Field>
    </Specimen>
    <Specimen label="Field + InputGroup">
      <Field label="Budget" hint="Per agent, in dollars an hour">
        <InputGroup prefix="$" suffix="per hour"><Input type="number" defaultValue="12" min={0} /></InputGroup>
      </Field>
    </Specimen>
    <Specimen label="Field + Switch">
      <Field label="Notifications" hint="Takes effect immediately"><Switch defaultChecked>Email me</Switch></Field>
    </Specimen>
    <Specimen label="Field invalid error + Checkbox">
      <Field error="Accept the terms to continue" invalid required><Checkbox>I accept the terms</Checkbox></Field>
    </Specimen>
  {/snippet}
</DemoPage>
