<script lang="ts">
  import { RangeSlider } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { euro, minutes } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const
  const DISPLAYS = ['header', 'bubbles', 'inputs'] as const
</script>

<DemoPage>
  {#snippet variants()}
    {#each DISPLAYS as valueDisplay (valueDisplay)}
      <Specimen label={`valueDisplay="${valueDisplay}"`} wide>
        <RangeSlider label="Price" {valueDisplay} prefix="€" min={0} max={200} step={5} defaultValue={[40, 120]} formatValue={euro} />
      </Specimen>
    {/each}
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`} wide><RangeSlider {size} label="Price" min={0} max={200} step={5} defaultValue={[40, 120]} formatValue={euro} /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label={`valueDisplay="bubbles" defaultValue={[60, 75]}`} wide>
      <RangeSlider label="Budget" valueDisplay="bubbles" min={0} max={200} step={5} defaultValue={[60, 75]} formatValue={euro} />
    </Specimen>
    <Specimen label="disabled" wide><RangeSlider label="Retries" min={0} max={10} defaultValue={[1, 3]} marks={[0, 5, 10]} disabled /></Specimen>
    <Specimen label="invalid" wide><RangeSlider label="Price" min={0} max={200} step={5} defaultValue={[0, 200]} formatValue={euro} invalid /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="marks" wide>
      <RangeSlider label="Run time" min={0} max={60} defaultValue={[2, 45]} formatValue={minutes} marks={[0, 15, 30, 45, 60]} />
    </Specimen>
    <Specimen label={`valueDisplay="inputs" suffix="min" minGap={5}`} wide>
      <RangeSlider label="Run time" valueDisplay="inputs" suffix="min" min={0} max={60} minGap={5} defaultValue={[10, 30]} formatValue={minutes} name={['time_min', 'time_max']} />
    </Specimen>
  {/snippet}
</DemoPage>
