<script lang="ts">
  import { Field, Input, Textarea } from '../../../packages/svelte/src/index'

  let {
    input = {},
    textarea,
    ...field
  }: { input?: Record<string, unknown>; textarea?: Record<string, unknown>; [key: string]: unknown } = $props()
</script>

<Field {...field}>
  {#if textarea}
    <Textarea {...textarea} />
  {:else}
    <Input {...input} />
  {/if}
</Field>
