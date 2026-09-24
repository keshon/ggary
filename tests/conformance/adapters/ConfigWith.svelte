<script lang="ts">
  import { Button, ConfigProvider, Input, List, ListItem, TimePicker } from '../../../packages/svelte/src/index'

  let { config, inner = {} }: any = $props()
</script>

<ConfigProvider {...config}>
  <Button>Save</Button>
  <Input aria-label="Name" />
  <TimePicker label="Starts" defaultValue="14:30" />
  <List label="Files" onLoadMore={() => {}}>
    <ListItem title="Report" />
  </List>
  <Button size="lg">Own</Button>
  <ConfigProvider {...inner}>
    <Button>Inner</Button>
  </ConfigProvider>
</ConfigProvider>
