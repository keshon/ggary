<script lang="ts">
 import CheckboxGroup from '../../packages/svelte/src/components/checkbox-group/CheckboxGroup.svelte'
 import ChoiceCardGroup from '../../packages/svelte/src/components/choice-card/ChoiceCardGroup.svelte'
 import SegmentedControl from '../../packages/svelte/src/components/segmented-control/SegmentedControl.svelte'
</script>
<form>
 <CheckboxGroup name="boxes" label="Boxes" required items={[{value:'disabled', label:'Unavailable', disabled:true}, {value:'a', label:'Box A'}, {value:'b', label:'Box B'}]} />
 <ChoiceCardGroup name="cards" label="Cards" type="checkbox" required items={[{value:'disabled', title:'Unavailable card', disabled:true}, {value:'a', title:'Card A'}, {value:'b', title:'Card B'}]} />
 <SegmentedControl name="view" label="View" required defaultValue="" items={[{value:'', label:'Empty view'}, {value:'disabled', label:'Disabled view', disabled:true}, {value:'next', label:'Next view'}]} />
 <button type="reset">Reset</button>
</form>
