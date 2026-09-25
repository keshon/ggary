<script lang="ts">
  import { TimePicker } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'

  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`locale="en-GB"`}><TimePicker label="Call at" locale="en-GB" defaultValue="14:30" /></Specimen>
    <Specimen label={`locale="en-US"`}><TimePicker label="Call at" locale="en-US" defaultValue="14:30" /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><TimePicker {size} label="Starts" locale="en-GB" defaultValue="09:00" /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="empty"><TimePicker label="Call at" locale="en-GB" /></Specimen>
  {/snippet}
</DemoPage>
