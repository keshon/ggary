<script lang="ts">
 import Cascader from '../../packages/svelte/src/components/cascader/Cascader.svelte'
 import Dialog from '../../packages/svelte/src/components/dialog/Dialog.svelte'
 import { places } from '../conformance/places'
</script>
<form><Cascader items={places} label="Place" name="place" defaultValue={['ru','tat','kzn']} /><button type="reset">Reset</button></form>
<Cascader items={places} label="Region" selectParents />
<button aria-label="Outside" style="position:fixed;right:20px;top:20px">Outside</button>
<Dialog title="Location settings">
 {#snippet trigger(attrs)}<button {...attrs}>Open location settings</button>{/snippet}
 <Cascader items={places} label="Nested place" />
</Dialog>
