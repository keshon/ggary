<script lang="ts">
  import { CodeBlock } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { command, generator } from './data'
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="code" wide><CodeBlock label="the deploy command" code={command} /></Specimen>
    <Specimen label="numbered" wide><CodeBlock label="the terrain generator" code={generator} numbered /></Specimen>
    <Specimen label={"numbered start={12}"} wide><CodeBlock label="the terrain generator" code={generator} numbered start={12} /></Specimen>
  {/snippet}
</DemoPage>
