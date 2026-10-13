<script lang="ts">
 import Slider from '../../packages/svelte/src/components/slider/Slider.svelte'
 import RangeSlider from '../../packages/svelte/src/components/range-slider/RangeSlider.svelte'
 import Field from '../../packages/svelte/src/components/field/Field.svelte'
 import Fieldset from '../../packages/svelte/src/components/fieldset/Fieldset.svelte'
 import ConfigProvider from '../../packages/svelte/src/components/config-provider/ConfigProvider.svelte'
</script>
<form>
 <Slider name="volume" label="Volume" defaultValue={40} />
 <RangeSlider name={['low', 'high']} label="Price" defaultValue={[20, 70]} minGap={10} />
 <button type="reset">Reset</button>
</form>

<Field label="Readonly confidence" readOnly><Slider defaultValue={30} /></Field>
<Fieldset disabled><Slider label="Disabled volume" name="disabledVolume" /><RangeSlider label="Disabled price" name="disabledPrice" /></Fieldset>
<ConfigProvider dir="rtl"><Slider label="RTL volume" defaultValue={40} /></ConfigProvider>
