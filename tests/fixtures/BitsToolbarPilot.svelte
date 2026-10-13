<script lang="ts">
 import Toolbar from '../../packages/svelte/src/components/toolbar/Toolbar.svelte'
 import ToolbarButton from '../../packages/svelte/src/components/toolbar/ToolbarButton.svelte'
 import RibbonGroup from '../../packages/svelte/src/components/ribbon/RibbonGroup.svelte'
 let actions = $state(0)
</script>
<Toolbar label="Actions">
 <ToolbarButton onclick={() => actions++}>First</ToolbarButton>
 <ToolbarButton disabled>Disabled</ToolbarButton>
 <ToolbarButton>Last</ToolbarButton>
</Toolbar>
<Toolbar label="Vertical" orientation="vertical"><ToolbarButton>Up</ToolbarButton><ToolbarButton>Down</ToolbarButton></Toolbar>
<RibbonGroup label="Tools"><ToolbarButton>Tool one</ToolbarButton><ToolbarButton>Tool two</ToolbarButton></RibbonGroup>
<RibbonGroup label="Mixed" managed={false}><input aria-label="Mixed text" /><ToolbarButton>Unmanaged action</ToolbarButton></RibbonGroup>
<Toolbar><ToolbarButton>Plain action</ToolbarButton></Toolbar>
<output aria-label="Actions count">{actions}</output>
