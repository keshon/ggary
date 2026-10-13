<script lang="ts">
 import Toaster from '../../packages/svelte/src/components/toast/Toaster.svelte'
 import type { Toaster as Store } from '@ggary/core/toast'
 let { toaster }: { toaster: Store } = $props()
</script>
<button>Outside</button>
<Toaster {toaster} />
