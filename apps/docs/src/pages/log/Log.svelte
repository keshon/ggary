<script lang="ts">
  import { Log } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { deployLines, nextLine, runLines } from './data'

  /** Lines arriving, and the log holding the bottom as they do. */
  let arriving = $state(Array.from({ length: 8 }, (_, index) => nextLine(index)))
  $effect(() => {
    let count = 8
    const timer = setInterval(() => (arriving = [...arriving, nextLine(count++)].slice(-60)), 1200)
    return () => clearInterval(timer)
  })
</script>

<DemoPage>
  {#snippet states()}
    <Specimen label={`level="info" · "debug" · "warn" · "error"`} wide>
      <Log lines={runLines} label="The log of run 4127" locale="en-GB" />
    </Specimen>
    <Specimen label={`timeZone="UTC" announce`} wide>
      <Log lines={deployLines} label="The deploy log" locale="en-GB" timeZone="UTC" announce />
    </Specimen>
    <Specimen label={"lines={[]}"} wide><Log lines={[]} label="The log of run 4128" locale="en-GB" /></Specimen>
    <Specimen label="tail" wide>
      <Log lines={arriving} label="The log of run 4127, arriving" locale="en-GB" tail style="max-block-size: 200px" />
    </Specimen>
  {/snippet}
</DemoPage>
