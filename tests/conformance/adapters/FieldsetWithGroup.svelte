<script lang="ts">
  import { CheckboxGroup, Fieldset, RadioGroup } from '../../../packages/svelte/src/index'

  let { group, items, name, defaultValue, ...fieldset }: Record<string, any> = $props()
</script>

<Fieldset {...fieldset}>
  {#if group === 'radio'}
    <RadioGroup {items} {name} {defaultValue} />
  {:else}
    <CheckboxGroup {items} {name} {defaultValue} />
  {/if}
</Fieldset>
