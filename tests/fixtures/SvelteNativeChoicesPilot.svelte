<script lang="ts">
 import Checkbox from '../../packages/svelte/src/components/checkbox/Checkbox.svelte'
 import Switch from '../../packages/svelte/src/components/switch/Switch.svelte'
 import RadioGroup from '../../packages/svelte/src/components/radio-group/RadioGroup.svelte'
 import Fieldset from '../../packages/svelte/src/components/fieldset/Fieldset.svelte'
</script>
<form>
 <Checkbox name="terms" value="yes" required>Accept terms</Checkbox>
 <Switch name="enabled" value="yes" defaultChecked>Enabled</Switch>
 <Checkbox name="mixed" defaultChecked="indeterminate">Mixed</Checkbox>
 <RadioGroup label="Stage" name="stage" required defaultValue="" items={[{value:'', label:'Empty key'}, {value:'disabled', label:'Unavailable', disabled:true}, {value:'ready', label:'Ready'}]} />
 <Checkbox readOnly>Readonly checkbox</Checkbox>
 <Switch readOnly>Readonly switch</Switch>
 <Fieldset disabled>
  <Checkbox name="blocked">Blocked checkbox</Checkbox>
  <Switch name="blockedSwitch">Blocked switch</Switch>
  <RadioGroup name="blockedRadio" label="Blocked radios" items={[{value:'a', label:'Blocked option'}]} />
 </Fieldset>
 <button type="reset">Reset</button>
</form>
