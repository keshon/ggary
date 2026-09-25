<script lang="ts">
  import { CheckboxGroup, Field, Fieldset, Input, RadioGroup } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { frequencies, notifications, plans } from './data'
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="required · invalid · error" wide>
      <Fieldset legend="Plan" hint="You can change it at any time" error="Choose a plan" required invalid>
        <RadioGroup name="plan" orientation="horizontal" items={plans} />
      </Fieldset>
    </Specimen>
    <Specimen label="disabled" wide>
      <Fieldset legend="Billing address" hint="Locked while an invoice is open" disabled>
        <Field label="Company"><Input defaultValue="Atlas Ltd" /></Field>
        <Field label="VAT number"><Input defaultValue="GB123456789" /></Field>
      </Fieldset>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="CheckboxGroup + RadioGroup" wide>
      <Fieldset legend="Notifications" hint="Sent to your work address">
        <CheckboxGroup name="notify" defaultValue={['mentions', 'replies']} items={notifications} />
        <RadioGroup label="Frequency" name="frequency" defaultValue="instant" items={frequencies} />
      </Fieldset>
    </Specimen>
    <Specimen label="Field" wide>
      <Fieldset legend="Billing address">
        <Field label="Company"><Input defaultValue="Atlas Ltd" /></Field>
        <Field label="VAT number" hint="Starts with the country code"><Input defaultValue="GB123456789" /></Field>
      </Fieldset>
    </Specimen>
  {/snippet}
</DemoPage>
