<script lang="ts">
  import { Button, Checkbox, Chip, ChipGroup, Dialog, Field, Input, RadioGroup, Select, Switch, Textarea } from '@ggary/svelte'
  import { frameworks, roles, tags, terms } from './demo-data'

  let value = $state<string | null>('svelte')
  let lastEvent = $state('—')
  let items = $state(tags)
  let selection = $state<string[]>(['design'])
  let formOutput = $state('submit to see the FormData the hidden input contributes')

  let notify = $state({ mentions: true, replies: false, digest: false })
  let plan = $state<string | null>('free')
  const notifyCount = $derived(Object.values(notify).filter(Boolean).length)
  const allNotify = $derived(notifyCount === 0 ? false : notifyCount === 3 ? true : 'indeterminate')

  const plans = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team (contact sales)', disabled: true },
  ]

  let editOpen = $state(false)
  let deleteOpen = $state(false)
  let dialogLog = $state('open a dialog')
  const logDialog = (name: string) => (open: boolean, { reason }: { reason: string }) =>
    (dialogLog = `${name}  ${open ? 'open' : 'closed'}  reason ${reason}`)

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
  <h2>Checkbox</h2>
  <div class="row">
    <Checkbox>Unchecked</Checkbox>
    <Checkbox defaultChecked>Checked</Checkbox>
    <Checkbox defaultChecked="indeterminate">Indeterminate</Checkbox>
    <Checkbox disabled>Disabled</Checkbox>
    <Checkbox readOnly defaultChecked>Read only</Checkbox>
  </div>
  <div class="stack">
    <Checkbox
      checked={allNotify}
      onCheckedChange={(on) => (notify = { mentions: on, replies: on, digest: on })}
    >
      All notifications
    </Checkbox>
    <div class="nested">
      <Checkbox bind:checked={notify.mentions}>Mentions</Checkbox>
      <Checkbox bind:checked={notify.replies}>Replies</Checkbox>
      <Checkbox bind:checked={notify.digest}>Weekly digest</Checkbox>
    </div>
  </div>
  <p class="hint">"All notifications" is indeterminate while only some are checked; checking it checks them all.</p>
</section>

<section>
  <h2>Switch</h2>
  <div class="row">
    <Switch defaultChecked>Wi-Fi</Switch>
    <Switch>Bluetooth</Switch>
    <Switch disabled>Disabled</Switch>
    <Switch readOnly defaultChecked>Read only</Switch>
  </div>
  <div class="fields" style="margin-top:16px">
    <Field label="Notifications" hint="Takes effect immediately">
      <Switch>Email me</Switch>
    </Field>
  </div>
</section>

<section>
  <h2>Radio group</h2>
  <div class="choices">
    <RadioGroup label="Plan" name="plan-demo" items={plans} bind:value={plan} />
    <RadioGroup
      label="Billing"
      orientation="horizontal"
      defaultValue="monthly"
      items={[
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
      ]}
    />
  </div>
  <pre class="state">{`value  ${JSON.stringify(plan)}`}</pre>
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
    <RadioGroup
      label="Plan"
      name="plan"
      orientation="horizontal"
      defaultValue="free"
      items={plans.slice(0, 2)}
    />
    <Field error="Accept the terms to continue" required>
      <Checkbox name="terms">I accept the terms</Checkbox>
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
  <h2>Dialog</h2>
  <div class="row">
    <Dialog
      title="Edit profile"
      description="Changes show on your public profile."
      bind:open={editOpen}
      onOpenChange={logDialog('edit')}
    >
      {#snippet trigger(props)}
        <Button {...props}>Edit profile</Button>
      {/snippet}
      <div class="dialog-fields">
        <Field label="Display name"><Input defaultValue="Garry" /></Field>
        <Select label="Role" items={roles} defaultValue="editor" />
        <Field label="Bio" hint="Optional"><Textarea rows={3} autoResize maxRows={6} /></Field>
      </div>
      {#snippet footer()}
        <Button emphasis="minimal" onclick={() => ((editOpen = false), (dialogLog = 'edit  closed  by Cancel'))}>Cancel</Button>
        <Button emphasis="high" onclick={() => ((editOpen = false), (dialogLog = 'edit  closed  by Save'))}>Save</Button>
      {/snippet}
    </Dialog>

    <Dialog
      title="Delete project?"
      description="This cannot be undone."
      role="alertdialog"
      size="sm"
      closeOnEscape={false}
      closeOnOutside={false}
      closeButton={false}
      bind:open={deleteOpen}
      onOpenChange={logDialog('delete')}
    >
      {#snippet trigger(props)}
        <Button tone="danger" {...props}>Delete project…</Button>
      {/snippet}
      <p>Everything in “Atlas” goes, including its run history and settings.</p>
      {#snippet footer()}
        <Button emphasis="minimal" onclick={() => ((deleteOpen = false), (dialogLog = 'delete  closed  by Cancel'))}>Cancel</Button>
        <Button emphasis="high" tone="danger" onclick={() => ((deleteOpen = false), (dialogLog = 'delete  closed  by Delete'))}>Delete</Button>
      {/snippet}
    </Dialog>

    <Dialog title="Terms of service" size="lg" onOpenChange={logDialog('terms')}>
      {#snippet trigger(props)}
        <Button emphasis="low" {...props}>Read the terms</Button>
      {/snippet}
      {#each terms as clause, i (i)}
        <p>{i + 1}. {clause}</p>
      {/each}
      {#snippet footer()}
        <form method="dialog"><Button emphasis="high" type="submit" value="accept">Accept</Button></form>
      {/snippet}
    </Dialog>
  </div>
  <pre class="state">{dialogLog}</pre>
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
