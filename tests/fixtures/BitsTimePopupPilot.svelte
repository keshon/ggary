<script lang="ts">
 import TimePicker from '../../packages/svelte/src/components/time-picker/TimePicker.svelte'
 import DatePicker from '../../packages/svelte/src/components/date-picker/DatePicker.svelte'
</script>
<form><TimePicker label="Starts" name="starts" locale="en-GB" defaultValue="14:00" step={30} min="09:00" max="17:00" isTimeDisabled={time => time === '14:30'} /><button type="reset">Reset</button></form>
<form><DatePicker label="Meeting" name="meeting" time defaultValue="2026-10-14T15:30" locale="en-GB" /></form>
<button aria-label="Outside" style="position:fixed;right:20px;top:20px">Outside</button>
