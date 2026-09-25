<script lang="ts">
  import { Button, Icon } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'

  const EMPHASES = ['high', 'medium', 'low', 'minimal'] as const
  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    {#each EMPHASES as emphasis (emphasis)}
      <Specimen label={`emphasis="${emphasis}"`}><Button {emphasis}>Save</Button></Specimen>
    {/each}
    {#each EMPHASES as emphasis (emphasis)}
      <Specimen label={`destructive emphasis="${emphasis}"`}><Button destructive {emphasis}>Delete</Button></Specimen>
    {/each}
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Button {size}>Save</Button></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled"><Button disabled>Save</Button></Specimen>
    <Specimen label="loading"><Button loading>Save</Button></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="icon + label"><Button><Icon name="plus" /> New</Button></Specimen>
    <Specimen label="icon only, aria-label"><Button emphasis="low" aria-label="Settings"><Icon name="settings" /></Button></Specimen>
    <Specimen label="fullWidth" wide><Button fullWidth emphasis="high">Continue</Button></Specimen>
  {/snippet}
</DemoPage>
