<script lang="ts">
  import Dialog from '../../packages/svelte/src/components/dialog/Dialog.svelte'
  import Combobox from '../../packages/svelte/src/components/combobox/Combobox.svelte'
  let value = $state<string[]>(['a'])
</script>
<Dialog title="Combobox pilot">
  {#snippet trigger(props)}<button {...props}>Open combobox pilot</button>{/snippet}
  <form>
    <Combobox label="Pilot tags" name="tags" multiple bind:value items={[
      { value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }, { value: 'c', label: 'Charlie', disabled: true }
    ]} />
    <button type="reset">Reset tags</button>
  </form>
</Dialog>
<output aria-label="Chosen tags">{value.join(',')}</output>
