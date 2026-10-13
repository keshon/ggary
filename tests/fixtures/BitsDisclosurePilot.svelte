<script lang="ts">
  import { Tabs, Accordion } from '../../packages/svelte/src/index'
  let documents = $state([{ value: '', label: 'Empty document' }, { value: 'one', label: 'Document one', closable: true }, { value: 'disabled', label: 'Unavailable', disabled: true }, { value: 'three', label: 'Document three' }])
  let selected = $state<string | null>('')
  let section = $state<string[]>([])
</script>
<div style="width:220px">
  <Tabs items={documents} label="Documents" variant="documents" bind:value={selected} keepMounted onClose={key => documents = documents.filter(item => item.value !== key)}>
    {#snippet panel(item)}<input aria-label={`Draft ${item.label}`} />{/snippet}
  </Tabs>
</div>
<Tabs items={[{ value: 'a', label: 'Manual alpha' }, { value: 'b', label: 'Manual bravo' }]} label="Manual tabs" activation="manual">
  {#snippet panel(item)}<p>{item.label}</p>{/snippet}
</Tabs>
<Accordion items={[{ value: '', label: 'Empty section' }, { value: 'disabled', label: 'Unavailable section', disabled: true }, { value: 'other', label: 'Other section' }]} bind:value={section} collapsible={false}>
  {#snippet panel(item)}<input aria-label={`Section draft ${item.label}`} />{/snippet}
</Accordion>
<output aria-label="Selected document">{selected}</output>
<output aria-label="Open sections">{JSON.stringify(section)}</output>
