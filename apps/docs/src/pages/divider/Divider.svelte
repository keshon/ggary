<script lang="ts">
  import { Divider, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`emphasis="low"`}><Divider /></Specimen>
    <Specimen label={`emphasis="medium"`}><Divider emphasis="medium" /></Specimen>
    <Specimen label={`orientation="vertical"`}>
      <Text>Edit</Text>
      <Divider orientation="vertical" />
      <Text>Duplicate</Text>
      <Divider orientation="vertical" />
      <Text>Delete</Text>
    </Specimen>
    <Specimen label={`label="Advanced"`}><Divider label="Advanced" /></Specimen>
    <Specimen label={`label="or" align="center"`}><Divider label="or" align="center" /></Specimen>
    <Specimen label={`label="Danger zone" emphasis="medium"`}><Divider label="Danger zone" emphasis="medium" /></Specimen>
  {/snippet}
</DemoPage>
