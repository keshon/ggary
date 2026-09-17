import './theme'
import './shared.css'

import { StrictMode, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Chip,
  ChipGroup,
  Dialog,
  Field,
  Fieldset,
  Input,
  Menu,
  Menubar,
  Popover,
  RadioGroup,
  Select,
  Switch,
  Textarea,
  Tooltip,
} from '@ggary/react'
import { appMenus, applyView, describeView, documentMenu, frameworks, initialView, roles, tags, terms, viewMenu } from './demo-data'

function App() {
  const [value, setValue] = useState<string | null>('react')
  const [lastEvent, setLastEvent] = useState('—')
  const [items, setItems] = useState(tags)
  const [selection, setSelection] = useState<string[]>(['design'])
  const [formOutput, setFormOutput] = useState('submit to see the FormData the hidden input contributes')

  const [notify, setNotify] = useState({ mentions: true, replies: false, digest: false })
  const [plan, setPlan] = useState<string | null>('free')
  const notifyCount = Object.values(notify).filter(Boolean).length
  const allNotify = notifyCount === 0 ? false : notifyCount === 3 ? true : 'indeterminate'

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [dialogLog, setDialogLog] = useState('open a dialog')
  const logDialog = (name: string) => (open: boolean, { reason }: { reason: string }) =>
    setDialogLog(`${name}  ${open ? 'open' : 'closed'}  reason ${reason}`)

  const [overlayLog, setOverlayLog] = useState('open a popover')
  const logOverlay = (name: string) => (open: boolean, { reason }: { reason: string }) =>
    setOverlayLog(`${name}  ${open ? 'open' : 'closed'}  reason ${reason}`)

  const [view, setView] = useState(initialView)
  const [menuLog, setMenuLog] = useState('choose something')

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
        <h2>Checkbox</h2>
        <div className="row">
          <Checkbox>Unchecked</Checkbox>
          <Checkbox defaultChecked>Checked</Checkbox>
          <Checkbox defaultChecked="indeterminate">Indeterminate</Checkbox>
          <Checkbox disabled>Disabled</Checkbox>
          <Checkbox readOnly defaultChecked>Read only</Checkbox>
        </div>
        <div className="stack">
          <Checkbox checked={allNotify} onCheckedChange={(on) => setNotify({ mentions: on, replies: on, digest: on })}>
            All notifications
          </Checkbox>
          <div className="nested">
            <Checkbox checked={notify.mentions} onCheckedChange={(on) => setNotify((n) => ({ ...n, mentions: on }))}>Mentions</Checkbox>
            <Checkbox checked={notify.replies} onCheckedChange={(on) => setNotify((n) => ({ ...n, replies: on }))}>Replies</Checkbox>
            <Checkbox checked={notify.digest} onCheckedChange={(on) => setNotify((n) => ({ ...n, digest: on }))}>Weekly digest</Checkbox>
          </div>
        </div>
        <p className="hint">"All notifications" is indeterminate while only some are checked; checking it checks them all.</p>
      </section>

      <section>
        <h2>Switch</h2>
        <div className="row">
          <Switch defaultChecked>Wi-Fi</Switch>
          <Switch>Bluetooth</Switch>
          <Switch disabled>Disabled</Switch>
          <Switch readOnly defaultChecked>Read only</Switch>
        </div>
        <div className="fields" style={{ marginTop: 16 }}>
          <Field label="Notifications" hint="Takes effect immediately">
            <Switch>Email me</Switch>
          </Field>
        </div>
      </section>

      <section>
        <h2>Radio group</h2>
        <div className="choices">
          <RadioGroup
            label="Plan"
            name="plan-demo"
            value={plan}
            onValueChange={setPlan}
            items={[
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' },
              { value: 'team', label: 'Team (contact sales)', disabled: true },
            ]}
          />
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
        <pre className="state">{`value  ${JSON.stringify(plan)}`}</pre>
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
          <Fieldset legend="Plan" error="Choose a plan" required>
            <RadioGroup
              name="plan"
              orientation="horizontal"
              items={[
                { value: 'free', label: 'Free' },
                { value: 'pro', label: 'Pro' },
              ]}
            />
          </Fieldset>
          <Fieldset legend="Interests" hint="Pick at least one" error="Pick at least one interest" required>
            <CheckboxGroup
              name="interests"
              items={[
                { value: 'design', label: 'Design' },
                { value: 'code', label: 'Code' },
                { value: 'research', label: 'Research' },
              ]}
            />
          </Fieldset>
          <Field error="Accept the terms to continue" required>
            <Checkbox name="terms">I accept the terms</Checkbox>
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
        <h2>Dialog</h2>
        <div className="row">
          <Dialog
            title="Edit profile"
            description="Changes show on your public profile."
            open={editOpen}
            onOpenChange={(open, details) => {
              setEditOpen(open)
              logDialog('edit')(open, details)
            }}
            trigger={(props) => <Button {...props}>Edit profile</Button>}
            footer={
              <>
                <Button emphasis="minimal" onClick={() => (setEditOpen(false), setDialogLog('edit  closed  by Cancel'))}>
                  Cancel
                </Button>
                <Button emphasis="high" onClick={() => (setEditOpen(false), setDialogLog('edit  closed  by Save'))}>
                  Save
                </Button>
              </>
            }
          >
            <div className="dialog-fields">
              <Field label="Display name">
                <Input defaultValue="Garry" />
              </Field>
              <Select label="Role" items={roles} defaultValue="editor" />
              <Field label="Bio" hint="Optional">
                <Textarea rows={3} autoResize maxRows={6} />
              </Field>
            </div>
          </Dialog>

          <Dialog
            title="Delete project?"
            description="This cannot be undone."
            role="alertdialog"
            size="sm"
            closeOnEscape={false}
            closeOnOutside={false}
            closeButton={false}
            open={deleteOpen}
            onOpenChange={(open, details) => {
              setDeleteOpen(open)
              logDialog('delete')(open, details)
            }}
            trigger={(props) => (
              <Button tone="danger" {...props}>
                Delete project…
              </Button>
            )}
            footer={
              <>
                <Button emphasis="minimal" onClick={() => (setDeleteOpen(false), setDialogLog('delete  closed  by Cancel'))}>
                  Cancel
                </Button>
                <Button emphasis="high" tone="danger" onClick={() => (setDeleteOpen(false), setDialogLog('delete  closed  by Delete'))}>
                  Delete
                </Button>
              </>
            }
          >
            <p>Everything in “Atlas” goes, including its run history and settings.</p>
          </Dialog>

          <Dialog
            title="Terms of service"
            size="lg"
            onOpenChange={logDialog('terms')}
            trigger={(props) => (
              <Button emphasis="low" {...props}>
                Read the terms
              </Button>
            )}
            footer={
              <form method="dialog">
                <Button emphasis="high" type="submit" value="accept">
                  Accept
                </Button>
              </form>
            }
          >
            {terms.map((clause, i) => (
              <p key={i}>
                {i + 1}. {clause}
              </p>
            ))}
          </Dialog>
        </div>
        <pre className="state">{dialogLog}</pre>
      </section>

      <section>
        <h2>Fieldset and CheckboxGroup</h2>
        <div className="choices">
          <Fieldset legend="Notifications" hint="Sent to your work address">
            <CheckboxGroup
              name="notify"
              defaultValue={['mentions', 'replies']}
              items={[
                { value: 'mentions', label: 'Mentions' },
                { value: 'replies', label: 'Replies' },
                { value: 'digest', label: 'Weekly digest' },
              ]}
            />
            <RadioGroup
              label="Frequency"
              name="frequency"
              defaultValue="instant"
              items={[
                { value: 'instant', label: 'As it happens' },
                { value: 'hourly', label: 'Hourly summary' },
              ]}
            />
          </Fieldset>
          <Fieldset legend="Billing address" hint="Locked while an invoice is open" disabled>
            <Field label="Company">
              <Input defaultValue="Atlas Ltd" />
            </Field>
            <Field label="VAT number">
              <Input defaultValue="GB123456789" />
            </Field>
          </Fieldset>
        </div>
      </section>

      <section>
        <h2>Popover and Tooltip</h2>
        <div className="row" style={{ alignItems: 'center' }}>
          <Popover title="Filters" onOpenChange={logOverlay('filters')} trigger={(props) => <Button {...props}>Filters</Button>}>
            <div className="dialog-fields">
              <CheckboxGroup
                label="Show"
                name="show"
                defaultValue={['open']}
                items={[
                  { value: 'open', label: 'Only open issues' },
                  { value: 'mine', label: 'Assigned to me' },
                ]}
              />
              <RadioGroup
                label="Sort"
                name="sort"
                defaultValue="newest"
                items={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                ]}
              />
            </div>
          </Popover>
          <Popover
            title="Share"
            closeButton
            placement="bottom-end"
            onOpenChange={logOverlay('share')}
            trigger={(props) => (
              <Button emphasis="low" {...props}>
                Share…
              </Button>
            )}
          >
            <Field label="Link" hint="Anyone with the link can view">
              <Input readOnly defaultValue="https://example.com/p/atlas" />
            </Field>
          </Popover>
          <span style={{ flex: 1 }} />
          {[
            ['Bold (Ctrl+B)', 'Bold', <b key="b">B</b>],
            ['Italic (Ctrl+I)', 'Italic', <i key="i">I</i>],
            ['Underline (Ctrl+U)', 'Underline', <u key="u">U</u>],
          ].map(([content, label, glyph]) => (
            <Tooltip
              key={label as string}
              content={content}
              trigger={(props) => (
                <Button emphasis="minimal" size="sm" aria-label={label as string} {...props}>
                  {glyph}
                </Button>
              )}
            />
          ))}
          <Tooltip
            content="Shown below, when there is room"
            placement="bottom"
            trigger={(props) => (
              <Button emphasis="minimal" size="sm" {...props}>
                Below
              </Button>
            )}
          />
        </div>
        <pre className="state">{overlayLog}</pre>
      </section>

      <section id="menubar">
        <h2>Menubar</h2>
        <Menubar
          label="Application"
          mnemonics
          menus={appMenus(view)}
          onSelect={(value, { checked, menu }) => {
            const next = applyView(view, value, checked)
            setView(next)
            setMenuLog(next === view ? `chose ${menu} / ${value}` : describeView(next))
          }}
        />
        <pre className="state">{menuLog}</pre>
        <p className="hint">A menubar: Tab reaches it once, arrows walk it, Enter or ArrowDown opens a menu. While a menu is open, ArrowLeft and ArrowRight move between menus, and so does the pointer. Hold Alt to see the access keys; Alt+F opens File, F10 goes to the bar.</p>
      </section>

      <section id="menu">
        <h2>Menu</h2>
        <div className="row" style={{ alignItems: 'center' }}>
          <Menu
            items={documentMenu}
            onSelect={(value) => setMenuLog(`chose ${value}`)}
            trigger={(props) => <Button {...props}>Document</Button>}
          />
          <Menu
            label="View options"
            closeOnSelect={false}
            items={viewMenu(view)}
            onSelect={(value, { checked }) => {
              const next = applyView(view, value, checked)
              setView(next)
              setMenuLog(describeView(next))
            }}
            trigger={(props) => (
              <Button emphasis="low" {...props}>
                View
              </Button>
            )}
          />
        </div>
        <pre className="state">{menuLog}</pre>
        <p className="hint">A menu button: arrows walk every item, disabled ones too, and wrap; a letter jumps to an item; Enter or a click chooses. The view menu stays open while you toggle: the page owns the state and passes new items back.</p>
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
