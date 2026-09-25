<script lang="ts">
  import { AvatarGroup } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { SIZES, people, peopleWithPictures } from '../../data/display'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={"max={3}"}><AvatarGroup label="Reviewers" {people} max={3} /></Specimen>
    <Specimen label="no max"><AvatarGroup label="Reviewers" {people} /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><AvatarGroup label="Reviewers" {people} max={3} {size} /></Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="people with and without src"><AvatarGroup label="Reviewers" people={peopleWithPictures} max={4} /></Specimen>
  {/snippet}
</DemoPage>
