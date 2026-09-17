<script lang="ts">
  import { ButtonGroup, Input, InputGroup } from '../../../packages/svelte/src/index'

  type Bag = Record<string, unknown>
  let { group, input = {}, buttons, ...rest }: { group?: string; input?: Bag; buttons?: string[]; [key: string]: unknown } = $props()
</script>

{#if group === 'buttons'}
  <ButtonGroup {...rest}>
    {#each buttons ?? ['One', 'Two', 'Three'] as label (label)}
      <button data-scope="button" data-part="root" type="button">{label}</button>
    {/each}
  </ButtonGroup>
{:else}
  <InputGroup {...rest}>
    <Input {...input} />
  </InputGroup>
{/if}
