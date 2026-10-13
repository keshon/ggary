<script lang="ts">
 import ChipGroup from '../../packages/svelte/src/components/chip-group/ChipGroup.svelte'
 let items = $state([{value:'',label:'Empty'}, {value:'disabled',label:'Disabled',disabled:true}, {value:'a',label:'Alpha'}, {value:'b',label:'Beta'}])
 let removals = $state(0)
</script>
<form>
 <ChipGroup label="Tags" name="tags" {items} removable defaultValue={['']} onRemove={(value) => { removals++; items = items.filter(item => item.value !== value) }} />
 <ChipGroup label="Single" name="single" mode="single" items={[{value:'',label:'Empty single'}, {value:'x',label:'Other single'}]} />
 <output aria-label="Removal count">{removals}</output>
 <button type="reset">Reset</button>
</form>
