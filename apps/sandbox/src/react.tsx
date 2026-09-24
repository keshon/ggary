import './theme'
import './shared.css'

import { StrictMode, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { DataGridController } from '@ggary/core/data-grid'
import { todayISO } from '@ggary/core'
import {
  assignLeads,
  debounce,
  exportLeads,
  leadColumns,
  leadFacts,
  leadMenu,
  leadSource,
  leadViews,
  managerItems,
  runLeadMenu,
  saveLead,
  searchCompanies,
  managerOptions,
  tagOptions,
  statusItems,
  statusTone,
  type Lead,
} from './leads'
import { attachColumnStorage, attachQueryToUrl } from '@ggary/core/data-grid'
import { applyMove, type KanbanMove } from '@ggary/core/kanban'
import { rangePresets } from '@ggary/core/date-picker'
import type { PaletteCommand } from '@ggary/core/command-palette'
import { createRoot } from 'react-dom/client'
import { Bar, Navigator } from './Chrome'
import {
  Avatar,
  AvatarGroup,
  Badge,
  Banner,
  Button,
  Breadcrumbs,
  ButtonGroup,
  DataGrid,
  GridBulkBar,
  GridColumns,
  GridDetail,
  GridFilters,
  GridRowMenu,
  Calendar,
  Combobox,
  DatePicker,
  TimePicker,
  Cascader,
  Accordion,
  Tree,
  Progress,
  Kanban,
  CommandPalette,
  Form,
  FormSummary,
  Gantt,
  Grid,
  PageHeader,
  Section,
  Stack,
  Rail,
  Shell,
  Split,
  StatusBar,
  StatusBarItem,
  StatusBarSpacer,
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
  Upload,
  List,
  ListItem,
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
  Metric,
  MetricRow,
  Meter,
  Ring,
  KeyValueList,
  FileChange,
  Timeline,
  Sparkline,
  Legend,
  Share,
  Heatmap,
  Run,
  Queue,
  History,
  Budget,
  StatusDot,
  Caret,
  CodeBlock,
  Step,
  Log,
  Diff,
  Lanes,
  Copyable,
  Inserts,
  Turn,
  Composer,
  Thinking,
  Approval,
  Failure,
  Divider,
  ContextMenu,
  Popconfirm,
  Result,
  Flex,
  FlexItem,
  Columns,
  Column,
  Link,
  Prose,
  Text,
} from '@ggary/react'
import { agentsText, badgeTones, crumbs, densities, importSteps, isWeekend, layoutLeads, navGroups, railItems, weekTiles, rolloutPlan, rolloutGroups, runMetrics, headlineMetrics, runFacts, changedFiles, runEvents, runTimeTrend, suiteSeries, suiteLegend, generatorSource, templateInserts, ganttScales, saveTaskDates, stageItems, dealFormRules, saveDealForm, sandboxCommands, dealStages, initialDeals, saveDealMove, saveNewDeal, dealMenu, dueOf, formatAmount, type Deal, leadSections, leadSectionText, projectTree, regions, teams, people, runExtras, runModes, viewModes, toastDemos, newFile, openFiles, propertyPanels, propertyTabs, appMenus, applyView, describeView, documentMenu, frameworks, initialView, roles, tags, terms, viewMenu, runBudgets, runWindow, runShards, dayOutcomes, runYear, chatThread, chatFailure, chatApproval, runPhases, runCounters, runTasks, runSpending, runHistory, runHistoryHours, filtersExcerpt, filtersBefore, filtersAfter, shardOutput, runLines, runNextLine, runLanes, controlSizes, sizePlaces, proseSample, fileMenu, fileRows, slowDelete, demoUpload, stagedUpload, stagedRowFiles, stagedTileFiles, stageDrop, avatarPicture, reviewers, reviewersLater, type Reviewer } from './demo-data'

/**
 * Upload's states on the page as it loads: once the Upload inside is there, a
 * drop of `files` is staged on it. Once only — StrictMode runs the effect twice.
 */
function Staged({ files, className, children }: { files: () => File[] | Promise<File[]>; className?: string; children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null)
  const staged = useRef(false)
  useEffect(() => {
    if (staged.current) return
    staged.current = true
    requestAnimationFrame(async () => {
      const list = await files()
      if (host.current) stageDrop(host.current, list)
    })
  }, [files])
  return (
    <div ref={host} className={className}>
      {children}
    </div>
  )
}

function App() {
  const [value, setValue] = useState<string | null>('react')
  const [lastEvent, setLastEvent] = useState('—')
  const [refreshes, setRefreshes] = useState(0)
  const [diskBanner, setDiskBanner] = useState(true)
  const [viewMode, setViewMode] = useState('list')
  const [density, setDensity] = useState('regular')
  const [agents, setAgents] = useState(6)
  const [agentTask, setAgentTask] = useState<string | null>('coverage-hole')
  const [position, setPosition] = useState({ x: 128, y: 0, z: -64 })
  const [mode, setMode] = useState('parallel')
  const [extras, setExtras] = useState<string[]>([])
  const [chosenFiles, setChosenFiles] = useState<File[]>([])
  const [uploadLog, setUploadLog] = useState('—')
  const [listRows, setListRows] = useState<Reviewer[]>(reviewers)
  const [listLog, setListLog] = useState('—')
  const person = (who: Reviewer) => ({
    leading: <Avatar name={who.name} size="sm" decorative />,
    meta: (
      <>
        <Badge tone={who.tone}>{who.word}</Badge>
        <span>{who.when}</span>
      </>
    ),
    actions: (
      <Button size="sm" emphasis="minimal" aria-label={`More for ${who.name}`} onClick={() => setListLog(`menu for ${who.name}`)}>
        <span data-icon="more" aria-hidden="true" />
      </Button>
    ),
  })
  const [page, setPage] = useState(8)
  const [leadGrid, setLeadGrid] = useState<DataGridController<Lead>>()
  const [leadLog, setLeadLog] = useState('—')
  const [comboLog, setComboLog] = useState('—')
  const [dateLog, setDateLog] = useState('—')
  const [timeLog, setTimeLog] = useState('—')
  const [placeLog, setPlaceLog] = useState('—')
  const [boardLog, setBoardLog] = useState('—')
  const [deals, setDeals] = useState(initialDeals)
  const [paletteCommands, setPaletteCommands] = useState<PaletteCommand[]>([])
  const [paletteLog, setPaletteLog] = useState('—')
  const [tagList, setTagList] = useState(tagOptions)
  const [dealFormLog, setDealFormLog] = useState('idle')
  const [ganttScale, setGanttScale] = useState<'day' | 'week' | 'month'>('day')
  const [ganttLog, setGanttLog] = useState('—')
  const [rolloutTasks, setRolloutTasks] = useState(rolloutPlan)
  // The agent run the chat section shows: it is still working, so the last
  // turn streams, the composer's control stops rather than sends, and the two
  // blocks that stopped the run are still waiting for a human.
  const [running, setRunning] = useState(true)
  const [draft, setDraft] = useState('')
  const [chatLog, setChatLog] = useState('—')
  const [decision, setDecision] = useState<'pending' | 'approved' | 'denied'>('pending')
  const [breakdown, setBreakdown] = useState<'pending' | 'resolved' | 'given-up'>('pending')
  const [streamLines, setStreamLines] = useState(runLines)
  const [wholeFile, setWholeFile] = useState(false)
  const [streamLog, setStreamLog] = useState('—')
  // The sections are read from the page once it is drawn.
  useEffect(() => setPaletteCommands(sandboxCommands((text) => toast({ tone: 'neutral', title: text }))), [])
  const searchLeadCommands = async (query: string, signal: AbortSignal): Promise<PaletteCommand[]> =>
    (await searchCompanies(query, signal)).items.map((item) => ({ id: `lead:${item.value}`, label: item.label, description: item.description }))
  const [dealLog, setDealLog] = useState('—')
  const moveDeal = async (move: KanbanMove<Deal>) => {
    await saveDealMove(move.card, move.to.column)
    setDeals((current) => applyMove(current, move))
    setDealLog(`moved: ${move.card.title} → ${move.to.column}, ${move.to.index + 1}`)
  }
  const addDeal = async (column: string, title: string) => {
    await saveNewDeal(title)
    setDeals((current) => [...current, { id: `new-${Date.now()}`, column, title, company: 'New lead' }])
    setDealLog(`added: ${title} → ${column}`)
  }
  const [imported, setImported] = useState<number | null>(0)
  const runImport = () => {
    setImported(null)
    let done = 0
    const timer = setInterval(() => {
      done += 7
      setImported(Math.min(done, 120))
      if (done >= 120) clearInterval(timer)
    }, 250)
  }
  const searchLeads = useMemo(() => debounce((text: string) => leadGrid?.send({ type: 'SET_SEARCH', search: text })), [leadGrid])
  useEffect(() => {
    if (!leadGrid) return
    const stopUrl = attachQueryToUrl(leadGrid)
    const stopColumns = attachColumnStorage(leadGrid, 'gg-sandbox-leads-columns')
    return () => {
      stopUrl()
      stopColumns()
    }
  }, [leadGrid])
  const exportAll = async () => {
    if (!leadGrid) return
    const id = toast({ tone: 'running', title: 'Exporting…', duration: 0 })
    const count = await exportLeads(leadGrid, (done, total) => toast({ id, tone: 'running', title: `Exporting… ${Math.round((done / total) * 100)}%` }))
    toast({ id, tone: 'ok', title: `Exported ${count.toLocaleString('en-US')} leads` })
  }
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
  const [fileLog, setFileLog] = useState('right-click a file, or Shift+F10 on one')
  const [confirmLog, setConfirmLog] = useState('—')

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
      <div className="category" aria-labelledby="actions">
        <h2 className="category-title" id="actions"><span className="category-number" aria-hidden="true">01</span>Actions</h2>
        <section id="button-emphasis">
          <h3>Button — emphasis</h3>
          <div className="row">
            <Button emphasis="high">high</Button>
            <Button emphasis="medium">medium</Button>
            <Button emphasis="low">low</Button>
            <Button emphasis="minimal">minimal</Button>
          </div>
        </section>

        <section id="button-tone">
          <h3>Button — destructive, across emphasis</h3>
          <div className="row">
            <Button emphasis="high" destructive>high</Button>
            <Button emphasis="medium" destructive>medium</Button>
            <Button emphasis="low" destructive>low</Button>
            <Button emphasis="minimal" destructive>minimal</Button>
          </div>
        </section>

        <section id="button-sizes">
          <h3>Button — sizes and states</h3>
          <div className="row">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section id="button-group">
          <h3>Button group</h3>
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
        </section>

        <section id="chip">
          <h3>Chip — standalone</h3>
          <div className="row">
            <Chip>low</Chip>
            <Chip emphasis="medium">medium</Chip>
            <Chip emphasis="high">high</Chip>
            <Chip selected>Selected</Chip>
            <Chip size="sm">Small</Chip>
            <Chip onRemove={() => alert('removed')}>Dismiss me</Chip>
          </div>
        </section>

        <section id="chip-group-multi">
          <h3>ChipGroup — multi select, removable</h3>
          <ChipGroup
            items={items}
            label="Tags"
            mode="multi"
            removable
            name="tags"
            defaultValue={['design']}
            onValueChange={(next) => setSelection(next)}
            onRemove={(value) => setItems((current) => current.filter((i) => i.value !== value))}
          />
          <pre className="state">
            {`selection  ${JSON.stringify(selection)}\nitems      ${items.length}`}
          </pre>
          <div className="row" style={{ marginTop: 12 }}>
            <Button size="sm" onClick={() => setItems(tags)}>
              Restore removed
            </Button>
          </div>
        </section>

        <section id="chip-group-single">
          <h3>ChipGroup — single select, vertical</h3>
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

        <section id="menu">
          <h3>Menu</h3>
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
        </section>

        <section id="menubar">
          <h3>Menubar</h3>
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
        </section>

        <section id="context-menu">
          <h3>Context menu</h3>
          <ul className="demo" style={{ listStyle: 'none', padding: 0, maxWidth: 360 }}>
            {fileRows.map((file) => (
              <ContextMenu
                key={file}
                items={fileMenu}
                label={`Actions for ${file}`}
                onSelect={(value) => setFileLog(`${value} ${file}`)}
                trigger={(props) => (
                  <li>
                    <button type="button" className="file-row" {...props} onClick={() => setFileLog(`open ${file}`)}>
                      {file}
                    </button>
                  </li>
                )}
              />
            ))}
          </ul>
          <pre className="state">{fileLog}</pre>
        </section>

        <section id="palette">
          <h3>Command palette</h3>
          <CommandPalette
            commands={paletteCommands}
            load={searchLeadCommands}
            onRun={(command) => setPaletteLog(`ran: ${command.label}`)}
            trigger={(props) => (
              <Button {...props} emphasis="medium">
                Search or run a command… <kbd className="kbd">Ctrl K</kbd>
              </Button>
            )}
          />
          <pre className="state">{paletteLog}</pre>
        </section>
      </div>

      <div className="category" aria-labelledby="inputs">
        <h2 className="category-title" id="inputs"><span className="category-number" aria-hidden="true">02</span>Inputs</h2>
        <section id="field-input">
          <h3>Field + Input</h3>
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
        </section>

        <section id="input-sizes">
          <h3>Input — sizes</h3>
          <div className="fields">
            <Field label="Small"><Input size="sm" placeholder="sm" /></Field>
            <Field label="Medium"><Input placeholder="md" /></Field>
            <Field label="Large"><Input size="lg" placeholder="lg" /></Field>
            <Input type="search" aria-label="Search" placeholder="No field, just an input" />
          </div>
        </section>

        <section id="field-invalid">
          <h3>Field — invalid declared by the owner</h3>
          <div className="row">
            <Field label="Username" hint="Letters and digits" error="That username is taken" invalid={taken}>
              <Input value={username} onValueChange={setUsername} />
            </Field>
            <Button onClick={() => setTaken((t) => !t)}>Toggle “taken”</Button>
          </div>
          <pre className="state">{`value    ${JSON.stringify(username)}\ninvalid  ${taken}`}</pre>
        </section>

        <section id="field-validated">
          <h3>Field — a validated form</h3>
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

        <section id="textarea">
          <h3>Textarea</h3>
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

        <section id="checkbox">
          <h3>Checkbox</h3>
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
        </section>

        <section id="switch">
          <h3>Switch</h3>
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

        <section id="radio-group">
          <h3>Radio group</h3>
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

        <section id="fieldset">
          <h3>Fieldset and CheckboxGroup</h3>
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

        <section id="select-uncontrolled">
          <h3>Select — uncontrolled</h3>
          <div className="row">
            <Select items={frameworks} label="Framework" placeholder="Pick one…" />
            <Select items={frameworks} label="With a default" defaultValue="svelte" />
            <Select items={frameworks} label="Disabled" disabled />
            <Select items={[]} label="No options" />
          </div>
        </section>

        <section id="select-controlled">
          <h3>Select — controlled</h3>
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
        </section>

        <section id="combobox">
          <h3>Combobox</h3>
          <div className="fields">
            <Combobox label="Manager" items={managerOptions} placeholder="Anyone" onValueChange={(value) => setComboLog(`manager: ${value.join(', ') || '—'}`)} />
            <Combobox
              label="Tags"
              items={tagList}
              multiple
              defaultValue={['renewal', 'partner']}
              placeholder="Add a tag"
              name="tags"
              onCreate={(text) => {
                const tag = { value: text.toLowerCase().replace(/\s+/g, '-'), label: text }
                setTagList((current) => [...current, tag])
                return tag
              }}
            />
            <Combobox
              label="Company"
              load={searchCompanies}
              placeholder="Search 700,000 leads"
              words={{ locale: 'en-US', more: (shown, total) => `${shown} of ${total.toLocaleString('en-US')} — type to narrow` }}
              onValueChange={(value, chosen) => setComboLog(`company: ${chosen[0]?.label ?? '—'}`)}
            />
          </div>
          <pre className="state">{comboLog}</pre>
        </section>

        <section id="cascader">
          <h3>Cascader</h3>
          <div className="fields">
            <Cascader label="City" items={regions} defaultValue={['ru', 'tat', 'kzn']} name="city" onValueChange={(value) => setPlaceLog(`city: ${value.join(' / ')}`)} />
            <Cascader label="Team" items={teams} selectParents placeholder="Any team" onValueChange={(value) => setPlaceLog(`team: ${value.join(' / ')}`)} />
          </div>
          <pre className="state">{placeLog}</pre>
        </section>

        <section id="dates">
          <h3>Date picker and calendar</h3>
          <div className="fields">
            <DatePicker label="Follow up on" locale="en-GB" min={todayISO()} onValueChange={(value) => setDateLog(`follow up: ${value.start ?? '—'}`)} name="follow" />
            <DatePicker label="Registered between" mode="range" locale="en-GB" presets={rangePresets()} onValueChange={(value) => setDateLog(`registered: ${value.start ?? '…'} – ${value.end ?? '…'}`)} />
            <DatePicker label="Stay" mode="range" months={2} locale="en-GB" onValueChange={(value) => setDateLog(`stay: ${value.start ?? '…'} – ${value.end ?? '…'}`)} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Calendar locale="en-GB" isDateDisabled={isWeekend} onValueChange={(value) => setDateLog(`call on: ${value.start}`)} />
          </div>
          <pre className="state">{dateLog}</pre>
        </section>

        <section id="times">
          <h3>Time picker</h3>
          <div className="fields">
            <TimePicker label="Call at" locale="en-GB" min="08:00" max="20:00" isTimeDisabled={(time) => time >= '13:00' && time < '14:00'} onValueChange={(value) => setTimeLog(`call at: ${value ?? '—'}`)} name="call" />
            <TimePicker label="Reminder (12-hour)" locale="en-US" step={30} defaultValue="09:30" onValueChange={(value) => setTimeLog(`reminder: ${value ?? '—'}`)} />
            <DatePicker label="Meeting starts" time locale="en-GB" min={todayISO()} onValueChange={(value) => setTimeLog(`meeting: ${value ?? 'day and time both needed'}`)} name="meeting" />
          </div>
          <pre className="state">{timeLog}</pre>
        </section>

        <section id="controls">
          <h3>Segmented control</h3>
          <div className="row" style={{ alignItems: 'center' }}>
            <SegmentedControl items={viewModes} label="View mode" value={viewMode} onValueChange={setViewMode} />
            <SegmentedControl items={densities} label="Row density" size="sm" value={density} onValueChange={setDensity} />
          </div>
          <pre className="state">{`view mode is ${viewMode}, density is ${density}`}</pre>
  
          <h3 id="slider" style={{ marginTop: 32 }}>Slider</h3>
          <div className="controls">
            <Slider label="Parallel agents" min={0} max={16} value={agents} onValueChange={setAgents} showValue formatValue={agentsText} />
            <Field label="Confidence threshold" hint="Below it the agent asks before acting">
              <Slider min={0} max={100} step={5} defaultValue={80} showValue />
            </Field>
          </div>
  
          <h3 id="number-field" style={{ marginTop: 32 }}>Number field</h3>
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
        </section>

        <section id="fields">
          <h3>Choice cards</h3>
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
  
          <h3 id="search" style={{ marginTop: 32 }}>Search, and a field with affixes</h3>
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
  
          <h3 id="file-drop" style={{ marginTop: 32 }}>File drop</h3>
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

          <h3 id="upload" style={{ marginTop: 32 }}>Upload — every state</h3>
          <p className="note">Going (64%), there, failed with Retry, too large, going without saying how far, the wrong type, and waiting for a place — two go at a time.</p>
          <Staged files={stagedRowFiles} className="form-column">
            <Upload upload={stagedUpload} concurrency={2} name="attachments" accept=".pdf,.docx,image/*" maxSize={20_000_000} label="Drop files here or browse" hint="PDF, DOCX or images · up to 20 MB each" locale="en-GB" />
          </Staged>

          <h3 id="upload-tiles" style={{ marginTop: 32 }}>Upload — tiles</h3>
          <p className="note">Going, there, failed, and not a picture; beside it, an avatar's one tile, already there.</p>
          <div className="row" style={{ gap: 48, alignItems: 'flex-start' }}>
            <Staged files={stagedTileFiles}>
              <Upload upload={stagedUpload} view="tiles" accept="image/*" maxSize={5_000_000} label="Add photo" hint="JPG, PNG or WebP · up to 5 MB" locale="en-GB" />
            </Staged>
            <Upload upload={demoUpload} view="tiles" accept="image/*" maxFiles={1} label="Avatar" hint="One picture; a new one replaces it" locale="en-GB" defaultFiles={[{ name: 'avatar.png', url: avatarPicture }]} />
          </div>

          <h3 id="upload-try" style={{ marginTop: 32 }}>Upload — try it</h3>
          <p className="note">Sent as chosen, at about 2 MB a second. A name with "fail" in it fails half way; "slow" never says how far.</p>
          <div className="form-column">
            <Upload
              upload={demoUpload}
              name="documents"
              accept=".pdf,.docx,image/*"
              maxSize={20_000_000}
              label="Drop files here or browse"
              hint="PDF, DOCX or images · up to 20 MB each"
              locale="en-GB"
              defaultFiles={[{ name: 'brief-v1.pdf', size: 1_240_000, value: 'k-brief' }]}
              onFilesChange={(items) => setUploadLog(items.map((item) => `${item.name}: ${item.status}`).join(', ') || '—')}
            />
          </div>
          <pre className="state">{uploadLog}</pre>

          </section>

        <section id="form">
          <h3>Form — rules, a server and a summary</h3>
          <Form
            className="stack form-column"
            validate={dealFormRules}
            onSubmit={async (data) => {
              const answer = await saveDealForm(data)
              if (!answer) setDealFormLog(`saved: ${[...data.entries()].map(([key, value]) => `${key}=${String(value)}`).join(', ')}`)
              return answer
            }}
            onStatusChange={(status) => setDealFormLog((log) => (status === 'submitted' ? log : status))}
          >
            <FormSummary />
            <Field name="title" label="Deal title">
              <Input name="title" required />
            </Field>
            <Combobox name="company" label="Company" load={searchCompanies} placeholder="Type to search" />
            <Select name="stage" label="Stage" items={stageItems} placeholder="Choose a stage" />
            <Field name="amount" label="Amount, ₽" hint="Required once an offer is sent">
              <Input name="amount" type="number" min={0} step={1000} />
            </Field>
            <DatePicker name="due" label="Close by" locale="en-GB" />
            <Field name="contact" label="Contact email">
              <Input name="contact" type="email" />
            </Field>
            <div className="row">
              <Button emphasis="high" type="submit">
                Create deal
              </Button>
            </div>
          </Form>
          <pre className="state">{dealFormLog}</pre>
        </section>

        <section id="native-form">
          <h3>Native form participation</h3>
          <form className="demo" onSubmit={onSubmit} onReset={() => setFormOutput('reset')}>
            <Select items={frameworks} name="framework" label="framework" placeholder="Required…" />
            <Button emphasis="high" type="submit">Submit</Button>
            <Button type="reset" emphasis="minimal">
              Reset
            </Button>
          </form>
          <pre className="state">{formOutput}</pre>
        </section>

        <section id="sizes">
          <h3>Sizes: one row, one height</h3>
          {controlSizes.map((size) => (
            <div key={size} className="row" style={{ marginBottom: 16 }}>
              <Input size={size} aria-label={`Name, ${size}`} placeholder={`Input ${size}`} style={{ width: 150 }} />
              <Select size={size} label={`Select ${size}`} items={frameworks} placeholder="Framework" />
              <Combobox size={size} label={`Combobox ${size}`} items={frameworks} />
              <Cascader size={size} label={`Cascader ${size}`} items={sizePlaces} />
              <DatePicker size={size} label={`Date ${size}`} />
              <NumberField size={size} aria-label={`Count, ${size}`} defaultValue={3} />
              <Button size={size} emphasis="high">
                Save
              </Button>
            </div>
          ))}
          <Stack>
            {controlSizes.map((size) => (
              <div key={size} className="row" style={{ alignItems: 'center' }}>
                <SegmentedControl size={size} label={`View, ${size}`} items={densities} defaultValue={densities[0].value} />
                <Chip size={size}>{size}</Chip>
                <Pagination size={size} label={`Pages, ${size}`} items={paginationRange({ page: 3, pages: 9, href: (page: number) => `#sizes-${page}` })} />
              </div>
            ))}
          </Stack>
        </section>
      </div>

      <div className="category" aria-labelledby="overlays">
        <h2 className="category-title" id="overlays"><span className="category-number" aria-hidden="true">03</span>Overlays</h2>
        <section id="dialog">
          <h3>Dialog</h3>
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
                <Button destructive {...props}>
                  Delete project…
                </Button>
              )}
              footer={
                <>
                  <Button emphasis="minimal" onClick={() => (setDeleteOpen(false), setDialogLog('delete  closed  by Cancel'))}>
                    Cancel
                  </Button>
                  <Button emphasis="high" destructive onClick={() => (setDeleteOpen(false), setDialogLog('delete  closed  by Delete'))}>
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

        <section id="popover">
          <h3>Popover and Tooltip</h3>
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

        <section id="popconfirm">
          <h3>Popconfirm</h3>
          <div className="row" style={{ alignItems: 'center' }}>
            <Popconfirm
              title="Delete this lead?"
              description="Its history goes with it. This cannot be undone."
              destructive
              confirmLabel="Delete"
              onConfirm={() => slowDelete().then(() => setConfirmLog('deleted'))}
              onCancel={() => setConfirmLog('kept')}
              trigger={(props) => (
                <Button {...props} destructive>
                  Delete lead
                </Button>
              )}
            />
            <Popconfirm
              title="Publish the page now?"
              confirmLabel="Publish"
              onConfirm={() => setConfirmLog('published')}
              trigger={(props) => <Button {...props}>Publish</Button>}
            />
          </div>
          <pre className="state">{confirmLog}</pre>
        </section>

        <section id="toast">
          <h3>Toast</h3>
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
          <Toaster />
        </section>
      </div>

      <div className="category" aria-labelledby="navigation-group">
        <h2 className="category-title" id="navigation-group"><span className="category-number" aria-hidden="true">04</span>Navigation</h2>
        <section id="tabs">
          <h3>Tabs</h3>
          <Tabs items={propertyTabs} label="Object properties" onValueChange={(value) => setTabsLog(`selected ${value}`)}>
            {(item) => <p>{propertyPanels[item.value]}</p>}
          </Tabs>
          <div className="row" style={{ alignItems: 'center', marginBlockStart: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Tabs
                items={files}
                variant="documents"
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
        </section>

        <section id="navigation">
          <h3>Breadcrumbs</h3>
          <Breadcrumbs items={crumbs} />
  
          <h3 id="nav" style={{ marginTop: 32 }}>Nav</h3>
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
  
          <h3 id="pagination" style={{ marginTop: 32 }}>Pagination</h3>
          <Pagination
            items={paginationRange({ page, pages: 24, previousLabel: 'Back', nextLabel: 'Forward', href: (n: number) => `#p${n}` })}
            onPageChange={(next, event) => {
              event.preventDefault()
              setPage(next)
            }}
          />
          <pre className="state">{`page ${page}`}</pre>
  
          <h3 id="steps" style={{ marginTop: 32 }}>Steps</h3>
          <Steps items={importSteps} label="Import" />
        </section>
      </div>

      <div className="category" aria-labelledby="layout-group">
        <h2 className="category-title" id="layout-group"><span className="category-number" aria-hidden="true">05</span>Layout</h2>
        <section id="layout">
          <h3>Shell and split</h3>
          <div className="shell-demo">
            <Shell
              brand={<a href="#layout">Leads</a>}
              aside={<Nav label="Sections" groups={navGroups.map((group, index) => ({ ...group, items: group.items.map((item, itemIndex) => ({ ...item, current: index === 0 && itemIndex === 0 })) }))} />}
              header={<Breadcrumbs items={crumbs} />}
              footer={
                <StatusBar label="Registry status">
                  <StatusBarItem>main</StatusBarItem>
                  <StatusBarItem tone="error">3 failed saves</StatusBarItem>
                  <StatusBarSpacer />
                  <StatusBarItem>700,000 leads</StatusBarItem>
                  <Button size="sm" emphasis="minimal">Sync</Button>
                </StatusBar>
              }
            >
              <Split label="Resize the lead list" collapsible defaultSize={260} min={180} max={420} restMin={220} style={{ blockSize: '100%' }}>
                <ul>
                  {layoutLeads.map((lead) => (
                    <li key={lead}>{lead}</li>
                  ))}
                </ul>
                <article>
                  <h3 style={{ marginTop: 0 }}>Acme Labs 214</h3>
                  <p>The lead would stand here, beside the list it was picked from.</p>
                </article>
              </Split>
            </Shell>
          </div>
  
          <h3 id="rail" style={{ marginTop: 32 }}>Rail</h3>
          <div className="rail-demo">
            <Rail label="Workspaces" items={railItems} />
            <div>
              <p>The section's content.</p>
            </div>
          </div>
  
          <h3 id="page-header" style={{ marginTop: 32 }}>Page header, sections and flow</h3>
          <div className="flow-demo">
            <PageHeader
              context={<Breadcrumbs items={crumbs} />}
              title="Leads"
              description="Everyone the sales team is talking to, from the first call to the last invoice."
              actions={
                <>
                  <Button emphasis="low">Import</Button>
                  <Button emphasis="high">New lead</Button>
                </>
              }
            />
            <Section title="This week" actions={<Button size="sm" emphasis="minimal">All weeks</Button>}>
              <Grid columns="tight">
                {weekTiles.map((tile) => (
                  <Card key={tile.title} title={tile.title}>
                    {tile.value}
                  </Card>
                ))}
              </Grid>
            </Section>
            <Section title="Your details" rank="support" description="Shown to the leads you write to.">
              <Stack>
                <Field label="Signature">
                  <Input defaultValue="Daria M., sales" />
                </Field>
                <Button emphasis="high">Save</Button>
              </Stack>
            </Section>
          </div>
        </section>

        <section id="regions">
          <h3>Card and Panel</h3>
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
        </section>

        <section id="divider">
          <h3>Divider</h3>
          <Stack>
            <Divider />
            <Divider label="Advanced" />
            <Divider label="or" align="center" />
            <Divider label="Danger zone" emphasis="medium" />
            <div className="row" style={{ alignItems: 'center' }}>
              <span>Edit</span>
              <Divider orientation="vertical" />
              <span>Duplicate</span>
              <Divider orientation="vertical" />
              <span>Delete</span>
            </div>
          </Stack>
        </section>

        <section id="flex">
          <h3>Flex and Columns</h3>
          <Columns gap="loose">
            <Column span={{ base: 12, medium: 8 }}>
              <Panel title="Leads">
                <Stack gap="tight">
                  <Flex gap="tight" align="center">
                    <FlexItem grow>
                      <Search aria-label="Search leads" placeholder="Search leads" />
                    </FlexItem>
                    <Button>Filter</Button>
                    <Button emphasis="high">New lead</Button>
                  </Flex>
                  <Flex justify="between" align="baseline">
                    <Text emphasis="low">12 400 leads</Text>
                    <Link href="#flex">Export</Link>
                  </Flex>
                </Stack>
              </Panel>
            </Column>
            <Column span={{ base: 12, medium: 4 }}>
              <Columns gap="tight">
                <Column span={{ base: 12, narrow: 6 }}>
                  <Metric label="Won" value="42" />
                </Column>
                <Column span={{ base: 12, narrow: 6 }}>
                  <Metric label="Lost" value="7" />
                </Column>
              </Columns>
            </Column>
            <Column span={{ base: 12, medium: 6 }} start={{ medium: 4 }}>
              <Note>A column that starts at the fourth line from the medium width: an offset.</Note>
            </Column>
          </Columns>
        </section>
      </div>

      <div className="category" aria-labelledby="data">
        <h2 className="category-title" id="data"><span className="category-number" aria-hidden="true">06</span>Data</h2>
        <section id="list">
          <h3>List</h3>
          <p className="note">Divided, as links: the current row marked, one disabled. Bordered, as presses, with Show more. Cards, as plain rows. Every row's ⋯ is its own button.</p>
          <div className="panels">
            <List label="Reviewers" count="4 of 16">
              {reviewers.map((who) => (
                <ListItem key={who.name} title={who.name} description={who.line} href="#list" current={who.current ? 'page' : undefined} disabled={who.disabled} {...person(who)} />
              ))}
            </List>
            <List
              variant="bordered"
              label="Reviewers"
              count={`${listRows.length} of 6`}
              hasMore={listRows.length < 6}
              onLoadMore={async () => {
                const more = await reviewersLater()
                setListRows((rows) => [...rows, ...more])
              }}
              words={{ more: `Show ${6 - listRows.length} more` }}
            >
              {listRows.map((who) => (
                <ListItem key={who.name} title={who.name} description={who.line} onSelect={() => setListLog(`opened ${who.name}`)} current={who.current} disabled={who.disabled} {...person(who)} />
              ))}
            </List>
            <List variant="cards" label="Reviewers" count="4 of 16">
              {reviewers.map((who) => (
                <ListItem key={who.name} title={who.name} description={who.line} current={who.current} disabled={who.disabled} {...person(who)} />
              ))}
            </List>
          </div>
          <pre className="state">{listLog}</pre>
        </section>

        <section id="grid">
          <h3>Data grid</h3>
          <div className="row" style={{ alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: '1 1 18rem' }}>
              <Search label="Search the leads" placeholder="Company, contact or email" onValueChange={searchLeads} />
            </div>
            {leadGrid && <GridColumns grid={leadGrid} />}
            <Button size="sm" emphasis="low" onClick={exportAll}>
              Export CSV
            </Button>
          </div>
          {leadGrid && (
            <div className="grid-tools">
              <GridFilters grid={leadGrid} views={leadViews} words={{ locale: 'en-US' }} />
              <GridBulkBar grid={leadGrid} words={{ locale: 'en-US' }}>
                <Menu
                  items={managerItems}
                  onSelect={async (manager) => {
                    const count = await assignLeads(leadGrid, manager)
                    toast({ tone: 'ok', title: `Assigned ${count.toLocaleString('en-US')} leads to ${manager}` })
                  }}
                  trigger={(props) => (
                    <Button {...props} size="sm" emphasis="medium">
                      Assign to…
                    </Button>
                  )}
                />
                <Button size="sm" emphasis="low" onClick={exportAll}>
                  Export selected
                </Button>
              </GridBulkBar>
            </div>
          )}
          <DataGrid
            columns={leadColumns}
            source={leadSource}
            rowKey={(lead) => lead.id}
            label="Leads"
            selectable
            locale="en-US"
            controllerRef={setLeadGrid}
            style={{ blockSize: 520 }}
            renderCell={(lead, column, text) =>
              column.id === 'status' ? <Badge tone={statusTone[lead.status]}>{text}</Badge> : text
            }
            onRowActivate={(lead) => setLeadLog(`opened ${lead.company} — ${lead.contact}`)}
            onCellEdit={saveLead}
            onSelectionChange={(selection) =>
              setLeadLog(selection.mode === 'matching' ? 'selected: every lead matching' : `selected: ${selection.keys.size}`)
            }
          />
          {leadGrid && (
            <GridRowMenu
              grid={leadGrid}
              items={leadMenu}
              onSelect={async (value, target) => {
                const said = await runLeadMenu(leadGrid, value, target)
                if (said) toast({ tone: 'ok', title: said })
              }}
            />
          )}
          {leadGrid && (
            <GridDetail
              grid={leadGrid}
              title={(lead) => lead.company}
              description={(lead) => `Lead ${lead.id.toLocaleString('en-US')}`}
              words={{ locale: 'en-US' }}
            >
              {(lead, index) => (
                <div className="lead-detail">
                  <Select
                    label="Status"
                    items={statusItems}
                    value={lead.status}
                    onValueChange={(status) => status && void leadGrid.saveCell(index, 'status', status)}
                  />
                  <dl>
                    {leadFacts(lead).map((fact) => (
                      <div key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.text}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </GridDetail>
          )}
          <pre className="state">{leadLog}</pre>
        </section>

        <section id="kanban">
          <h3>Kanban</h3>
          <div className="kanban-frame">
            <Kanban
              columns={dealStages}
              cards={deals}
              onMove={moveDeal}
              onOpen={(deal) => setDealLog(`open: ${deal.title}`)}
              onAdd={addDeal}
              cardMenu={() => dealMenu}
              onCardMenuSelect={(value, deal) => setDealLog(`${value}: ${deal.title}`)}
              words={{ label: 'Deals' }}
            >
              {(deal) => (
                <div className="deal-card">
                  <div className="deal-company">{deal.company}</div>
                  {deal.labels && (
                    <div className="deal-labels">
                      {deal.labels.map((label) => (
                        <Badge key={label} emphasis="low">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {deal.checklist && (
                    <Progress size="sm" value={deal.checklist.done} max={deal.checklist.total} label={`Checklist, ${deal.checklist.done} of ${deal.checklist.total}`} valueText={(done) => `${done} of ${deal.checklist!.total}`} hideLabel tone={deal.checklist.done === deal.checklist.total ? 'ok' : 'running'} />
                  )}
                  <div className="deal-footer">
                    <span className="deal-amount">{formatAmount(deal.amount)}</span>
                    {deal.due && (
                      <span className="deal-due" data-due={dueOf(deal.due).state}>
                        {dueOf(deal.due).text}
                      </span>
                    )}
                    {deal.owner && <Avatar name={deal.owner} size="sm" />}
                  </div>
                </div>
              )}
            </Kanban>
          </div>
          <pre className="state">{dealLog}</pre>
        </section>

        <section id="gantt">
          <h3>Gantt</h3>
          <div className="row">
            <SegmentedControl items={ganttScales} label="Scale" size="sm" value={ganttScale} onValueChange={(value) => setGanttScale(value as 'day' | 'week' | 'month')} />
          </div>
          <div className="gantt-frame">
            <Gantt
              tasks={rolloutTasks}
              groups={rolloutGroups}
              scale={ganttScale}
              onScaleChange={setGanttScale}
              locale="en-GB"
              onOpen={(task) => setGanttLog(`open: ${task.title}`)}
              onTaskChange={async ({ task, to }) => {
                await saveTaskDates(task.id, to)
                setRolloutTasks((current) => current.map((item) => (item.id === task.id ? { ...item, ...to } : item)))
                setGanttLog(`changed: ${task.title} → ${to.start} – ${to.end}`)
              }}
              words={{ label: 'CRM rollout' }}
            />
          </div>
          <pre className="state">{ganttLog}</pre>
        </section>

        <section id="disclosure">
          <h3>Accordion, tree and progress</h3>
          <div className="disclosure-demo">
            <Accordion items={leadSections} defaultValue={['contact']}>
              {(item) => leadSectionText[item.value]}
            </Accordion>
            <div className="tree-frame">
              <Tree items={projectTree} label="Boards" defaultExpanded={['sales']} defaultValue={['sales/leads/new']} onValueChange={(value) => setBoardLog(`board: ${value.join(', ')}`)} />
            </div>
            <div className="progress-stack">
              <Progress label="Importing leads" value={imported} max={120} valueText={(value) => `${value} of 120`} tone={imported === 120 ? 'ok' : 'running'} />
              <Progress label="Sync with 1C" value={64} tone="error" valueText="Failed at 64%" />
              <div className="progress-rings">
                <Progress shape="ring" size="lg" value={73} label="Storage" />
                <Progress shape="ring" value={imported} max={120} label="Import" hideLabel />
                <Button onClick={runImport}>Run import</Button>
              </div>
            </div>
          </div>
          <pre className="state">{boardLog}</pre>
        </section>
      </div>

      <div className="category" aria-labelledby="display-group">
        <h2 className="category-title" id="display-group"><span className="category-number" aria-hidden="true">07</span>Display and feedback</h2>
        <section id="display">
          <h3>Badge, Avatar, Spinner and Skeleton</h3>
          <div className="row" style={{ alignItems: 'center' }}>
            {badgeTones.map(({ tone, label }) => (
              <Badge key={tone} tone={tone}>
                {label}
              </Badge>
            ))}
            <Badge emphasis="low">v2.4</Badge>
            <Badge count tone="running">
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
        </section>

        <section id="banners">
          <h3>Banner and Note</h3>
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
        </section>

        <section id="result">
          <h3>Result</h3>
          <div className="tiles">
            <Result tone="ok" title="Payment sent" description="€420 to Acme GmbH. A receipt is on its way to finance@acme.example." actions={<Button emphasis="high">Back to invoices</Button>}>
              Reference 2026-0915-A
            </Result>
            <Result tone="error" code="404" title="Page not found" description="The link may be old, or the page moved." actions={<Button>Go home</Button>} />
          </div>
        </section>

        <section id="readouts">
          <h3>Metric, key–values, file changes, timeline and charts</h3>
          <MetricRow joined headline>
            {headlineMetrics.map((metric) => (
              <Metric key={metric.label} {...metric} />
            ))}
          </MetricRow>
          <div style={{ marginTop: 16 }}>
            <MetricRow>
              {runMetrics.map((metric) => (
                <Metric key={metric.label} {...metric} />
              ))}
            </MetricRow>
          </div>
          {/* The usual pairing: the number in words, the shape of the nights behind it beside them.
              The picture is hidden from a screen reader — the metric has already said the number. */}
          <div className="row" style={{ marginTop: 16, alignItems: 'center' }}>
            <Metric {...runMetrics[0]} />
            <Sparkline values={runTimeTrend} area describe={false} />
          </div>
          {/* Two series, so each names its hue — and a legend under them names both in words. */}
          <div className="stack">
            <div className="row" style={{ alignItems: 'center' }}>
              {suiteSeries.map((suite) => (
                <Sparkline key={suite.label} values={suite.values} series={suite.series} label={`${suite.label}: ${suite.value} on the last night`} />
              ))}
            </div>
            <Legend items={suiteLegend} label="Time by suite" />
          </div>
          <div className="panels">
            <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              {runBudgets.map((budget) => (
                <Meter key={budget.label} {...budget} locale="en-GB" />
              ))}
            </div>
            <div className="row" style={{ alignItems: 'center', gap: 24 }}>
              <Ring value={runWindow.value} label={runWindow.label} size="lg" locale="en-GB" />
              <span className="dot-line">
                <Ring value={runShards.value} max={runShards.max} decorative locale="en-GB" />
                {runShards.note}
              </span>
            </div>
          </div>
          <div className="panels">
            <KeyValueList
              items={runFacts.map((fact) => ({ label: fact.label, value: fact.label === 'Commit' ? <Copyable value={fact.value} /> : fact.value }))}
            />
            <ul className="changes">
              {changedFiles.map((file) => (
                <li key={file.path}>
                  <FileChange change={file.change} />
                  {file.path}
                </li>
              ))}
            </ul>
          </div>
          <div className="panels">
            <Timeline label="The nightly run" items={runEvents} locale="en-GB" />
            <div className="stack" style={{ marginTop: 0 }}>
              <span className="dot-line">
                <StatusDot tone="running" /> Agents at work
              </span>
              <p style={{ margin: 0 }}>
                Streaming the answer
                <Caret />
              </p>
            </div>
          </div>
          <div style={{ marginTop: 16, maxInlineSize: 520 }}>
            <Share items={dayOutcomes} unit="h" label="The last 24 hours" locale="en-GB" />
          </div>
          <div style={{ marginTop: 16 }}>
            <Heatmap days={runYear} unit="runs" label="Runs a day" locale="en-GB" />
          </div>
        </section>

        <section id="code">
          <h3>Code, copyable values and inserts</h3>
          <CodeBlock label="the terrain generator" code={generatorSource} numbered start={12} />
          <div className="row" style={{ marginTop: 16, alignItems: 'center' }}>
            <span>Build</span>
            <Copyable value="a4f7c2e" copyValue="a4f7c2e91b0d5537" />
          </div>
          <div className="form-column">
            <Field label="Notification template">
              <Textarea rows={3} defaultValue={'{{name}} has failed at {{time}}' + String.fromCharCode(10)} />
              <Inserts items={templateInserts} label="Template variables" />
            </Field>
          </div>
        </section>

        <section id="typography">
          <h3>Prose, Text and Link</h3>
          <Prose dangerouslySetInnerHTML={{ __html: proseSample }} />
          <p style={{ marginTop: 24 }}>
            <Text emphasis="low">Updated 3 min ago</Text> · <Text strong>12 400</Text> rows · <Text code>npm test</Text> · press{' '}
            <Text kbd>Ctrl</Text> <Text kbd>K</Text> · a <Text mark>match</Text> · <Text deleted>$40</Text> <Text tone="ok">$32</Text> ·{' '}
            <Text tone="error">3 failed</Text> · <Link href="#typography">a link</Link> ·{' '}
            <Link href="https://github.com/keshon" external>
              GitHub
            </Link>
          </p>
          <div style={{ maxWidth: 280, marginTop: 12 }}>
            <Text truncate={2}>
              A description long enough to need cutting: it runs on past the second line of its narrow column and is closed with an
              ellipsis there.
            </Text>
          </div>
        </section>
      </div>

      <div className="category" aria-labelledby="agent-layer">
        <h2 className="category-title" id="agent-layer"><span className="category-number" aria-hidden="true">08</span>Agent layer</h2>
        <section id="run-queue">
          <h3>Run, queue, history and budget</h3>
          <Panel
            title="audit-worldbox-1"
            actions={
              <span className="dot-line">
                <History ticks={runHistory} size="sm" label="Nightly audits" locale="en-GB" />
                <Badge tone="running">running</Badge>
              </span>
            }
          >
            <KeyValueList items={runCounters} tight />
            <div className="run-phases">
              {runPhases.map((phase) => (
                <div key={phase.id} className="run-phase">
                  <span>{phase.label}</span>
                  <Run units={phase.units} label={`${phase.label}: agents finished`} locale="en-GB" />
                </div>
              ))}
            </div>
          </Panel>
          <div className="panels">
            <Panel title="The queue of agents" body="list" actions={<Badge>{`${runTasks.filter((task) => task.state === 'done').length} of ${runTasks.length}`}</Badge>}>
              <Queue tasks={runTasks} label="The queue of agents" value={agentTask} onValueChange={setAgentTask} />
            </Panel>
            <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              {runSpending.map((budget) => (
                <Budget key={budget.label} {...budget} locale="en-GB" />
              ))}
              <History groups={runHistoryHours} size="lg" label="Nightly audits by the hour" locale="en-GB" />
            </div>
          </div>
          <pre className="state">{`chosen  ${JSON.stringify(agentTask)}`}</pre>
        </section>

        <section id="run-stream">
          <h3>Step, log, diff and lanes</h3>
          <div className="run-stream">
            <Panel title="agent-01 on shard 4" actions={<Badge tone="running">running</Badge>}>
              <div className="run-steps">
                <Step
                  name="read_file"
                  argument="src/grid/filters.ts"
                  state="ok"
                  detail="240 lines"
                  duration={320}
                  locale="en-GB"
                  output={filtersExcerpt}
                  outputLines={wholeFile ? undefined : 240}
                  onShowAll={() => {
                    setWholeFile(true)
                    setStreamLog('asked for all 240 lines of read_file')
                  }}
                  onOpenChange={(open) => setStreamLog(`read_file ${open ? 'open' : 'closed'}`)}
                >
                  <CodeBlock code={'{ "path": "src/grid/filters.ts", "range": [1, 240] }'} label="The call" />
                </Step>
                <Step
                  name="edit_file"
                  argument="src/grid/filters.ts"
                  state="ok"
                  detail="+3 −1"
                  duration={1400}
                  locale="en-GB"
                  defaultOpen
                  onOpenChange={(open) => setStreamLog(`edit_file ${open ? 'open' : 'closed'}`)}
                >
                  <Diff path="src/grid/filters.ts" change="modified" before={filtersBefore} after={filtersAfter} context={2} locale="en-GB" />
                </Step>
                <Step
                  name="run_tests"
                  argument="--shard 4 --retry"
                  state="running"
                  detail="29 of 41"
                  duration={17_000}
                  locale="en-GB"
                  defaultOpen
                  streaming
                  output={shardOutput}
                  onOpenChange={(open) => setStreamLog(`run_tests ${open ? 'open' : 'closed'}`)}
                >
                  <CodeBlock code={'{ "shard": 4, "retry": true }'} label="The call" />
                </Step>
              </div>
            </Panel>
            <Lanes label="The shards of run 4127" lanes={runLanes} locale="en-GB" />
            <Log lines={streamLines} label="The log of run 4127" locale="en-GB" />
            <div className="row">
              <Button
                size="sm"
                disabled={streamLines.length > runLines.length}
                onClick={() => {
                  setStreamLines((lines) => [...lines, runNextLine])
                  setStreamLog(`log 02:16:58 ${runNextLine.text}`)
                }}
              >
                Next line
              </Button>
            </div>
          </div>
          <pre className="state">{streamLog}</pre>
        </section>

        <section id="run-chat">
          <h3>Turn, composer, thinking, approval and failure</h3>
          <Stack gap="loose" style={{ maxInlineSize: 680 }}>
            <Turn who="You" from="user" time="14:02">
              {chatThread.ask}
            </Turn>

            <Turn
              who="Agent"
              time="14:02"
              tokens={1284}
              duration={4.1}
              locale="en-GB"
              before={<Thinking duration={4.1} locale="en-GB">{chatThread.reasoning}</Thinking>}
              actions={
                <>
                  <Button size="sm" emphasis="minimal" aria-label="Copy" onClick={() => setChatLog('copied the answer')}>
                    <span data-icon="copy" aria-hidden="true" />
                  </Button>
                  <Button size="sm" emphasis="minimal" aria-label="Retry" onClick={() => setChatLog('asked again')}>
                    <span data-icon="refresh" aria-hidden="true" />
                  </Button>
                  <Button size="sm" emphasis="minimal" aria-label="More" onClick={() => setChatLog('opened the menu')}>
                    <span data-icon="more" aria-hidden="true" />
                  </Button>
                </>
              }
            >
              {chatThread.answer}
            </Turn>

            <Turn
              who="Agent"
              time="14:04"
              duration={5.2}
              locale="en-GB"
              after={
                <Failure
                  {...chatFailure}
                  state={breakdown}
                  resolvedAt="14:05"
                  onRetry={() => {
                    setBreakdown('resolved')
                    setChatLog('retried the read, and it worked')
                  }}
                  actions={
                    <Button
                      size="sm"
                      onClick={() => {
                        setBreakdown('given-up')
                        setChatLog('skipped the file')
                      }}
                    >
                      Skip the file
                    </Button>
                  }
                />
              }
            >
              {chatThread.reading}
            </Turn>

            <Turn who="You" from="user" time="14:06">
              {chatThread.followUp}
            </Turn>

            <Turn
              who="Agent"
              time="14:06"
              tokens={612}
              locale="en-GB"
              streaming={running}
              before={<Thinking streaming={running} duration={2.4} locale="en-GB">{chatThread.reasoning}</Thinking>}
              after={
                <Approval
                  {...chatApproval}
                  state={decision}
                  decidedBy="You"
                  decidedAt="14:07"
                  live="assertive"
                  onDecide={(taken) => {
                    setDecision(taken)
                    setChatLog(taken === 'approved' ? 'allowed the rewrite' : 'denied the rewrite')
                  }}
                  actions={
                    <Button size="sm" emphasis="minimal" onClick={() => setDecision('approved')}>
                      Always allow
                    </Button>
                  }
                />
              }
            >
              {chatThread.working}
            </Turn>

            <Stack gap="tight">
              <Composer
                label="Describe a task or ask a question"
                placeholder="Describe a task or ask a question"
                busy={running}
                value={draft}
                onValueChange={setDraft}
                onSend={(text) => {
                  setDraft('')
                  setRunning(true)
                  setChatLog(`sent ${JSON.stringify(text)}`)
                }}
                onStop={() => {
                  setRunning(false)
                  setChatLog('stopped the run')
                }}
              >
                <Button size="sm" emphasis="minimal" aria-label="Add context" onClick={() => setChatLog('added context')}>
                  <span data-icon="plus" aria-hidden="true" />
                </Button>
              </Composer>

              <Toolbar label="Session">
                <Button size="sm" emphasis="minimal">
                  Auto
                </Button>
                <Button size="sm" emphasis="minimal">
                  Opus 5
                </Button>
                <ToolbarSpacer />
                <Badge tone={running ? 'running' : 'neutral'}>{running ? 'working' : 'idle'}</Badge>
                <Badge tone="warn">context 90%</Badge>
              </Toolbar>
            </Stack>
          </Stack>
          <pre className="state">
            {`running   ${running}\ndraft     ${JSON.stringify(draft)}\napproval  ${decision}\nfailure   ${breakdown}\nlast      ${chatLog}`}
          </pre>
        </section>
      </div>
    </>
  )
}

// Cache the root across HMR updates; createRoot on an already-rooted container
// warns on every hot reload otherwise.
type Rooted = HTMLElement & { _root?: ReturnType<typeof createRoot> }
const rooted = (element: HTMLElement) => ((element as Rooted)._root ??= createRoot(element))
const container = document.getElementById('app')!
rooted(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
// The chrome, drawn with the page's own components.
rooted(document.getElementById('chrome')!).render(<Bar />)
const navigatorHost = document.getElementById('navigator') ?? document.body.appendChild(Object.assign(document.createElement('div'), { id: 'navigator' }))
rooted(navigatorHost).render(<Navigator />)
