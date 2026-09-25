<script lang="ts">
  import { Cluster, FileChange, Stack, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { changedFiles } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    {#each changedFiles as { change, path } (change)}
      <Specimen label={`change="${change}"`}><Cluster gap="tight"><FileChange {change} /><Text code>{path}</Text></Cluster></Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="beside each path, in a list" wide>
      <Stack gap="tight">
        {#each changedFiles as { change, path } (path)}<Cluster gap="tight"><FileChange {change} /><Text code>{path}</Text></Cluster>{/each}
      </Stack>
    </Specimen>
  {/snippet}
</DemoPage>
