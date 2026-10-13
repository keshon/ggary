<script lang="ts">
 import DatePicker from '../../packages/svelte/src/components/date-picker/DatePicker.svelte'
</script>
<form><DatePicker name="day" label="Day" defaultValue="2026-10-12" /><button type="reset">Reset</button></form>
<button style="position:fixed;right:20px;top:20px">Outside</button>
