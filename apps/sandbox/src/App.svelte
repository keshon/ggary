<script lang="ts">
  import { Button, Chip, ChipGroup, Field, Input, Select, Textarea } from '@ggary/svelte'
  import { frameworks, tags } from './demo-data'

  let value = $state<string | null>('svelte')
  let lastEvent = $state('—')
  let items = $state(tags)
  let selection = $state<string[]>(['design'])
  let formOutput = $state('submit to see the FormData the hidden input contributes')

  let taken = $state(false)
  let username = $state('garry')
  let signupOutput = $state('submit empty to see every error at once')

  function onSignup(event: SubmitEvent) {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    if (!form.checkValidity()) {
      signupOutput = 'invalid — see the fields'
      return
    }
    signupOutput = [...new FormData(form).entries()].map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join('\n')
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    const entries = [...new FormData(event.currentTarget as HTMLFormElement).entries()]
    formOutput = entries.length
      ? entries.map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join('\n')
      : '(empty form)'
  }
</script>

<section>
  <h2>Button — emphasis</h2>
  <div class="row">
    <Button emphasis="high">high</Button>
    <Button emphasis="medium">medium</Button>
    <Button emphasis="low">low</Button>
    <Button emphasis="minimal">minimal</Button>
  </div>
</section>

<section>
  <h2>Button — tone danger, across emphasis</h2>
  <div class="row">
    <Button emphasis="high" tone="danger">high</Button>
    <Button emphasis="medium" tone="danger">medium</Button>
    <Button emphasis="low" tone="danger">low</Button>
    <Button emphasis="minimal" tone="danger">minimal</Button>
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
    <Chip>low</Chip>
    <Chip emphasis="medium">medium</Chip>
    <Chip emphasis="high">high</Chip>
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
    <Button size="sm" onclick={() => (items = tags)}>Restore removed</Button>
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
    <Button onclick={() => (value = 'qwik')}>Set to Qwik</Button>
    <Button emphasis="minimal" onclick={() => (value = null)}>Clear</Button>
  </div>
  <pre class="state">{`value       ${JSON.stringify(value)}
last event  ${lastEvent}`}</pre>
  <p class="hint">
    Identical behaviour to the React page, driven by the same machine and the same
    <code>connect()</code> — only the normalizer and the template differ.
  </p>
</section>

<section>
  <h2>Field + Input</h2>
  <div class="fields">
    <Field label="Full name" hint="As it appears on your ID">
      <Input name="name" autocomplete="name" />
    </Field>
    <Field label="Email" hint="Leave the field to validate" error="Enter a valid email address" required>
      <Input type="email" placeholder="you@example.com" />
    </Field>
    <Field label="Disabled" disabled>
      <Input defaultValue="Can't touch this" />
    </Field>
    <Field label="Read only" hint="Selectable, copyable, not editable" readOnly>
      <Input defaultValue="INV-2041" />
    </Field>
  </div>
  <p class="hint">
    No error shows while you type the first time, only when you leave the field or submit, and once shown it
    clears as you fix it.
  </p>
</section>

<section>
  <h2>Input — sizes</h2>
  <div class="fields">
    <Field label="Small"><Input size="sm" placeholder="sm" /></Field>
    <Field label="Medium"><Input placeholder="md" /></Field>
    <Field label="Large"><Input size="lg" placeholder="lg" /></Field>
    <Input type="search" aria-label="Search" placeholder="No field, just an input" />
  </div>
</section>

<section>
  <h2>Textarea</h2>
  <div class="fields">
    <Field label="Description" hint="Drag the corner to resize">
      <Textarea name="description" rows={3} />
    </Field>
    <Field label="Notes" hint="Grows with the text, up to 8 lines">
      <Textarea rows={2} autoResize maxRows={8} placeholder="Start typing…" />
    </Field>
    <Field label="Release notes" hint="Read only" readOnly>
      <Textarea rows={3} defaultValue={'v2.4.0\n- Field and Input in all three adapters\n- Textarea with auto-resize'} />
    </Field>
  </div>
</section>

<section>
  <h2>Field — invalid declared by the owner</h2>
  <div class="row">
    <Field label="Username" hint="Letters and digits" error="That username is taken" invalid={taken}>
      <Input bind:value={username} />
    </Field>
    <Button onclick={() => (taken = !taken)}>Toggle “taken”</Button>
  </div>
  <pre class="state">{`value    ${JSON.stringify(username)}
invalid  ${taken}`}</pre>
</section>

<section>
  <h2>Field — a validated form</h2>
  <form class="stack" novalidate onsubmit={onSignup}>
    <Field label="Name" error="Tell us your name" required>
      <Input name="name" />
    </Field>
    <Field label="Email" error="Enter a valid email address" required>
      <Input name="email" type="email" />
    </Field>
    <Field label="Password" hint="At least 8 characters" error="Use 8 or more characters" required>
      <Input name="password" type="password" minlength={8} />
    </Field>
    <Field label="About you" hint="Optional, up to 280 characters">
      <Textarea name="about" rows={2} maxLength={280} autoResize maxRows={6} />
    </Field>
    <div class="row">
      <Button emphasis="high" type="submit">Create account</Button>
    </div>
  </form>
  <pre class="state">{signupOutput}</pre>
</section>

<section>
  <h2>Native form participation</h2>
  <form class="demo" onsubmit={onSubmit} onreset={() => (formOutput = 'reset')}>
    <Select items={frameworks} name="framework" label="framework" placeholder="Required…" />
    <Button emphasis="high" type="submit">Submit</Button>
    <Button type="reset" emphasis="minimal">Reset</Button>
  </form>
  <pre class="state">{formOutput}</pre>
</section>
