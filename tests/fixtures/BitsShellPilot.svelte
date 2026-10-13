<script lang="ts">
 import Shell from '../../packages/svelte/src/components/layout/Shell.svelte'
 import Select from '../../packages/svelte/src/components/select/Select.svelte'
 let events = $state<string[]>([])
</script>
<Shell asideLabel="Sidebar" onOpenChange={(open,details) => events=[...events,`${open}:${details.reason}`]}>
 {#snippet brand()}Workspace{/snippet}
 {#snippet aside()}
  <input aria-label="Sidebar draft" value="draft" />
  <a href="#reports">Reports</a>
  <Select label="Nested choice" items={[{value:'a',label:'Alpha'},{value:'b',label:'Bravo'}]} />
 {/snippet}
 <button>Work action</button>
</Shell>
<output hidden aria-label="Shell events">{JSON.stringify(events)}</output>
