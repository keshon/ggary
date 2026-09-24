<script lang="ts">
  import { Column, Columns } from '../../../packages/svelte/src/index'

  let { columns, ...options }: any = $props()
</script>

<Columns {...options}>
  {#each columns as column (column.text)}
    <Column span={column.span} start={column.start}><p>{column.text}</p></Column>
  {/each}
</Columns>
