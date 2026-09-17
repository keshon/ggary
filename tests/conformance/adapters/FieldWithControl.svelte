<script lang="ts">
  import { Checkbox, Field, Input, Switch, Textarea } from '../../../packages/svelte/src/index'

  type Bag = Record<string, unknown>
  let {
    input = {},
    textarea,
    checkbox,
    switch: switchProps,
    ...field
  }: { input?: Bag; textarea?: Bag; checkbox?: Bag; switch?: Bag; [key: string]: unknown } = $props()

  const { label: choiceLabel, ...choice } = $derived((checkbox ?? switchProps ?? {}) as Bag)
</script>

<Field {...field}>
  {#if checkbox}
    <Checkbox {...choice}>{choiceLabel}</Checkbox>
  {:else if switchProps}
    <Switch {...choice}>{choiceLabel}</Switch>
  {:else if textarea}
    <Textarea {...textarea} />
  {:else}
    <Input {...input} />
  {/if}
</Field>
