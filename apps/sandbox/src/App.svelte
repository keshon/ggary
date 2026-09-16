<script lang="ts">
  import { Button, Chip, ChipGroup, Select } from '@ggary/svelte'
  import { frameworks, tags } from './demo-data'

  let value = $state<string | null>('svelte')
  let lastEvent = $state('—')
  let items = $state(tags)
  let selection = $state<string[]>(['design'])
  let formOutput = $state('submit to see the FormData the hidden input contributes')

  function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    const entries = [...new FormData(event.currentTarget as HTMLFormElement).entries()]
    formOutput = entries.length
      ? entries.map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join('\n')
      : '(empty form)'
  }
</script>

<section>
  <h2>Button — variants</h2>
  <div class="row">
    <Button>Solid</Button>
    <Button variant="subtle">Subtle</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
  </div>
</section>

<section>
  <h2>Button — sizes and states</h2>
  <div class="row">
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
    <Button loading>Loading</Button>
    <Button disabled>Disabled</Button>
  </div>
</section>

<section>
  <h2>Chip — standalone</h2>
  <div class="row">
    <Chip>Plain</Chip>
    <Chip variant="outline">Outline</Chip>
    <Chip variant="solid">Solid</Chip>
    <Chip selected>Selected</Chip>
    <Chip size="sm">Small</Chip>
    <Chip onRemove={() => alert('removed')}>Dismiss me</Chip>
  </div>
  <p class="hint">
    Stateless, like Button. A plain chip renders as a <code>&lt;span&gt;</code> — only chips that do
    something become buttons and tab stops.
  </p>
</section>

<section>
  <h2>ChipGroup — multi select, removable</h2>
  <ChipGroup
    {items}
    label="Tags"
    mode="multi"
    removable
    name="tags"
    defaultValue={['design']}
    onSelectionChange={(next) => (selection = next)}
    onRemove={(value) => (items = items.filter((i) => i.value !== value))}
  />
  <pre class="state">{`selection  ${JSON.stringify(selection)}
items      ${items.length}`}</pre>
  <p class="hint">
    Same machine, same <code>connect()</code>, same keyboard contract as the React page. Removal is a
    <b>request</b> — this page owns <code>items</code>.
  </p>
  <div class="row" style="margin-top:12px">
    <Button size="sm" variant="outline" onclick={() => (items = tags)}>Restore removed</Button>
  </div>
</section>

<section>
  <h2>ChipGroup — single select, vertical</h2>
  <ChipGroup
    items={[
      { value: 'low', label: 'Low' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'High' },
    ]}
    label="Priority"
    mode="single"
    orientation="vertical"
  />
</section>

<section>
  <h2>Select — uncontrolled</h2>
  <div class="row">
    <Select items={frameworks} label="Framework" placeholder="Pick one…" />
    <Select items={frameworks} label="With a default" defaultValue="svelte" />
    <Select items={frameworks} label="Disabled" disabled />
    <Select items={[]} label="No options" />
  </div>
</section>

<section>
  <h2>Select — controlled</h2>
  <div class="row">
    <Select
      items={frameworks}
      label="Framework"
      {value}
      onValueChange={(next, item) => {
        value = next
        lastEvent = `onValueChange(${JSON.stringify(next)}, ${JSON.stringify(item?.label ?? null)})`
      }}
    />
    <Button variant="outline" onclick={() => (value = 'qwik')}>Set to Qwik</Button>
    <Button variant="ghost" onclick={() => (value = null)}>Clear</Button>
  </div>
  <pre class="state">{`value       ${JSON.stringify(value)}
last event  ${lastEvent}`}</pre>
  <p class="hint">
    Identical behaviour to the React page, driven by the same machine and the same
    <code>connect()</code> — only the normalizer and the template differ.
  </p>
</section>

<section>
  <h2>Native form participation</h2>
  <form class="demo" onsubmit={onSubmit} onreset={() => (formOutput = 'reset')}>
    <Select items={frameworks} name="framework" label="framework" placeholder="Required…" />
    <Button type="submit">Submit</Button>
    <Button type="reset" variant="ghost">Reset</Button>
  </form>
  <pre class="state">{formOutput}</pre>
</section>
