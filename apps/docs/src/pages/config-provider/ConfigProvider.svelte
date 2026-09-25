<script lang="ts">
  import { Button, Card, ConfigProvider, DatePicker, Input, List, ListItem, Metric, Stack } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { SIZES, english, german, outer, variants as variantSamples, type Labels } from './data'
</script>

<!-- The same few controls every time: only the settings around them change. -->
{#snippet controls(text: Labels)}
  <Card>
    <Stack>
      <Button>{text.save}</Button>
      <Input aria-label={text.name} placeholder={text.name} />
      <DatePicker label={text.due} defaultValue="2026-09-18" />
      <Metric label={text.leads} value={12400} />
      <List label={text.files} onLoadMore={() => {}}>
        <ListItem title={text.first} />
        <ListItem title={text.second} />
      </List>
    </Stack>
  </Card>
{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each variantSamples as sample (sample.label)}
      <Specimen label={sample.label}>
        <ConfigProvider {...sample.config}>{@render controls(sample.text)}</ConfigProvider>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}>
        <ConfigProvider {size}>{@render controls(english)}</ConfigProvider>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label={`size="sm" inside locale="de-DE" words`}>
      <ConfigProvider {...outer}>
        <ConfigProvider size="sm">{@render controls(german)}</ConfigProvider>
      </ConfigProvider>
    </Specimen>
  {/snippet}
</DemoPage>
