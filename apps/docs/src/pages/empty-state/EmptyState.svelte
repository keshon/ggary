<script lang="ts">
  import { Button, EmptyState, Panel } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="title"><EmptyState title="No runs yet" /></Specimen>
    <Specimen label="title · description"><EmptyState title="Nothing matches “worldgen”" description="Try a shorter word, or clear the filter." /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="children: one Button">
      <EmptyState title="No runs yet" description="A run starts on every push to main."><Button emphasis="low" size="sm">Start a run</Button></EmptyState>
    </Specimen>
    <Specimen label="inside a Panel" wide>
      <Panel title="Artifacts">
        <EmptyState title="No artifacts yet" description="Artifacts appear here after the first successful build."><Button emphasis="low" size="sm">Start a build</Button></EmptyState>
      </Panel>
    </Specimen>
  {/snippet}
</DemoPage>
