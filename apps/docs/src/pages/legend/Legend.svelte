<script lang="ts">
  import { Legend, Share, Stack } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { runModules } from './data'

  const items = runModules.map(({ label, series, text }) => ({ label, series, value: text }))
  const bare = runModules.slice(0, 3).map(({ label, series }) => ({ label, series }))
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label={`direction="row"`}><Legend {items} label="Time by module" /></Specimen>
    <Specimen label={`direction="column"`}><Legend {items} direction="column" label="Time by module" /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="no value"><Legend items={bare} label="Modules" /></Specimen>
    <Specimen label="no series"><Legend items={[{ label: 'Run time', value: '42 s' }]} label="Run time" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="under a Share" wide>
      <Stack gap="tight">
        <Share items={runModules} unit="s" label="Last night's run" locale="en-GB" />
        <Legend {items} label="Time by module" />
      </Stack>
    </Specimen>
  {/snippet}
</DemoPage>
