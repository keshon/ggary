<script lang="ts">
  import { Field, Input, Inserts, Stack, Textarea } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { named, subject, template, variables } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={"items: { value, hint }"} wide>
      <Field label="Notification template">
        <Textarea rows={3} defaultValue={template} />
        <Inserts items={variables} label="Template variables" />
      </Field>
    </Specimen>
    <Specimen label={"items: { value, label }"} wide>
      <Field label="Notification template">
        <Textarea rows={3} defaultValue={template} />
        <Inserts items={named} label="Template variables" />
      </Field>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label={`target="insert-subject"`} wide>
      <Stack gap="tight">
        <Input id="insert-subject" aria-label="Subject" defaultValue={subject} />
        <Inserts items={variables} target="insert-subject" label="Subject variables" />
      </Stack>
    </Specimen>
  {/snippet}
</DemoPage>
