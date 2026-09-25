<script lang="ts">
  import { Button, Combobox, DatePicker, Field, Form, FormSummary, Input, Select, Stack } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { companies, stages } from '../../data/inputs-pickers'
  import { dealRules, saveDeal, submitOnLoad } from './data'
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label="onSubmit · FormSummary" wide>
      <div {@attach submitOnLoad}>
        <Form validate={dealRules} onSubmit={saveDeal}>
          <Stack>
            <FormSummary />
            <Field name="title" label="Deal title"><Input name="title" required defaultValue="Annual licence" /></Field>
            <Combobox name="company" label="Company" items={companies} defaultValue="acme" />
            <Select name="stage" label="Stage" items={stages} defaultValue="talks" />
            <DatePicker name="due" label="Close by" locale="en-GB" defaultValue="2026-11-30" />
            <Button emphasis="high" type="submit">Create deal</Button>
          </Stack>
        </Form>
      </div>
    </Specimen>
    <Specimen label="validate · FormSummary" wide>
      <div {@attach submitOnLoad}>
        <Form validate={dealRules} onSubmit={saveDeal}>
          <Stack>
            <FormSummary />
            <Field name="title" label="Deal title" error="Give the deal a title"><Input name="title" required /></Field>
            <Combobox name="company" label="Company" items={companies} placeholder="Type to search" />
            <Select name="stage" label="Stage" items={stages} defaultValue="offer" />
            <Field name="amount" label="Amount, €" hint="Required once an offer is sent">
              <Input name="amount" type="number" min={0} step={1000} />
            </Field>
            <DatePicker name="due" label="Close by" locale="en-GB" />
            <Field name="contact" label="Contact email" error="Enter a valid email address">
              <Input name="contact" type="email" defaultValue="anna.petrova@" />
            </Field>
            <Button emphasis="high" type="submit">Create deal</Button>
          </Stack>
        </Form>
      </div>
    </Specimen>
  {/snippet}
</DemoPage>
