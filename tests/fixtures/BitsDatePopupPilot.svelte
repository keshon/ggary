<script lang="ts">
 import DatePicker from '../../packages/svelte/src/components/date-picker/DatePicker.svelte'
 let events = $state<string[]>([])
</script>
<form><DatePicker name="day" label="Day" defaultValue="2026-10-12" /><button type="reset">Reset</button></form>
<form><DatePicker name="period" onValueChange={range => events = [...events, JSON.stringify(range)]} label="Stay" locale="en-GB" mode="range" months={2} defaultValue={{start:'2026-10-29',end:'2026-11-03'}} presets={[{label:'This week',value:{start:'2026-10-01',end:'2026-10-07'}}]} /></form>
<button aria-label="Outside" style="position:fixed;right:20px;top:20px">Outside</button>

<output aria-label="Range events" hidden>{JSON.stringify(events)}</output>
