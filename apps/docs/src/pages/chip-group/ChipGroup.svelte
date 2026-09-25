<script lang="ts">
  import { ChipGroup } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { priorities, tags, tagsWithLegacy } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const
  let removable = $state(tags)
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`mode="multi"`}><ChipGroup items={tags} label="Tags" mode="multi" defaultValue={['design', 'code']} /></Specimen>
    <Specimen label={`mode="single"`}><ChipGroup items={priorities} label="Priority" mode="single" defaultValue={['normal']} /></Specimen>
    <Specimen label={`orientation="vertical"`}>
      <ChipGroup items={priorities} label="Priority" mode="single" orientation="vertical" defaultValue={['normal']} />
    </Specimen>
    <Specimen label={`emphasis="medium"`}><ChipGroup items={tags} label="Tags" emphasis="medium" defaultValue={['design']} /></Specimen>
    <Specimen label={`emphasis="high"`}><ChipGroup items={tags} label="Tags" emphasis="high" defaultValue={['design']} /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><ChipGroup items={tags} label="Tags" {size} defaultValue={['design']} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="disabled"><ChipGroup items={tags} label="Tags" disabled defaultValue={['design']} /></Specimen>
    <Specimen label="item disabled"><ChipGroup items={tagsWithLegacy} label="Tags" defaultValue={['design']} /></Specimen>
    <Specimen label="removable">
      <ChipGroup items={removable} label="Tags" removable defaultValue={['design']} onRemove={(value) => (removable = removable.filter((item) => item.value !== value))} />
    </Specimen>
    <Specimen label={"items={[]}"}><ChipGroup items={[]} label="Tags" words={{ empty: 'No tags yet' }} /></Specimen>
  {/snippet}
</DemoPage>
