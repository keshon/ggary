<script lang="ts">
  import { Button, Field, Form, FormSummary, Input, Select } from '../../../packages/svelte/src/index'

  let { summary = true, validate, onSubmit }: Record<string, any> = $props()
  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'member', label: 'Member' },
  ]
</script>

<Form {validate} {onSubmit}>
  {#if summary}<FormSummary />{/if}
  <Field name="email" label="Email"><Input type="email" name="email" required /></Field>
  <Field name="password" label="Password"><Input type="password" name="password" required minlength={8} /></Field>
  <Field name="confirm" label="Confirm password"><Input type="password" name="confirm" /></Field>
  <Select name="role" label="Role" items={roles} />
  <Button type="submit">Create account</Button>
</Form>
