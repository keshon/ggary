<script lang="ts">
  import { Field, Input } from '../../../packages/svelte/src/index'

  let { input = {}, ...field }: { input?: Record<string, unknown>; [key: string]: unknown } = $props()
</script>

<Field {...field}>
  <Input {...input} />
</Field>
