<script lang="ts">
  import { Caret, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
</script>

<DemoPage>
  {#snippet composition()}
    <Specimen label="after the last character of streaming text"><Text>Streaming the answer<Caret /></Text></Specimen>
  {/snippet}
</DemoPage>
