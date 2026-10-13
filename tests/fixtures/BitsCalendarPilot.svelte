<script lang="ts">
 import Calendar from '../../packages/svelte/src/components/date-picker/Calendar.svelte'
 let single = $state('2026-10-12')
 let result = $state('')
</script>
<Calendar bind:value={single} min="2026-10-01" max="2026-10-31" isDateDisabled={day => day === '2026-10-13'} />
<output aria-label="Selected day">{single}</output>
<Calendar mode="range" months={2} defaultMonth="2026-10-01" onValueChange={range => result=JSON.stringify(range)} />
<output aria-label="Selected range">{result}</output>
