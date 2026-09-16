import '@ggary/styles'
import './shared.css'
import '@ggary/elements' // only for the theme toggle in the page chrome

import { StrictMode, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Chip, ChipGroup, Select } from '@ggary/react'
import { frameworks, installThemeToggle, tags } from './demo-data'

installThemeToggle(document.getElementById('theme-toggle')!)

function App() {
  const [value, setValue] = useState<string | null>('react')
  const [lastEvent, setLastEvent] = useState('—')
  const [items, setItems] = useState(tags)
  const [selection, setSelection] = useState<string[]>(['design'])
  const [formOutput, setFormOutput] = useState('submit to see the FormData the hidden input contributes')

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const entries = [...new FormData(event.currentTarget).entries()]
    setFormOutput(entries.length ? entries.map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join('\n') : '(empty form)')
  }

  return (
    <>
      <section>
        <h2>Button — variants</h2>
        <div className="row">
          <Button>Solid</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
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
          <Chip>Plain</Chip>
          <Chip variant="outline">Outline</Chip>
          <Chip variant="solid">Solid</Chip>
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
          <Button size="sm" variant="outline" onClick={() => setItems(tags)}>
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
          <Button variant="outline" onClick={() => setValue('qwik')}>
            Set to Qwik
          </Button>
          <Button variant="ghost" onClick={() => setValue(null)}>
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
        <h2>Native form participation</h2>
        <form className="demo" onSubmit={onSubmit} onReset={() => setFormOutput('reset')}>
          <Select items={frameworks} name="framework" label="framework" placeholder="Required…" />
          <Button type="submit">Submit</Button>
          <Button type="reset" variant="ghost">
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
