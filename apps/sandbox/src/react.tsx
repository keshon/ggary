import './theme'
import './shared.css'

import { StrictMode, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Avatar,
  AvatarGroup,
  Badge,
  Banner,
  Button,
  Breadcrumbs,
  ButtonGroup,
  Card,
  Checkbox,
  CheckboxGroup,
  Chip,
  ChipGroup,
  ChoiceCardGroup,
  Dialog,
  EmptyState,
  Field,
  Fieldset,
  FileDrop,
  Input,
  InputGroup,
  Menu,
  Menubar,
  Nav,
  Note,
  NumberField,
  Pagination,
  Panel,
  Popover,
  RadioGroup,
  Search,
  Select,
  SegmentedControl,
  Sheet,
  Skeleton,
  Slider,
  Spinner,
  Steps,
  Switch,
  Tabs,
  Textarea,
  paginationRange,
  Toaster,
  toast,
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  Tooltip,
} from '@ggary/react'
import { agentsText, badgeTones, crumbs, densities, importSteps, navGroups, people, runExtras, runModes, viewModes, toastDemos, newFile, openFiles, propertyPanels, propertyTabs, appMenus, applyView, describeView, documentMenu, frameworks, initialView, roles, tags, terms, viewMenu } from './demo-data'

function App() {
  const [value, setValue] = useState<string | null>('react')
  const [lastEvent, setLastEvent] = useState('—')
  const [refreshes, setRefreshes] = useState(0)
  const [diskBanner, setDiskBanner] = useState(true)
  const [viewMode, setViewMode] = useState('list')
  const [density, setDensity] = useState('regular')
  const [agents, setAgents] = useState(6)
  const [position, setPosition] = useState({ x: 128, y: 0, z: -64 })
  const [mode, setMode] = useState('parallel')
  const [extras, setExtras] = useState<string[]>([])
  const [chosenFiles, setChosenFiles] = useState<File[]>([])
  const [page, setPage] = useState(8)
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
  const [files, setFiles] = useState(openFiles)
  const [tabsLog, setTabsLog] = useState('pick a tab')
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

          <Sheet
            title="Run parameters"
            description="Applied to the next run."
            onOpenChange={logDialog('parameters sheet')}
            trigger={(props) => (
              <Button emphasis="low" {...props}>
                Parameters…
              </Button>
            )}
            footer={
              <form method="dialog">
                <Button emphasis="high" type="submit" value="apply">
                  Apply
                </Button>
              </form>
            }
          >
            <div className="dialog-fields">
              <Select label="Model" items={roles} defaultValue="editor" />
              <Field label="Agents" hint="1 to 12">
                <Input type="number" defaultValue="7" />
              </Field>
              <Switch defaultChecked>Keep logs</Switch>
            </div>
          </Sheet>

          <Sheet
            side="start"
            size="sm"
            title="Sections"
            onOpenChange={logDialog('sections sheet')}
            trigger={(props) => (
              <Button emphasis="minimal" {...props}>
                Sections (start edge)
              </Button>
            )}
          >
            <p>Runs</p>
            <p>Artefacts</p>
            <p>Settings</p>
          </Sheet>
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

      <section id="toast">
        <h2>Toast</h2>
        <div className="row">
          <Button onClick={() => toast({ ...toastDemos.queued })}>Success</Button>
          <Button onClick={() => toast({ ...toastDemos.failed })}>Error that stays</Button>
          <Button onClick={() => toast({ ...toastDemos.warn })}>Warning</Button>
          <Button
            emphasis="low"
            onClick={() => {
              const id = toast({ tone: 'running', title: 'Saving…', duration: 0 })
              setTimeout(() => toast({ id, tone: 'ok', title: 'Saved' }), 1500)
            }}
          >
            Saving, then saved
          </Button>
          <Button
            emphasis="minimal"
            onClick={() => toast({ title: 'Task deleted', action: { label: 'Undo', onClick: () => toast({ title: 'Task restored' }) } })}
          >
            With an action
          </Button>
        </div>
        <p className="hint">Toasts stand in the top layer and leave after five seconds; an error stays until dismissed. Rest the pointer on one, or tab to its button, and time stands still. They are announced through live regions that exist before the first toast.</p>
        <Toaster />
      </section>

      <section id="tabs">
        <h2>Tabs</h2>
        <Tabs items={propertyTabs} label="Object properties" onValueChange={(value) => setTabsLog(`selected ${value}`)}>
          {(item) => <p>{propertyPanels[item.value]}</p>}
        </Tabs>
        <div className="row" style={{ alignItems: 'center', marginBlockStart: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Tabs
              items={files}
              variant="chips"
              label="Open files"
              onValueChange={(value) => setTabsLog(`selected ${value}`)}
              onClose={(value) => {
                setFiles((current) => current.filter((file) => file.value !== value))
                setTabsLog(`closed ${value}`)
              }}
            >
              {(item) => <p>Editing {item.label}</p>}
            </Tabs>
          </div>
          <Button emphasis="low" onClick={() => setFiles((current) => [...current, newFile()])}>
            New file
          </Button>
        </div>
        <pre className="state">{tabsLog}</pre>
        <p className="hint">Tab reaches the tab list once; the arrows move and select. Open files close with their button, Delete or a middle click, and the neighbour takes over; a dot marks unsaved changes.</p>
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

      <section id="controls">
        <h2>Segmented control</h2>
        <div className="row" style={{ alignItems: 'center' }}>
          <SegmentedControl items={viewModes} label="View mode" value={viewMode} onValueChange={setViewMode} />
          <SegmentedControl items={densities} label="Row density" size="sm" value={density} onValueChange={setDensity} />
        </div>
        <pre className="state">{`view mode is ${viewMode}, density is ${density}`}</pre>
        <p className="hint">A segmented control is native radios: one Tab stop, the arrow keys move and choose, the value submits with the form. The chosen segment is a surface and a border, never colour alone, and its weight does not change — a bolder label would shift the segments after it.</p>

        <h2 style={{ marginTop: 32 }}>Slider</h2>
        <div className="controls">
          <Slider label="Parallel agents" min={0} max={16} value={agents} onValueChange={setAgents} showValue formatValue={agentsText} />
          <Field label="Confidence threshold" hint="Below it the agent asks before acting">
            <Slider min={0} max={100} step={5} defaultValue={80} showValue />
          </Field>
        </div>
        <p className="hint">A native range input: the keys, the step and the announcement are the platform’s. The track is filled up to the thumb, which CSS cannot do by itself, so the share is handed to the theme as a custom property. The number beside it is hidden from screen readers, which already hear the value.</p>

        <h2 style={{ marginTop: 32 }}>Number field</h2>
        <div className="vector">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <NumberField
              key={axis}
              axis={axis.toUpperCase()}
              label={`Position ${axis.toUpperCase()}`}
              value={position[axis]}
              onValueChange={(next) => setPosition((current) => ({ ...current, [axis]: next ?? 0 }))}
            />
          ))}
        </div>
        <div className="controls">
          <Field label="Opacity" hint="Between 0 and 1, in hundredths">
            <NumberField size="sm" step={0.01} min={0} max={1} defaultValue={0.5} />
          </Field>
        </div>
        <pre className="state">{`x ${position.x}  y ${position.y}  z ${position.z}`}</pre>
        <p className="hint">Drag the axis letter sideways to change the number — Shift is ten times faster, Alt a tenth. The letter is a handle, not a label: each field is named "Position X" in full, because three squares marked X, Y and Z say nothing on their own.</p>
      </section>

      <section id="navigation">
        <h2>Breadcrumbs</h2>
        <Breadcrumbs items={crumbs} />
        <p className="hint">Breadcrumbs answer "where am I and how do I get one level up" — not "what else is there". An ordered list inside a named landmark, and the last crumb is the page itself: text, never a link to where you already are. The chevron is drawn, so it reaches neither a screen reader nor a copy of the path.</p>

        <h2 style={{ marginTop: 32 }}>Nav</h2>
        <div className="nav-demo">
          <Nav
            label="Sections"
            groups={navGroups.map((group, index) => ({
              ...group,
              items: group.items.map((item, itemIndex) => ({ ...item, current: index === 0 && itemIndex === 0 })),
            }))}
          />
          <Panel
            title="Runs"
            toolbar={
              <Toolbar label="Run tools">
                <Button size="sm" emphasis="minimal">Filter</Button>
                <Button size="sm" emphasis="minimal">Sort</Button>
                <ToolbarSeparator />
                <Button size="sm" emphasis="minimal">Export</Button>
                <ToolbarSpacer />
                <Badge tone="running">7 running</Badge>
              </Toolbar>
            }
          >
            <p>Rows would stand here.</p>
          </Panel>
        </div>
        <p className="hint">Every item is a real link, so the middle click and "open in a new tab" work. The current one is marked by a bar at its edge as well as a surface, and by aria-current — never by colour alone. Naming a strip makes it a toolbar: one Tab stop, and the arrows move between the tools — so the name is only taken when the behaviour is there. A separator groups; one spacer pushes the tail to the far edge.</p>

        <h2 style={{ marginTop: 32 }}>Pagination</h2>
        <Pagination
          items={paginationRange({ page, pages: 24, previousLabel: 'Back', nextLabel: 'Forward', href: (n: number) => `#p${n}` })}
          onPageChange={(next, event) => {
            event.preventDefault()
            setPage(next)
          }}
        />
        <pre className="state">{`page ${page}`}</pre>
        <p className="hint">Pages are addresses, so these are links. At the edges the link stays reachable and is spoken as unavailable (aria-disabled): removing it would move the focus mid-journey. An ellipsis is only drawn when it stands for more than one page.</p>

        <h2 style={{ marginTop: 32 }}>Steps</h2>
        <Steps items={importSteps} label="Import" />
        <p className="hint">The bar says where the process is; the word under the name says it again in language, which is what survives a printout and a reader who cannot tell the shades apart.</p>
      </section>

      <section id="fields">
        <h2>Choice cards</h2>
        <div className="form-column">
          <ChoiceCardGroup items={runModes} label="Run mode" name="mode" value={mode} onValueChange={setMode} />
          <ChoiceCardGroup
            items={runExtras}
            type="checkbox"
            label="Also"
            name="extras"
            orientation="horizontal"
            value={extras}
            onValueChange={setExtras}
          />
        </div>
        <pre className="state">{`mode ${mode}  ·  also ${extras.join(', ') || 'nothing'}`}</pre>
        <p className="hint">A card is a bigger target for a real radio or checkbox — the box inside is the plain control, drawn by one rule. The heading and the explanation are inside the label, so both are the option’s name; the chosen one carries a border, a bar and its own check, never colour alone.</p>

        <h2 style={{ marginTop: 32 }}>Search, and a field with affixes</h2>
        <div className="form-column">
          <Field label="Search the runs" hint="By name, id or the agent that started it">
            <Search name="q" placeholder="worldgen" />
          </Field>
          <Field label="Budget" hint="Per agent, in dollars an hour">
            <InputGroup prefix="$" suffix="per hour">
              <Input type="number" name="budget" defaultValue="12" min={0} />
            </InputGroup>
          </Field>
          <InputGroup suffix=".example.com" size="sm">
            <Input name="subdomain" defaultValue="worldbox" aria-label="Subdomain" size="sm" />
          </InputGroup>
        </div>
        <p className="hint">A native search field: the clear cross and Escape are the browser’s, so no script is needed. The magnifier is decoration and hidden from screen readers — the work is named by the label. The border belongs to the group, not to the field inside it: two borders at the join give two lines, and focus would ring half the control. An affix names nothing, so put the unit in the label or the hint too.</p>

        <h2 style={{ marginTop: 32 }}>File drop</h2>
        <div className="form-column">
          <FileDrop
            name="import"
            accept=".json,.csv"
            multiple
            hint="Up to 20 MB, the formats .json and .csv"
            onFilesChange={setChosenFiles}
          />
        </div>
        <pre className="state">
          {chosenFiles.map((file) => `${file.name} (${Math.ceil(file.size / 1024)} KB)`).join(', ') || '—'}
        </pre>
        <p className="hint">Drag a file onto the zone, or press it and choose one. The input is clipped to a pixel rather than hidden, so Tab still reaches the zone; a drop writes the files into it, so the form submits them as if they had been chosen.</p>

        <h2 style={{ marginTop: 32 }}>Button group</h2>
        <div className="row">
          <ButtonGroup size="sm" label="Alignment">
            <Button size="sm" emphasis="medium">Left</Button>
            <Button size="sm" emphasis="medium">Centre</Button>
            <Button size="sm" emphasis="medium">Right</Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button emphasis="medium">Run</Button>
            <Button emphasis="medium">Schedule</Button>
          </ButtonGroup>
        </div>
        <p className="hint">Several different actions standing flush — unlike a segmented control, a group has no chosen one. Tab goes through every button, because each does its own thing.</p>
      </section>

      <section id="display">
        <h2>Badge, Avatar, Spinner and Skeleton</h2>
        <div className="row" style={{ alignItems: 'center' }}>
          {badgeTones.map(({ tone, label }) => (
            <Badge key={tone} tone={tone}>
              {label}
            </Badge>
          ))}
          <Badge variant="outline">v2.4</Badge>
          <Badge variant="count" tone="running">
            12
          </Badge>
        </div>
        <div className="row" style={{ alignItems: 'center', marginTop: 16 }}>
          <Avatar name="Ada Lovelace" size="sm" />
          <Avatar name="Alan Turing" />
          <Avatar name="Grace Hopper" size="lg" />
          <AvatarGroup label="Reviewers" people={people} max={3} />
          <Spinner label="Loading runs" size="sm" />
          <Spinner label="Loading runs" />
          <Spinner label="Loading runs" size="lg" />
        </div>
        <div className="tiles">
          <Card title="Loading…">
            <Skeleton title lines={3} />
          </Card>
        </div>
        <p className="hint">Badges state a status in words, never colour alone. An avatar shows initials until its picture has loaded, and keeps them if it fails. The spinner is a status with a name; the skeleton is hidden from assistive technology, so say what is loading elsewhere.</p>
      </section>

      <section id="regions">
        <h2>Card and Panel</h2>
        <div className="tiles">
          <Card title="Deployments" subtitle="Last 24 hours" rank="lead">
            42 successful, 1 rolled back.
          </Card>
          <Card title="Queue" interactive onClick={() => setRefreshes((count) => count + 1)}>
            Nothing waiting. Click to refresh.
          </Card>
          <Card title="Archive" rank="support">
            Runs older than 90 days.
          </Card>
          <Card title="Documentation" subtitle="docs.example.com" href="#regions">
            A link card: the whole card is the link.
          </Card>
        </div>
        <div className="panels">
          <Panel
            title="Runners"
            region
            actions={
              <Button emphasis="minimal" size="sm">
                Add runner
              </Button>
            }
          >
            <div className="banners">
              <Card title="runner-01" tone="ok">
                Idle, last job 2 minutes ago.
              </Card>
              <Note tone="warn">runner-02 has not reported for 5 minutes.</Note>
            </div>
          </Panel>
          <Panel title="Artifacts">
            <EmptyState title="No artifacts yet" description="Artifacts appear here after the first successful build.">
              <Button emphasis="low" size="sm">
                Start a build
              </Button>
            </EmptyState>
          </Panel>
        </div>
        <pre className="state">{refreshes ? `refreshed the queue ${refreshes}×` : '—'}</pre>
        <p className="hint">A card is an object on the page, a panel is a place. Rank sets the ground, the edge and the title size: lead, default, support. A region inside a region recedes. A tone tints only the ground.</p>
      </section>

      <section id="banners">
        <h2>Banner and Note</h2>
        <div className="banners">
          {diskBanner && (
            <Banner
              tone="warn"
              title="Disk almost full"
              onDismiss={() => setDiskBanner(false)}
              actions={
                <Button emphasis="low" size="sm">
                  Review
                </Button>
              }
            >
              Old snapshots will be pruned tonight.
            </Banner>
          )}
          <Banner tone="error" title="Build failed" live="alert">
            3 tests failed on main.
          </Banner>
          <Banner>Maintenance on Sunday, 02:00 UTC.</Banner>
          <Note>Notes are asides: the bar only groups, the words carry the meaning.</Note>
          <Note tone="error">Deleting a project cannot be undone.</Note>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <Button emphasis="minimal" onClick={() => setDiskBanner(true)}>
            Show the banner again
          </Button>
        </div>
        <p className="hint">A banner is about the whole screen and can carry actions; whether closing one hides it is for the page to decide. A note is an aside. With live set to alert, a message is announced when it appears.</p>
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
