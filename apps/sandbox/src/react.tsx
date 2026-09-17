import './theme'
import './shared.css'

import { StrictMode, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Chip, ChipGroup, Field, Input, Select, Textarea } from '@ggary/react'
import { frameworks, tags } from './demo-data'

function App() {
  const [value, setValue] = useState<string | null>('react')
  const [lastEvent, setLastEvent] = useState('—')
  const [items, setItems] = useState(tags)
  const [selection, setSelection] = useState<string[]>(['design'])
  const [formOutput, setFormOutput] = useState('submit to see the FormData the hidden input contributes')

  const [taken, setTaken] = useState(false)
  const [username, setUsername] = useState('garry')
  const [signupOutput, setSignupOutput] = useState('submit empty to see every error at once')

  const onSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.checkValidity()) return setSignupOutput('invalid — see the fields')
    setSignupOutput([...new FormData(form).entries()].map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join('\n'))
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const entries = [...new FormData(event.currentTarget).entries()]
    setFormOutput(entries.length ? entries.map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join('\n') : '(empty form)')
  }

  return (
    <>
      <section>
        <h2>Button — emphasis</h2>
        <div className="row">
          <Button emphasis="high">high</Button>
          <Button emphasis="medium">medium</Button>
          <Button emphasis="low">low</Button>
          <Button emphasis="minimal">minimal</Button>
        </div>
      </section>

      <section>
        <h2>Button — tone danger, across emphasis</h2>
        <div className="row">
          <Button emphasis="high" tone="danger">high</Button>
          <Button emphasis="medium" tone="danger">medium</Button>
          <Button emphasis="low" tone="danger">low</Button>
          <Button emphasis="minimal" tone="danger">minimal</Button>
        </div>
      </section>

      <section>
        <h2>Button — sizes and states</h2>
        <div className="row">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section>
        <h2>Chip — standalone</h2>
        <div className="row">
          <Chip>low</Chip>
          <Chip emphasis="medium">medium</Chip>
          <Chip emphasis="high">high</Chip>
          <Chip selected>Selected</Chip>
          <Chip size="sm">Small</Chip>
          <Chip onRemove={() => alert('removed')}>Dismiss me</Chip>
        </div>
        <p className="hint">
          Stateless, like Button. A plain chip renders as a <code>&lt;span&gt;</code> — only chips that
          do something become buttons and tab stops.
        </p>
      </section>

      <section>
        <h2>ChipGroup — multi select, removable</h2>
        <ChipGroup
          items={items}
          label="Tags"
          mode="multi"
          removable
          name="tags"
          defaultValue={['design']}
          onSelectionChange={(next) => setSelection(next)}
          onRemove={(value) => setItems((current) => current.filter((i) => i.value !== value))}
        />
        <pre className="state">
          {`selection  ${JSON.stringify(selection)}\nitems      ${items.length}`}
        </pre>
        <p className="hint">
          Tab in once, then arrow between chips (they wrap), type to jump, Space toggles, Delete removes.
          Removal is a <b>request</b> — the machine never touches <code>items</code>, this page does.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Button size="sm" onClick={() => setItems(tags)}>
            Restore removed
          </Button>
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
        <div className="row">
          <Select items={frameworks} label="Framework" placeholder="Pick one…" />
          <Select items={frameworks} label="With a default" defaultValue="svelte" />
          <Select items={frameworks} label="Disabled" disabled />
          <Select items={[]} label="No options" />
        </div>
      </section>

      <section>
        <h2>Select — controlled</h2>
        <div className="row">
          <Select
            items={frameworks}
            label="Framework"
            value={value}
            onValueChange={(next, item) => {
              setValue(next)
              setLastEvent(`onValueChange(${JSON.stringify(next)}, ${JSON.stringify(item?.label ?? null)})`)
            }}
          />
          <Button onClick={() => setValue('qwik')}>
            Set to Qwik
          </Button>
          <Button emphasis="minimal" onClick={() => setValue(null)}>
            Clear
          </Button>
        </div>
        <pre className="state">
          {`value       ${JSON.stringify(value)}\nlast event  ${lastEvent}`}
        </pre>
        <p className="hint">
          React owns the value here. The machine moves the highlight but never writes `value` — that is the
          five-line `controlled` branch in select.machine.ts.
        </p>
      </section>

      <section>
        <h2>Field + Input</h2>
        <div className="fields">
          <Field label="Full name" hint="As it appears on your ID">
            <Input name="name" autoComplete="name" />
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
        <p className="hint">
          No error shows while you type the first time, only when you leave the field or submit, and once
          shown it clears as you fix it.
        </p>
      </section>

      <section>
        <h2>Input — sizes</h2>
        <div className="fields">
          <Field label="Small"><Input size="sm" placeholder="sm" /></Field>
          <Field label="Medium"><Input placeholder="md" /></Field>
          <Field label="Large"><Input size="lg" placeholder="lg" /></Field>
          <Input type="search" aria-label="Search" placeholder="No field, just an input" />
        </div>
      </section>

      <section>
        <h2>Textarea</h2>
        <div className="fields">
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
        <div className="row">
          <Field label="Username" hint="Letters and digits" error="That username is taken" invalid={taken}>
            <Input value={username} onValueChange={setUsername} />
          </Field>
          <Button onClick={() => setTaken((t) => !t)}>Toggle “taken”</Button>
        </div>
        <pre className="state">{`value    ${JSON.stringify(username)}\ninvalid  ${taken}`}</pre>
      </section>

      <section>
        <h2>Field — a validated form</h2>
        <form className="stack" noValidate onSubmit={onSignup}>
          <Field label="Name" error="Tell us your name" required>
            <Input name="name" />
          </Field>
          <Field label="Email" error="Enter a valid email address" required>
            <Input name="email" type="email" />
          </Field>
          <Field label="Password" hint="At least 8 characters" error="Use 8 or more characters" required>
            <Input name="password" type="password" minLength={8} />
          </Field>
          <Field label="About you" hint="Optional, up to 280 characters">
            <Textarea name="about" rows={2} maxLength={280} autoResize maxRows={6} />
          </Field>
          <div className="row">
            <Button emphasis="high" type="submit">Create account</Button>
          </div>
        </form>
        <pre className="state">{signupOutput}</pre>
      </section>

      <section>
        <h2>Native form participation</h2>
        <form className="demo" onSubmit={onSubmit} onReset={() => setFormOutput('reset')}>
          <Select items={frameworks} name="framework" label="framework" placeholder="Required…" />
          <Button emphasis="high" type="submit">Submit</Button>
          <Button type="reset" emphasis="minimal">
            Reset
          </Button>
        </form>
        <pre className="state">{formOutput}</pre>
      </section>
    </>
  )
}

// Cache the root across HMR updates; createRoot on an already-rooted container
// warns on every hot reload otherwise.
const container = document.getElementById('app')! as HTMLElement & { _root?: ReturnType<typeof createRoot> }
container._root ??= createRoot(container)
container._root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
