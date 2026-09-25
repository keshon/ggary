<script lang="ts">
  import { Avatar, Cluster, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { SIZES, brokenPicture, portrait } from '../../data/display'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="name"><Avatar name="Ada Lovelace" /></Specimen>
    <Specimen label="src"><Avatar name="Ada Lovelace" src={portrait} /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><Avatar name="Grace Hopper" {size} /><Avatar name="Grace Hopper" src={portrait} {size} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label="src · failed to load"><Avatar name="Alan Turing" src={brokenPicture} /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="decorative, beside the name">
      <Cluster gap="tight"><Avatar name="Barbara Liskov" size="sm" decorative /><Text>Barbara Liskov</Text></Cluster>
    </Specimen>
  {/snippet}
</DemoPage>
