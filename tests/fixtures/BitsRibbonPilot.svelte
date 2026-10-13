<script lang="ts">
 import Ribbon from '../../packages/svelte/src/components/ribbon/Ribbon.svelte'
</script>
<Ribbon label="Workspace" keepMounted items={[{value:'',label:'Empty'}, {value:'disabled',label:'Disabled',disabled:true}, {value:'edit',label:'Edit'}]}>
 {#snippet panel(item)}<input aria-label={`Draft ${item.label}`} />{/snippet}
</Ribbon>
