<script lang="ts">
  import { Checkbox, Field, FileDrop, Input, NumberField, Search, Slider, Switch, Textarea } from '../../../packages/svelte/src/index'

  type Bag = Record<string, unknown>
  let {
    input = {},
    textarea,
    checkbox,
    switch: switchProps,
    slider,
    numberField,
    search,
    fileDrop,
    ...field
  }: {
    input?: Bag; textarea?: Bag; checkbox?: Bag; switch?: Bag; slider?: Bag; numberField?: Bag; search?: Bag; fileDrop?: Bag
    [key: string]: unknown
  } = $props()

  const { label: choiceLabel, ...choice } = $derived((checkbox ?? switchProps ?? {}) as Bag)
</script>

<Field {...field}>
  {#if checkbox}
    <Checkbox {...choice}>{choiceLabel}</Checkbox>
  {:else if switchProps}
    <Switch {...choice}>{choiceLabel}</Switch>
  {:else if search}
    <Search {...search} />
  {:else if fileDrop}
    <FileDrop {...fileDrop} />
  {:else if slider}
    <Slider {...slider} />
  {:else if numberField}
    <NumberField {...numberField} />
  {:else if textarea}
    <Textarea {...textarea} />
  {:else}
    <Input {...input} />
  {/if}
</Field>
