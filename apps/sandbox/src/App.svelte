<script lang="ts">
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
    ConfigProvider,
    RangeSlider,
    List,
    ListItem,
    Input,
    InputGroup,
    Menu,
    Menubar,
    Nav,
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
  } from '@ggary/svelte'
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
  import { agentsText, badgeTones, crumbs, densities, importSteps, isWeekend, layoutLeads, navGroups, railItems, weekTiles, rolloutPlan, rolloutGroups, runMetrics, headlineMetrics, runFacts, changedFiles, runEvents, runTimeTrend, suiteSeries, suiteLegend, generatorSource, templateInserts, ganttScales, saveTaskDates, stageItems, dealFormRules, saveDealForm, sandboxCommands, dealStages, initialDeals, saveDealMove, saveNewDeal, dealMenu, dueOf, formatAmount, type Deal, leadSections, leadSectionText, projectTree, regions, teams, people, runExtras, runModes, viewModes, toastDemos, newFile, openFiles, propertyPanels, propertyTabs, appMenus, applyView, describeView, documentMenu, frameworks, initialView, roles, tags, terms, viewMenu, runBudgets, runWindow, runShards, dayOutcomes, runYear, chatThread, chatFailure, chatApproval, runPhases, runCounters, runTasks, runSpending, runHistory, runHistoryHours, filtersExcerpt, filtersBefore, filtersAfter, shardOutput, runLines, runNextLine, runLanes, controlSizes, sizePlaces, proseSample, fileMenu, fileRows, slowDelete, demoUpload, stagedUpload, stagedRowFiles, stagedTileFiles, stageDrop, avatarPicture, reviewers, reviewersLater, type Reviewer, configSamples, type ConfigSample } from './demo-data'

  let value = $state<string | null>('svelte')
  let lastEvent = $state('—')
  let refreshes = $state(0)
  let diskBanner = $state(true)
  let viewMode = $state('list')
  let density = $state('regular')
  let agents = $state(6)
  let agentTask = $state<string | null>('coverage-hole')
  let position = $state({ x: 128, y: 0, z: -64 })
  let mode = $state('parallel')
  let extras = $state<string[]>([])
  let chosenFiles = $state<File[]>([])
  let uploadLog = $state('—')
  // Upload's states are on the page as it loads: a drop is staged on each once it is there.
  let stagedRows = $state<HTMLDivElement>()
  let stagedTiles = $state<HTMLDivElement>()
  $effect(() => {
    const host = stagedRows
    if (host) requestAnimationFrame(() => stageDrop(host, stagedRowFiles()))
  })
  $effect(() => {
    const host = stagedTiles
    if (host) requestAnimationFrame(async () => stageDrop(host, await stagedTileFiles()))
  })
  let page = $state(8)
  let leadGrid = $state<DataGridController<Lead>>()
  let leadLog = $state('—')
  let comboLog = $state('—')
  let dateLog = $state('—')
  let listRows = $state<Reviewer[]>(reviewers)
  let listLog = $state('—')
  let priceRange = $state<[number, number]>([20, 80])
  let rangeLog = $state('—')
  const euro = (n: number) => `€${n}`
  const logPrice = (value: [number, number]) => (rangeLog = `price: ${value.join(' – ')}`)
  const minutes = (n: number) => `${n} min`
  let timeLog = $state('—')
  let placeLog = $state('—')
  let boardLog = $state('—')
  let deals = $state.raw(initialDeals)
  let paletteCommands = $state.raw<PaletteCommand[]>([])
  let paletteLog = $state('—')
  let tagList = $state.raw(tagOptions)
  let dealFormLog = $state('idle')
  let ganttScale = $state<'day' | 'week' | 'month'>('day')
  let ganttLog = $state('—')
  let rolloutTasks = $state.raw(rolloutPlan)
  // The agent run the chat section shows: it is still working, so the last
  // turn streams, the composer's control stops rather than sends, and the two
  // blocks that stopped the run are still waiting for a human.
  let running = $state(true)
  let draft = $state('')
  let chatLog = $state('—')
  let decision = $state<'pending' | 'approved' | 'denied'>('pending')
  let breakdown = $state<'pending' | 'resolved' | 'given-up'>('pending')
  let streamLines = $state.raw(runLines)
  let wholeFile = $state(false)
  let streamLog = $state('—')
  // The sections are read from the page once it is drawn.
  $effect(() => {
    paletteCommands = sandboxCommands((text) => toast({ tone: 'neutral', title: text }))
  })
  const searchLeadCommands = async (query: string, signal: AbortSignal): Promise<PaletteCommand[]> =>
    (await searchCompanies(query, signal)).items.map((item) => ({ id: `lead:${item.value}`, label: item.label, description: item.description }))
  let dealLog = $state('—')
  const moveDeal = async (move: KanbanMove<Deal>) => {
    await saveDealMove(move.card, move.to.column)
    deals = applyMove(deals, move)
    dealLog = `moved: ${move.card.title} → ${move.to.column}, ${move.to.index + 1}`
  }
  const addDeal = async (column: string, title: string) => {
    await saveNewDeal(title)
    deals = [...deals, { id: `new-${Date.now()}`, column, title, company: 'New lead' }]
    dealLog = `added: ${title} → ${column}`
  }
  let imported = $state<number | null>(0)
  const runImport = () => {
    imported = null
    let done = 0
    const timer = setInterval(() => {
      done += 7
      imported = Math.min(done, 120)
      if (done >= 120) clearInterval(timer)
    }, 250)
  }
  const searchLeads = debounce((text: string) => leadGrid?.send({ type: 'SET_SEARCH', search: text }))
  $effect(() => {
    if (!leadGrid) return
    const stopUrl = attachQueryToUrl(leadGrid)
    const stopColumns = attachColumnStorage(leadGrid, 'gg-sandbox-leads-columns')
    return () => {
      stopUrl()
      stopColumns()
    }
  })
  const exportAll = async () => {
    if (!leadGrid) return
    const id = toast({ tone: 'running', title: 'Exporting…', duration: 0 })
    const count = await exportLeads(leadGrid, (done, total) => toast({ id, tone: 'running', title: `Exporting… ${Math.round((done / total) * 100)}%` }))
    toast({ id, tone: 'ok', title: `Exported ${count.toLocaleString('en-US')} leads` })
  }
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

  let overlayLog = $state('open a popover')
  const logOverlay = (name: string) => (open: boolean, { reason }: { reason: string }) =>
    (overlayLog = `${name}  ${open ? 'open' : 'closed'}  reason ${reason}`)
  const formatting = [
    { content: 'Bold (Ctrl+B)', label: 'Bold', glyph: 'B' },
    { content: 'Italic (Ctrl+I)', label: 'Italic', glyph: 'I' },
    { content: 'Underline (Ctrl+U)', label: 'Underline', glyph: 'U' },
  ]

  let view = $state(initialView)
  let files = $state(openFiles)
  let tabsLog = $state('pick a tab')
  let menuLog = $state('choose something')
  let fileLog = $state('right-click a file, or Shift+F10 on one')
  let confirmLog = $state('—')

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

<div class="category" aria-labelledby="actions">
  <h2 class="category-title" id="actions"><span class="category-number" aria-hidden="true">01</span>Actions</h2>
  <section id="button-emphasis">
    <h3>Button — emphasis</h3>
    <div class="row">
      <Button emphasis="high">high</Button>
      <Button emphasis="medium">medium</Button>
      <Button emphasis="low">low</Button>
      <Button emphasis="minimal">minimal</Button>
    </div>
  </section>

  <section id="button-tone">
    <h3>Button — destructive, across emphasis</h3>
    <div class="row">
      <Button emphasis="high" destructive>high</Button>
      <Button emphasis="medium" destructive>medium</Button>
      <Button emphasis="low" destructive>low</Button>
      <Button emphasis="minimal" destructive>minimal</Button>
    </div>
  </section>

  <section id="button-sizes">
    <h3>Button — sizes and states</h3>
    <div class="row">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
    </div>
  </section>

  <section id="button-group">
    <h3>Button group</h3>
    <div class="row">
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
    <div class="row">
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
      {items}
      label="Tags"
      mode="multi"
      removable
      name="tags"
      defaultValue={['design']}
      onValueChange={(next) => (selection = next)}
      onRemove={(value) => (items = items.filter((i) => i.value !== value))}
    />
    <pre class="state">{`selection  ${JSON.stringify(selection)}
  items      ${items.length}`}</pre>
    <div class="row" style="margin-top:12px">
      <Button size="sm" onclick={() => (items = tags)}>Restore removed</Button>
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
    <div class="row" style="align-items: center">
      <Menu items={documentMenu} onSelect={(value) => (menuLog = `chose ${value}`)}>
        {#snippet trigger(props)}
          <Button {...props}>Document</Button>
        {/snippet}
      </Menu>
      <Menu
        label="View options"
        closeOnSelect={false}
        items={viewMenu(view)}
        onSelect={(value, { checked }) => {
          view = applyView(view, value, checked)
          menuLog = describeView(view)
        }}
      >
        {#snippet trigger(props)}
          <Button emphasis="low" {...props}>View</Button>
        {/snippet}
      </Menu>
    </div>
    <pre class="state">{menuLog}</pre>
  </section>

  <section id="menubar">
    <h3>Menubar</h3>
    <Menubar
      label="Application"
      mnemonics
      menus={appMenus(view)}
      onSelect={(value, { checked, menu }) => {
        const next = applyView(view, value, checked)
        menuLog = next === view ? `chose ${menu} / ${value}` : describeView(next)
        view = next
      }}
    />
    <pre class="state">{menuLog}</pre>
  </section>

  <section id="context-menu">
    <h3>Context menu</h3>
    <ul class="demo" style="list-style: none; padding: 0; max-width: 360px">
      {#each fileRows as file (file)}
        <ContextMenu items={fileMenu} label={`Actions for ${file}`} onSelect={(value) => (fileLog = `${value} ${file}`)}>
          {#snippet trigger(props)}<li><button type="button" class="file-row" {...props} onclick={() => (fileLog = `open ${file}`)}>{file}</button></li>{/snippet}
        </ContextMenu>
      {/each}
    </ul>
    <pre class="state">{fileLog}</pre>
  </section>

  <section id="palette">
    <h3>Command palette</h3>
    <CommandPalette commands={paletteCommands} load={searchLeadCommands} onRun={(command) => (paletteLog = `ran: ${command.label}`)}>
      {#snippet trigger(props)}
        <Button {...props} emphasis="medium">Search or run a command… <kbd class="kbd">Ctrl K</kbd></Button>
      {/snippet}
    </CommandPalette>
    <pre class="state">{paletteLog}</pre>
  </section>
</div>

<div class="category" aria-labelledby="inputs">
  <h2 class="category-title" id="inputs"><span class="category-number" aria-hidden="true">02</span>Inputs</h2>
  <section id="field-input">
    <h3>Field + Input</h3>
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
  </section>

  <section id="input-sizes">
    <h3>Input — sizes</h3>
    <div class="fields">
      <Field label="Small"><Input size="sm" placeholder="sm" /></Field>
      <Field label="Medium"><Input placeholder="md" /></Field>
      <Field label="Large"><Input size="lg" placeholder="lg" /></Field>
      <Input type="search" aria-label="Search" placeholder="No field, just an input" />
    </div>
  </section>

  <section id="field-invalid">
    <h3>Field — invalid declared by the owner</h3>
    <div class="row">
      <Field label="Username" hint="Letters and digits" error="That username is taken" invalid={taken}>
        <Input bind:value={username} />
      </Field>
      <Button onclick={() => (taken = !taken)}>Toggle “taken”</Button>
    </div>
    <pre class="state">{`value    ${JSON.stringify(username)}
  invalid  ${taken}`}</pre>
  </section>

  <section id="field-validated">
    <h3>Field — a validated form</h3>
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
      <Fieldset legend="Plan" error="Choose a plan" required>
        <RadioGroup name="plan" orientation="horizontal" items={plans.slice(0, 2)} />
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
      <div class="row">
        <Button emphasis="high" type="submit">Create account</Button>
      </div>
    </form>
    <pre class="state">{signupOutput}</pre>
  </section>

  <section id="textarea">
    <h3>Textarea</h3>
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

  <section id="checkbox">
    <h3>Checkbox</h3>
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
  </section>

  <section id="switch">
    <h3>Switch</h3>
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

  <section id="radio-group">
    <h3>Radio group</h3>
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

  <section id="fieldset">
    <h3>Fieldset and CheckboxGroup</h3>
    <div class="choices">
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
        <Field label="Company"><Input defaultValue="Atlas Ltd" /></Field>
        <Field label="VAT number"><Input defaultValue="GB123456789" /></Field>
      </Fieldset>
    </div>
  </section>

  <section id="select-uncontrolled">
    <h3>Select — uncontrolled</h3>
    <div class="row">
      <Select items={frameworks} label="Framework" placeholder="Pick one…" />
      <Select items={frameworks} label="With a default" defaultValue="svelte" />
      <Select items={frameworks} label="Disabled" disabled />
      <Select items={[]} label="No options" />
    </div>
  </section>

  <section id="select-controlled">
    <h3>Select — controlled</h3>
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
  </section>

  <section id="combobox">
    <h3>Combobox</h3>
    <div class="fields">
      <Combobox label="Manager" items={managerOptions} placeholder="Anyone" onValueChange={(value) => (comboLog = `manager: ${value.join(', ') || '—'}`)} />
      <Combobox
        label="Tags"
        items={tagList}
        multiple
        defaultValue={['renewal', 'partner']}
        placeholder="Add a tag"
        name="tags"
        onCreate={(text) => {
          const tag = { value: text.toLowerCase().replace(/\s+/g, '-'), label: text }
          tagList = [...tagList, tag]
          return tag
        }}
      />
      <Combobox
        label="Company"
        load={searchCompanies}
        placeholder="Search 700,000 leads"
        words={{ locale: 'en-US', more: (shown, total) => `${shown} of ${total.toLocaleString('en-US')} — type to narrow` }}
        onValueChange={(value, chosen) => (comboLog = `company: ${chosen[0]?.label ?? '—'}`)}
      />
    </div>
    <pre class="state">{comboLog}</pre>
  </section>

  <section id="cascader">
    <h3>Cascader</h3>
    <div class="fields">
      <Cascader label="City" items={regions} defaultValue={['ru', 'tat', 'kzn']} name="city" onValueChange={(value) => (placeLog = `city: ${value.join(' / ')}`)} />
      <Cascader label="Team" items={teams} selectParents placeholder="Any team" onValueChange={(value) => (placeLog = `team: ${value.join(' / ')}`)} />
    </div>
    <pre class="state">{placeLog}</pre>
  </section>

  <section id="dates">
    <h3>Date picker and calendar</h3>
    <div class="fields">
      <DatePicker label="Follow up on" locale="en-GB" min={todayISO()} onValueChange={(value) => (dateLog = `follow up: ${value.start ?? '—'}`)} name="follow" />
      <DatePicker label="Registered between" mode="range" locale="en-GB" presets={rangePresets()} onValueChange={(value) => (dateLog = `registered: ${value.start ?? '…'} – ${value.end ?? '…'}`)} />
      <DatePicker label="Stay" mode="range" months={2} locale="en-GB" onValueChange={(value) => (dateLog = `stay: ${value.start ?? '…'} – ${value.end ?? '…'}`)} />
    </div>
    <div style="margin-top: 16px">
      <Calendar locale="en-GB" isDateDisabled={isWeekend} onValueChange={(value) => (dateLog = `call on: ${value.start}`)} />
    </div>
    <pre class="state">{dateLog}</pre>
  </section>

  <section id="times">
    <h3>Time picker</h3>
    <div class="fields">
      <TimePicker label="Call at" locale="en-GB" min="08:00" max="20:00" isTimeDisabled={(time) => time >= '13:00' && time < '14:00'} onValueChange={(value) => (timeLog = `call at: ${value ?? '—'}`)} name="call" />
      <TimePicker label="Reminder (12-hour)" locale="en-US" step={30} defaultValue="09:30" onValueChange={(value) => (timeLog = `reminder: ${value ?? '—'}`)} />
      <DatePicker label="Meeting starts" time locale="en-GB" min={todayISO()} onValueChange={(value) => (timeLog = `meeting: ${value ?? 'day and time both needed'}`)} name="meeting" />
    </div>
    <pre class="state">{timeLog}</pre>
  </section>

  <section id="controls">
    <h3>Segmented control</h3>
    <div class="row" style="align-items: center">
      <SegmentedControl items={viewModes} label="View mode" bind:value={viewMode} />
      <SegmentedControl items={densities} label="Row density" size="sm" bind:value={density} />
    </div>
    <pre class="state">view mode is {viewMode}, density is {density}</pre>
  
    <h3 id="slider" style="margin-top: 32px">Slider</h3>
    <div class="controls">
      <Slider label="Parallel agents" min={0} max={16} bind:value={agents} showValue formatValue={agentsText} marks={[0, 4, 8, 12, 16]} />
      <Field label="Confidence threshold" hint="Below it the agent asks before acting">
        <Slider min={0} max={100} step={5} defaultValue={80} showValue />
      </Field>
    </div>

    <h3 id="range-slider" style="margin-top: 32px">Range slider</h3>
    <p class="note">The range in the header, with marks; in bubbles over the thumbs, sharing one when they come close; in two fields that move the thumbs when typed in (Enter or leaving commits); and disabled.</p>
    <div class="fields" style="gap: 28px 32px">
      <RangeSlider label="Price" min={0} max={200} step={5} bind:value={priceRange} formatValue={euro} onValueChange={logPrice} />
      <RangeSlider label="Run time" min={0} max={60} defaultValue={[2, 45]} formatValue={minutes} marks={[0, 15, 30, 45, 60]} />
      <RangeSlider label="Price" valueDisplay="bubbles" min={0} max={200} step={5} bind:value={priceRange} formatValue={euro} onValueChange={logPrice} />
      <RangeSlider label="Budget, close together" valueDisplay="bubbles" min={0} max={200} step={5} defaultValue={[60, 75]} formatValue={euro} />
      <RangeSlider label="Price" valueDisplay="inputs" prefix="€" min={0} max={200} step={5} bind:value={priceRange} formatValue={euro} onValueChange={logPrice} name={['price_min', 'price_max']} />
      <RangeSlider label="Retries" min={0} max={10} defaultValue={[1, 3]} disabled marks={[0, 5, 10]} />
    </div>
    <pre class="state">{rangeLog}</pre>
  
    <h3 id="number-field" style="margin-top: 32px">Number field</h3>
    <div class="vector">
      <NumberField axis="X" label="Position X" bind:value={position.x} />
      <NumberField axis="Y" label="Position Y" bind:value={position.y} />
      <NumberField axis="Z" label="Position Z" bind:value={position.z} />
    </div>
    <div class="controls">
      <Field label="Opacity" hint="Between 0 and 1, in hundredths">
        <NumberField size="sm" step={0.01} min={0} max={1} defaultValue={0.5} />
      </Field>
    </div>
    <pre class="state">x {position.x}  y {position.y}  z {position.z}</pre>
  </section>

  <section id="fields">
    <h3>Choice cards</h3>
    <div class="form-column">
      <ChoiceCardGroup items={runModes} label="Run mode" name="mode" bind:value={mode} />
      <ChoiceCardGroup items={runExtras} type="checkbox" label="Also" name="extras" orientation="horizontal" bind:value={extras} />
    </div>
    <pre class="state">mode {mode}  ·  also {extras.join(', ') || 'nothing'}</pre>
  
    <h3 id="search" style="margin-top: 32px">Search, and a field with affixes</h3>
    <div class="form-column">
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
  
    <h3 id="file-drop" style="margin-top: 32px">File drop</h3>
    <div class="form-column">
      <FileDrop name="import" accept=".json,.csv" multiple hint="Up to 20 MB, the formats .json and .csv" onFilesChange={(list) => (chosenFiles = list)} />
    </div>
    <pre class="state">{chosenFiles.map((file) => `${file.name} (${Math.ceil(file.size / 1024)} KB)`).join(', ') || '—'}</pre>

    <h3 id="upload" style="margin-top: 32px">Upload — every state</h3>
    <p class="note">Going (64%), there, failed with Retry, too large, going without saying how far, the wrong type, and waiting for a place — two go at a time.</p>
    <div class="form-column" bind:this={stagedRows}>
      <Upload upload={stagedUpload} concurrency={2} name="attachments" accept=".pdf,.docx,image/*" maxSize={20_000_000} label="Drop files here or browse" hint="PDF, DOCX or images · up to 20 MB each" locale="en-GB" />
    </div>

    <h3 id="upload-tiles" style="margin-top: 32px">Upload — tiles</h3>
    <p class="note">Going, there, failed, and not a picture; beside it, an avatar's one tile, already there.</p>
    <div class="row" style="gap: 48px; align-items: flex-start">
      <div bind:this={stagedTiles}>
        <Upload upload={stagedUpload} view="tiles" accept="image/*" maxSize={5_000_000} label="Add photo" hint="JPG, PNG or WebP · up to 5 MB" locale="en-GB" />
      </div>
      <Upload upload={demoUpload} view="tiles" accept="image/*" maxFiles={1} label="Avatar" hint="One picture; a new one replaces it" locale="en-GB" defaultFiles={[{ name: 'avatar.png', url: avatarPicture }]} />
    </div>

    <h3 id="upload-try" style="margin-top: 32px">Upload — try it</h3>
    <p class="note">Sent as chosen, at about 2 MB a second. A name with "fail" in it fails half way; "slow" never says how far.</p>
    <div class="form-column">
      <Upload upload={demoUpload} name="documents" accept=".pdf,.docx,image/*" maxSize={20_000_000} label="Drop files here or browse" hint="PDF, DOCX or images · up to 20 MB each" locale="en-GB" defaultFiles={[{ name: 'brief-v1.pdf', size: 1_240_000, value: 'k-brief' }]} onFilesChange={(items) => (uploadLog = items.map((item) => `${item.name}: ${item.status}`).join(', ') || '—')} />
    </div>
    <pre class="state">{uploadLog}</pre>

    </section>

  <section id="form">
    <h3>Form — rules, a server and a summary</h3>
    <Form
      class="stack form-column"
      validate={dealFormRules}
      onSubmit={async (data) => {
        const answer = await saveDealForm(data)
        if (!answer) dealFormLog = `saved: ${[...data.entries()].map(([key, value]) => `${key}=${String(value)}`).join(', ')}`
        return answer
      }}
      onStatusChange={(status) => {
        if (status !== 'submitted') dealFormLog = status
      }}
    >
      <FormSummary />
      <Field name="title" label="Deal title"><Input name="title" required /></Field>
      <Combobox name="company" label="Company" load={searchCompanies} placeholder="Type to search" />
      <Select name="stage" label="Stage" items={stageItems} placeholder="Choose a stage" />
      <Field name="amount" label="Amount, ₽" hint="Required once an offer is sent"><Input name="amount" type="number" min={0} step={1000} /></Field>
      <DatePicker name="due" label="Close by" locale="en-GB" />
      <Field name="contact" label="Contact email"><Input name="contact" type="email" /></Field>
      <div class="row"><Button emphasis="high" type="submit">Create deal</Button></div>
    </Form>
    <pre class="state">{dealFormLog}</pre>
  </section>

  <section id="native-form">
    <h3>Native form participation</h3>
    <form class="demo" onsubmit={onSubmit} onreset={() => (formOutput = 'reset')}>
      <Select items={frameworks} name="framework" label="framework" placeholder="Required…" />
      <Button emphasis="high" type="submit">Submit</Button>
      <Button type="reset" emphasis="minimal">Reset</Button>
    </form>
    <pre class="state">{formOutput}</pre>
  </section>

  <section id="sizes">
    <h3>Sizes: one row, one height</h3>
    {#each controlSizes as size (size)}
      <div class="row" style="margin-bottom: 16px">
        <Input {size} aria-label={`Name, ${size}`} placeholder={`Input ${size}`} style="width: 150px" />
        <Select {size} label={`Select ${size}`} items={frameworks} placeholder="Framework" />
        <Combobox {size} label={`Combobox ${size}`} items={frameworks} />
        <Cascader {size} label={`Cascader ${size}`} items={sizePlaces} />
        <DatePicker {size} label={`Date ${size}`} />
        <NumberField {size} aria-label={`Count, ${size}`} defaultValue={3} />
        <Button {size} emphasis="high">Save</Button>
      </div>
    {/each}
    <Stack>
      {#each controlSizes as size (size)}
        <div class="row" style="align-items: center">
          <SegmentedControl {size} label={`View, ${size}`} items={densities} value={densities[0].value} />
          <Chip {size}>{size}</Chip>
          <Pagination {size} label={`Pages, ${size}`} items={paginationRange({ page: 3, pages: 9, href: (page: number) => `#sizes-${page}` })} />
        </div>
      {/each}
    </Stack>
  </section>
</div>

<div class="category" aria-labelledby="overlays">
  <h2 class="category-title" id="overlays"><span class="category-number" aria-hidden="true">03</span>Overlays</h2>
  <section id="dialog">
    <h3>Dialog</h3>
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
          <Button destructive {...props}>Delete project…</Button>
        {/snippet}
        <p>Everything in “Atlas” goes, including its run history and settings.</p>
        {#snippet footer()}
          <Button emphasis="minimal" onclick={() => ((deleteOpen = false), (dialogLog = 'delete  closed  by Cancel'))}>Cancel</Button>
          <Button emphasis="high" destructive onclick={() => ((deleteOpen = false), (dialogLog = 'delete  closed  by Delete'))}>Delete</Button>
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
  
      <Sheet title="Run parameters" description="Applied to the next run." onOpenChange={logDialog('parameters sheet')}>
        {#snippet trigger(props)}
          <Button emphasis="low" {...props}>Parameters…</Button>
        {/snippet}
        <div class="dialog-fields">
          <Select label="Model" items={roles} defaultValue="editor" />
          <Field label="Agents" hint="1 to 12"><Input type="number" defaultValue="7" /></Field>
          <Switch defaultChecked>Keep logs</Switch>
        </div>
        {#snippet footer()}
          <form method="dialog"><Button emphasis="high" type="submit" value="apply">Apply</Button></form>
        {/snippet}
      </Sheet>
  
      <Sheet side="start" size="sm" title="Sections" onOpenChange={logDialog('sections sheet')}>
        {#snippet trigger(props)}
          <Button emphasis="minimal" {...props}>Sections (start edge)</Button>
        {/snippet}
        <p>Runs</p>
        <p>Artefacts</p>
        <p>Settings</p>
      </Sheet>
    </div>
    <pre class="state">{dialogLog}</pre>
  </section>

  <section id="popover">
    <h3>Popover and Tooltip</h3>
    <div class="row" style="align-items: center">
      <Popover title="Filters" onOpenChange={logOverlay('filters')}>
        {#snippet trigger(props)}
          <Button {...props}>Filters</Button>
        {/snippet}
        <div class="dialog-fields">
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
      <Popover title="Share" closeButton placement="bottom-end" onOpenChange={logOverlay('share')}>
        {#snippet trigger(props)}
          <Button emphasis="low" {...props}>Share…</Button>
        {/snippet}
        <Field label="Link" hint="Anyone with the link can view">
          <Input readOnly defaultValue="https://example.com/p/atlas" />
        </Field>
      </Popover>
      <span style="flex: 1"></span>
      {#each formatting as item (item.label)}
        <Tooltip content={item.content}>
          {#snippet trigger(props)}
            <Button emphasis="minimal" size="sm" aria-label={item.label} {...props}>{item.glyph}</Button>
          {/snippet}
        </Tooltip>
      {/each}
      <Tooltip content="Shown below, when there is room" placement="bottom">
        {#snippet trigger(props)}
          <Button emphasis="minimal" size="sm" {...props}>Below</Button>
        {/snippet}
      </Tooltip>
    </div>
    <pre class="state">{overlayLog}</pre>
  </section>

  <section id="popconfirm">
    <h3>Popconfirm</h3>
    <div class="row" style="align-items: center">
      <Popconfirm
        title="Delete this lead?"
        description="Its history goes with it. This cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={() => slowDelete().then(() => (confirmLog = 'deleted'))}
        onCancel={() => (confirmLog = 'kept')}
      >
        {#snippet trigger(props)}<Button {...props} destructive>Delete lead</Button>{/snippet}
      </Popconfirm>
      <Popconfirm title="Publish the page now?" confirmLabel="Publish" onConfirm={() => (confirmLog = 'published')}>
        {#snippet trigger(props)}<Button {...props}>Publish</Button>{/snippet}
      </Popconfirm>
    </div>
    <pre class="state">{confirmLog}</pre>
  </section>

  <section id="toast">
    <h3>Toast</h3>
    <div class="row">
      <Button onclick={() => toast({ ...toastDemos.queued })}>Success</Button>
      <Button onclick={() => toast({ ...toastDemos.failed })}>Error that stays</Button>
      <Button onclick={() => toast({ ...toastDemos.warn })}>Warning</Button>
      <Button
        emphasis="low"
        onclick={() => {
          const id = toast({ tone: 'running', title: 'Saving…', duration: 0 })
          setTimeout(() => toast({ id, tone: 'ok', title: 'Saved' }), 1500)
        }}
      >
        Saving, then saved
      </Button>
      <Button
        emphasis="minimal"
        onclick={() => toast({ title: 'Task deleted', action: { label: 'Undo', onClick: () => toast({ title: 'Task restored' }) } })}
      >
        With an action
      </Button>
    </div>
    <Toaster />
  </section>
</div>

<div class="category" aria-labelledby="navigation-group">
  <h2 class="category-title" id="navigation-group"><span class="category-number" aria-hidden="true">04</span>Navigation</h2>
  <section id="tabs">
    <h3>Tabs</h3>
    <Tabs items={propertyTabs} label="Object properties" onValueChange={(value) => (tabsLog = `selected ${value}`)}>
      {#snippet panel(item)}
        <p>{propertyPanels[item.value]}</p>
      {/snippet}
    </Tabs>
    <div class="row" style="align-items: center; margin-block-start: 16px">
      <div style="flex: 1; min-width: 0">
        <Tabs
          items={files}
          variant="documents"
          label="Open files"
          onValueChange={(value) => (tabsLog = `selected ${value}`)}
          onClose={(value) => {
            files = files.filter((file) => file.value !== value)
            tabsLog = `closed ${value}`
          }}
        >
          {#snippet panel(item)}
            <p>Editing {item.label}</p>
          {/snippet}
        </Tabs>
      </div>
      <Button emphasis="low" onclick={() => (files = [...files, newFile()])}>New file</Button>
    </div>
    <pre class="state">{tabsLog}</pre>
  </section>

  <section id="navigation">
    <h3>Breadcrumbs</h3>
    <Breadcrumbs items={crumbs} />
  
    <h3 id="nav" style="margin-top: 32px">Nav</h3>
    <div class="nav-demo">
      <Nav
        label="Sections"
        groups={navGroups.map((group, index) => ({
          ...group,
          items: group.items.map((item, itemIndex) => ({ ...item, current: index === 0 && itemIndex === 0 })),
        }))}
      />
      <Panel title="Runs">
        {#snippet toolbar()}
          <Toolbar label="Run tools">
            <Button size="sm" emphasis="minimal">Filter</Button>
            <Button size="sm" emphasis="minimal">Sort</Button>
            <ToolbarSeparator />
            <Button size="sm" emphasis="minimal">Export</Button>
            <ToolbarSpacer />
            <Badge tone="running">7 running</Badge>
          </Toolbar>
        {/snippet}
        <p>Rows would stand here.</p>
      </Panel>
    </div>
  
    <h3 id="pagination" style="margin-top: 32px">Pagination</h3>
    <Pagination
      items={paginationRange({ page, pages: 24, previousLabel: 'Back', nextLabel: 'Forward', href: (n: number) => `#p${n}` })}
      onPageChange={(next, event) => {
        event.preventDefault()
        page = next
      }}
    />
    <pre class="state">page {page}</pre>
  
    <h3 id="steps" style="margin-top: 32px">Steps</h3>
    <Steps items={importSteps} label="Import" />
  </section>
</div>

<div class="category" aria-labelledby="layout-group">
  <h2 class="category-title" id="layout-group"><span class="category-number" aria-hidden="true">05</span>Layout</h2>
  <section id="config">
    <h3>Config provider</h3>
    <p class="note">The same components three times. The labels are the app's; the locale of the time and the day, the size, the direction, the mode and the kit's own words come from the provider around each.</p>
    {#snippet sample(each: ConfigSample)}
      <div class="stack" style="margin-top: 0">
        <Button>{each.text.save}</Button>
        <Input aria-label={each.text.name} placeholder={each.text.name} />
        <TimePicker label={each.text.starts} defaultValue="14:30" />
        <DatePicker label={each.text.due} defaultValue="2026-09-18" />
        <RangeSlider label={each.text.price} valueDisplay="bubbles" min={0} max={200} step={5} defaultValue={[20, 80]} formatValue={(n: number) => `€${n}`} />
        <List label={each.text.files} onLoadMore={() => {}}>
          <ListItem title={each.text.first} />
          <ListItem title={each.text.second} />
        </List>
      </div>
    {/snippet}
    <div class="panels">
      {#each configSamples as each (each.title)}
        <ConfigProvider {...each.config}>
          <Panel title={each.title}>{@render sample(each)}</Panel>
        </ConfigProvider>
      {/each}
    </div>
  </section>

  <section id="layout">
    <h3>Shell and split</h3>
    <div class="shell-demo">
      <Shell>
        {#snippet brand()}<a href="#layout">Leads</a>{/snippet}
        {#snippet aside()}
          <Nav label="Sections" groups={navGroups.map((group, index) => ({ ...group, items: group.items.map((item, itemIndex) => ({ ...item, current: index === 0 && itemIndex === 0 })) }))} />
        {/snippet}
        {#snippet header()}<Breadcrumbs items={crumbs} />{/snippet}
        {#snippet footer()}
          <StatusBar label="Registry status">
            <StatusBarItem>main</StatusBarItem>
            <StatusBarItem tone="error">3 failed saves</StatusBarItem>
            <StatusBarSpacer />
            <StatusBarItem>700,000 leads</StatusBarItem>
            <Button size="sm" emphasis="minimal">Sync</Button>
          </StatusBar>
        {/snippet}
        <Split label="Resize the lead list" collapsible defaultSize={260} min={180} max={420} restMin={220} style="block-size: 100%">
          {#snippet first()}
            <ul>{#each layoutLeads as lead (lead)}<li>{lead}</li>{/each}</ul>
          {/snippet}
          {#snippet second()}
            <article>
              <h3 style="margin-top: 0">Acme Labs 214</h3>
              <p>The lead would stand here, beside the list it was picked from.</p>
            </article>
          {/snippet}
        </Split>
      </Shell>
    </div>
  
    <h3 id="rail" style="margin-top: 32px">Rail</h3>
    <div class="rail-demo">
      <Rail label="Workspaces" items={railItems} />
      <div><p>The section's content.</p></div>
    </div>
  
    <h3 id="page-header" style="margin-top: 32px">Page header, sections and flow</h3>
    <div class="flow-demo">
      <PageHeader title="Leads" description="Everyone the sales team is talking to, from the first call to the last invoice.">
        {#snippet context()}<Breadcrumbs items={crumbs} />{/snippet}
        {#snippet actions()}
          <Button emphasis="low">Import</Button>
          <Button emphasis="high">New lead</Button>
        {/snippet}
      </PageHeader>
      <Section title="This week">
        {#snippet actions()}<Button size="sm" emphasis="minimal">All weeks</Button>{/snippet}
        <Grid columns="tight">
          {#each weekTiles as tile (tile.title)}<Card title={tile.title}>{tile.value}</Card>{/each}
        </Grid>
      </Section>
      <Section title="Your details" rank="support" description="Shown to the leads you write to.">
        <Stack>
          <Field label="Signature"><Input value="Daria M., sales" /></Field>
          <Button emphasis="high">Save</Button>
        </Stack>
      </Section>
    </div>
  </section>

  <section id="regions">
    <h3>Card and Panel</h3>
    <div class="tiles">
      <Card title="Deployments" subtitle="Last 24 hours" rank="lead">42 successful, 1 rolled back.</Card>
      <Card title="Queue" interactive onclick={() => refreshes++}>Nothing waiting. Click to refresh.</Card>
      <Card title="Archive" rank="support">Runs older than 90 days.</Card>
      <Card title="Documentation" subtitle="docs.example.com" href="#regions">A link card: the whole card is the link.</Card>
    </div>
    <div class="panels">
      <Panel title="Runners" region>
        {#snippet actions()}
          <Button emphasis="minimal" size="sm">Add runner</Button>
        {/snippet}
        <div class="banners">
          <Card title="runner-01" tone="ok">Idle, last job 2 minutes ago.</Card>
          <Note tone="warn">runner-02 has not reported for 5 minutes.</Note>
        </div>
      </Panel>
      <Panel title="Artifacts">
        <EmptyState title="No artifacts yet" description="Artifacts appear here after the first successful build.">
          <Button emphasis="low" size="sm">Start a build</Button>
        </EmptyState>
      </Panel>
    </div>
    <pre class="state">{refreshes ? `refreshed the queue ${refreshes}×` : '—'}</pre>
  </section>

  <section id="divider">
    <h3>Divider</h3>
    <Stack>
      <Divider />
      <Divider label="Advanced" />
      <Divider label="or" align="center" />
      <Divider label="Danger zone" emphasis="medium" />
      <div class="row" style="align-items: center">
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

<div class="category" aria-labelledby="data">
  <h2 class="category-title" id="data"><span class="category-number" aria-hidden="true">06</span>Data</h2>
  <section id="list">
    <h3>List</h3>
    <p class="note">Divided, as links: the current row marked, one disabled. Bordered, as presses, with Show more. Cards, as plain rows. Every row's ⋯ is its own button.</p>
    {#snippet person(who: Reviewer, how: 'link' | 'press' | 'plain')}
      {#snippet leading()}<Avatar name={who.name} size="sm" decorative />{/snippet}
      {#snippet meta()}<Badge tone={who.tone}>{who.word}</Badge><span>{who.when}</span>{/snippet}
      {#snippet actions()}<Button size="sm" emphasis="minimal" aria-label={`More for ${who.name}`} onclick={() => (listLog = `menu for ${who.name}`)}><span data-icon="more" aria-hidden="true"></span></Button>{/snippet}
      <ListItem
        title={who.name}
        description={who.line}
        href={how === 'link' ? '#list' : undefined}
        onSelect={how === 'press' ? () => (listLog = `opened ${who.name}`) : undefined}
        current={who.current ? (how === 'link' ? 'page' : true) : undefined}
        disabled={who.disabled}
        {leading}
        {meta}
        {actions}
      />
    {/snippet}
    <div class="panels">
      <List label="Reviewers" count="4 of 16">
        {#each reviewers as who (who.name)}{@render person(who, 'link')}{/each}
      </List>
      <List variant="bordered" label="Reviewers" count={`${listRows.length} of 6`} hasMore={listRows.length < 6} onLoadMore={async () => (listRows = [...listRows, ...(await reviewersLater())])} words={{ more: `Show ${6 - listRows.length} more` }}>
        {#each listRows as who (who.name)}{@render person(who, 'press')}{/each}
      </List>
      <List variant="cards" label="Reviewers" count="4 of 16">
        {#each reviewers as who (who.name)}{@render person(who, 'plain')}{/each}
      </List>
    </div>
    <pre class="state">{listLog}</pre>
  </section>

  <section id="grid">
    <h3>Data grid</h3>
    <div class="row" style="align-items: center; margin-bottom: 12px">
      <div style="flex: 1 1 18rem">
        <Search label="Search the leads" placeholder="Company, contact or email" onValueChange={searchLeads} />
      </div>
      {#if leadGrid}<GridColumns grid={leadGrid} />{/if}
      <Button size="sm" emphasis="low" onclick={exportAll}>Export CSV</Button>
    </div>
    {#if leadGrid}
      <div class="grid-tools">
        <GridFilters grid={leadGrid} views={leadViews} words={{ locale: 'en-US' }} />
        <GridBulkBar grid={leadGrid} words={{ locale: 'en-US' }}>
          <Menu
            items={managerItems}
            onSelect={async (manager: string) => {
              const count = await assignLeads(leadGrid!, manager)
              toast({ tone: 'ok', title: `Assigned ${count.toLocaleString('en-US')} leads to ${manager}` })
            }}
          >
            {#snippet trigger(props)}
              <Button {...props} size="sm" emphasis="medium">Assign to…</Button>
            {/snippet}
          </Menu>
          <Button size="sm" emphasis="low" onclick={exportAll}>Export selected</Button>
        </GridBulkBar>
      </div>
    {/if}
    <DataGrid
      columns={leadColumns}
      source={leadSource}
      rowKey={(lead: Lead) => lead.id}
      label="Leads"
      selectable
      locale="en-US"
      bind:controller={leadGrid}
      style="block-size: 520px"
      onRowActivate={(lead: Lead) => (leadLog = `opened ${lead.company} — ${lead.contact}`)}
      onCellEdit={saveLead}
      onSelectionChange={(selection) =>
        (leadLog = selection.mode === 'matching' ? 'selected: every lead matching' : `selected: ${selection.keys.size}`)}
    >
      {#snippet cell(lead: Lead, column, text: string)}
        {#if column.id === 'status'}<Badge tone={statusTone[lead.status]}>{text}</Badge>{:else}{text}{/if}
      {/snippet}
    </DataGrid>
    {#if leadGrid}
      <GridRowMenu
        grid={leadGrid}
        items={leadMenu}
        onSelect={async (value, target) => {
          const said = await runLeadMenu(leadGrid!, value, target)
          if (said) toast({ tone: 'ok', title: said })
        }}
      />
      <GridDetail grid={leadGrid} title={(lead: Lead) => lead.company} description={(lead: Lead) => `Lead ${lead.id.toLocaleString('en-US')}`} words={{ locale: 'en-US' }}>
        {#snippet children(lead: Lead, index: number)}
          <div class="lead-detail">
            <Select
              label="Status"
              items={statusItems}
              value={lead.status}
              onValueChange={(status) => status && void leadGrid!.saveCell(index, 'status', status)}
            />
            <dl>
              {#each leadFacts(lead) as fact (fact.label)}
                <div><dt>{fact.label}</dt><dd>{fact.text}</dd></div>
              {/each}
            </dl>
          </div>
        {/snippet}
      </GridDetail>
    {/if}
    <pre class="state">{leadLog}</pre>
  </section>

  <section id="kanban">
    <h3>Kanban</h3>
    <div class="kanban-frame">
      <Kanban
        columns={dealStages}
        cards={deals}
        onMove={moveDeal}
        onOpen={(deal) => (dealLog = `open: ${deal.title}`)}
        onAdd={addDeal}
        cardMenu={() => dealMenu}
        onCardMenuSelect={(value, deal) => (dealLog = `${value}: ${deal.title}`)}
        words={{ label: 'Deals' }}
      >
        {#snippet card(deal)}
          <div class="deal-card">
            <div class="deal-company">{deal.company}</div>
            {#if deal.labels}
              <div class="deal-labels">
                {#each deal.labels as label (label)}<Badge emphasis="low">{label}</Badge>{/each}
              </div>
            {/if}
            {#if deal.checklist}
              <Progress size="sm" value={deal.checklist.done} max={deal.checklist.total} label={`Checklist, ${deal.checklist.done} of ${deal.checklist.total}`} valueText={(done) => `${done} of ${deal.checklist!.total}`} hideLabel tone={deal.checklist.done === deal.checklist.total ? 'ok' : 'running'} />
            {/if}
            <div class="deal-footer">
              <span class="deal-amount">{formatAmount(deal.amount)}</span>
              {#if deal.due}<span class="deal-due" data-due={dueOf(deal.due).state}>{dueOf(deal.due).text}</span>{/if}
              {#if deal.owner}<Avatar name={deal.owner} size="sm" />{/if}
            </div>
          </div>
        {/snippet}
      </Kanban>
    </div>
    <pre class="state">{dealLog}</pre>
  </section>

  <section id="gantt">
    <h3>Gantt</h3>
    <div class="row">
      <SegmentedControl items={ganttScales} label="Scale" size="sm" bind:value={ganttScale} />
    </div>
    <div class="gantt-frame">
      <Gantt
        tasks={rolloutTasks}
        groups={rolloutGroups}
        bind:scale={ganttScale}
        locale="en-GB"
        onOpen={(task) => (ganttLog = `open: ${task.title}`)}
        onTaskChange={async ({ task, to }) => {
          await saveTaskDates(task.id, to)
          rolloutTasks = rolloutTasks.map((item) => (item.id === task.id ? { ...item, ...to } : item))
          ganttLog = `changed: ${task.title} → ${to.start} – ${to.end}`
        }}
        words={{ label: 'CRM rollout' }}
      />
    </div>
    <pre class="state">{ganttLog}</pre>
  </section>

  <section id="disclosure">
    <h3>Accordion, tree and progress</h3>
    <div class="disclosure-demo">
      <Accordion items={leadSections} defaultValue={['contact']}>
        {#snippet panel(item)}{leadSectionText[item.value]}{/snippet}
      </Accordion>
      <div class="tree-frame">
        <Tree items={projectTree} label="Boards" defaultExpanded={['sales']} defaultValue={['sales/leads/new']} onValueChange={(value) => (boardLog = `board: ${value.join(', ')}`)} />
      </div>
      <div class="progress-stack">
        <Progress label="Importing leads" value={imported} max={120} valueText={(value) => `${value} of 120`} tone={imported === 120 ? 'ok' : 'running'} />
        <Progress label="Sync with 1C" value={64} tone="error" valueText="Failed at 64%" />
        <div class="progress-rings">
          <Progress shape="ring" size="lg" value={73} label="Storage" />
          <Progress shape="ring" value={imported} max={120} label="Import" hideLabel />
          <Button onclick={runImport}>Run import</Button>
        </div>
      </div>
    </div>
    <pre class="state">{boardLog}</pre>
  </section>
</div>

<div class="category" aria-labelledby="display-group">
  <h2 class="category-title" id="display-group"><span class="category-number" aria-hidden="true">07</span>Display and feedback</h2>
  <section id="display">
    <h3>Badge, Avatar, Spinner and Skeleton</h3>
    <div class="row" style="align-items: center">
      {#each badgeTones as { tone, label } (tone)}
        <Badge {tone}>{label}</Badge>
      {/each}
      <Badge emphasis="low">v2.4</Badge>
      <Badge count tone="running">12</Badge>
    </div>
    <div class="row" style="align-items: center; margin-top: 16px">
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Alan Turing" />
      <Avatar name="Grace Hopper" size="lg" />
      <AvatarGroup label="Reviewers" {people} max={3} />
      <Spinner label="Loading runs" size="sm" />
      <Spinner label="Loading runs" />
      <Spinner label="Loading runs" size="lg" />
    </div>
    <div class="tiles">
      <Card title="Loading…"><Skeleton title lines={3} /></Card>
    </div>
  </section>

  <section id="banners">
    <h3>Banner and Note</h3>
    <div class="banners">
      {#if diskBanner}
        <Banner tone="warn" title="Disk almost full" onDismiss={() => (diskBanner = false)}>
          Old snapshots will be pruned tonight.
          {#snippet actions()}
            <Button emphasis="low" size="sm">Review</Button>
          {/snippet}
        </Banner>
      {/if}
      <Banner tone="error" title="Build failed" live="alert">3 tests failed on main.</Banner>
      <Banner>Maintenance on Sunday, 02:00 UTC.</Banner>
      <Note>Notes are asides: the bar only groups, the words carry the meaning.</Note>
      <Note tone="error">Deleting a project cannot be undone.</Note>
    </div>
    <div class="row" style="margin-top: 12px">
      <Button emphasis="minimal" onclick={() => (diskBanner = true)}>Show the banner again</Button>
    </div>
  </section>

  <section id="result">
    <h3>Result</h3>
    <div class="tiles">
      <Result tone="ok" title="Payment sent" description="€420 to Acme GmbH. A receipt is on its way to finance@acme.example.">
        {#snippet actions()}<Button emphasis="high">Back to invoices</Button>{/snippet}
        Reference 2026-0915-A
      </Result>
      <Result tone="error" code="404" title="Page not found" description="The link may be old, or the page moved.">
        {#snippet actions()}<Button>Go home</Button>{/snippet}
      </Result>
    </div>
  </section>

  <section id="readouts">
        <h3>Metric, key–values, file changes, timeline and charts</h3>
    <MetricRow joined headline>
      {#each headlineMetrics as metric (metric.label)}<Metric {...metric} />{/each}
    </MetricRow>
    <div style="margin-top: 16px">
      <MetricRow>
        {#each runMetrics as metric (metric.label)}<Metric {...metric} />{/each}
      </MetricRow>
    </div>
    <!-- The usual pairing: the number in words, the shape of the nights behind it beside them.
         The picture is hidden from a screen reader — the metric has already said the number. -->
    <div class="row" style="margin-top: 16px; align-items: center">
      <Metric {...runMetrics[0]} />
      <Sparkline values={runTimeTrend} area describe={false} />
    </div>
    <!-- Two series, so each names its hue — and a legend under them names both in words. -->
    <div class="stack">
      <div class="row" style="align-items: center">
        {#each suiteSeries as suite (suite.label)}
          <Sparkline values={suite.values} series={suite.series} label={`${suite.label}: ${suite.value} on the last night`} />
        {/each}
      </div>
      <Legend items={suiteLegend} label="Time by suite" />
    </div>
    <div class="panels">
      <div style="display: grid; gap: 16px; align-content: start">
        {#each runBudgets as budget (budget.label)}<Meter {...budget} locale="en-GB" />{/each}
      </div>
      <div class="row" style="align-items: center; gap: 24px">
        <Ring value={runWindow.value} label={runWindow.label} size="lg" locale="en-GB" />
        <span class="dot-line">
          <Ring value={runShards.value} max={runShards.max} decorative locale="en-GB" />
          {runShards.note}
        </span>
      </div>
    </div>
    <div class="panels">
      <KeyValueList items={runFacts}>
        {#snippet value(fact)}{#if fact.label === 'Commit'}<Copyable value={fact.value} />{:else}{fact.value}{/if}{/snippet}
      </KeyValueList>
      <ul class="changes">
        {#each changedFiles as file (file.path)}<li><FileChange change={file.change} />{file.path}</li>{/each}
      </ul>
    </div>
    <div class="panels">
      <Timeline label="The nightly run" items={runEvents} locale="en-GB" />
      <div class="stack" style="margin-top: 0">
        <span class="dot-line"><StatusDot tone="running" /> Agents at work</span>
        <p style="margin: 0">Streaming the answer<Caret /></p>
      </div>
    </div>
    <div style="margin-top: 16px; max-inline-size: 520px">
      <Share items={dayOutcomes} unit="h" label="The last 24 hours" locale="en-GB" />
    </div>
    <div style="margin-top: 16px">
      <Heatmap days={runYear} unit="runs" label="Runs a day" locale="en-GB" />
    </div>
  </section>

  <section id="code">
    <h3>Code, copyable values and inserts</h3>
    <CodeBlock label="the terrain generator" code={generatorSource} numbered start={12} />
    <div class="row" style="margin-top: 16px; align-items: center">
      <span>Build</span>
      <Copyable value="a4f7c2e" copyValue="a4f7c2e91b0d5537" />
    </div>
    <div class="form-column">
      <Field label="Notification template">
        <Textarea rows={3} defaultValue={'{{name}} has failed at {{time}}' + String.fromCharCode(10)} />
        <Inserts items={templateInserts} label="Template variables" />
      </Field>
    </div>
  </section>

  <section id="typography">
    <h3>Prose, Text and Link</h3>
    <Prose html={proseSample} />
    <p style="margin-top: 24px">
      <Text emphasis="low">Updated 3 min ago</Text> · <Text strong>12 400</Text> rows · <Text code>npm test</Text> · press
      <Text kbd>Ctrl</Text> <Text kbd>K</Text> · a <Text mark>match</Text> · <Text deleted>$40</Text> <Text tone="ok">$32</Text> ·
      <Text tone="error">3 failed</Text> · <Link href="#typography">a link</Link> ·
      <Link href="https://github.com/keshon" external>GitHub</Link>
    </p>
    <div style="max-width: 280px; margin-top: 12px">
      <Text truncate={2}>A description long enough to need cutting: it runs on past the second line of its narrow column and is closed with an ellipsis there.</Text>
    </div>
  </section>
</div>

<div class="category" aria-labelledby="agent-layer">
  <h2 class="category-title" id="agent-layer"><span class="category-number" aria-hidden="true">08</span>Agent layer</h2>
  <section id="run-queue">
    <h3>Run, queue, history and budget</h3>
    <Panel title="audit-worldbox-1">
      {#snippet actions()}
        <span class="dot-line">
          <History ticks={runHistory} size="sm" label="Nightly audits" locale="en-GB" />
          <Badge tone="running">running</Badge>
        </span>
      {/snippet}
      <KeyValueList items={runCounters} tight />
      <div class="run-phases">
        {#each runPhases as phase (phase.id)}
          <div class="run-phase">
            <span>{phase.label}</span>
            <Run units={phase.units} label={`${phase.label}: agents finished`} locale="en-GB" />
          </div>
        {/each}
      </div>
    </Panel>
    <div class="panels">
      <Panel title="The queue of agents" body="list">
        {#snippet actions()}
          <Badge>{`${runTasks.filter((task) => task.state === 'done').length} of ${runTasks.length}`}</Badge>
        {/snippet}
        <Queue tasks={runTasks} label="The queue of agents" bind:value={agentTask} />
      </Panel>
      <div style="display: grid; gap: 16px; align-content: start">
        {#each runSpending as budget (budget.label)}<Budget {...budget} locale="en-GB" />{/each}
        <History groups={runHistoryHours} size="lg" label="Nightly audits by the hour" locale="en-GB" />
      </div>
    </div>
    <pre class="state">{`chosen  ${JSON.stringify(agentTask)}`}</pre>
  </section>

  <section id="run-stream">
    <h3>Step, log, diff and lanes</h3>
    <div class="run-stream">
      <Panel title="agent-01 on shard 4">
        {#snippet actions()}<Badge tone="running">running</Badge>{/snippet}
        <div class="run-steps">
          <Step
            name="read_file"
            argument="src/grid/filters.ts"
            state="ok"
            detail="240 lines"
            duration={320}
            locale="en-GB"
            outputLines={wholeFile ? undefined : 240}
            onShowAll={() => {
              wholeFile = true
              streamLog = 'asked for all 240 lines of read_file'
            }}
            onOpenChange={(open) => (streamLog = `read_file ${open ? 'open' : 'closed'}`)}
          >
            {#snippet output()}{filtersExcerpt}{/snippet}
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
            onOpenChange={(open) => (streamLog = `edit_file ${open ? 'open' : 'closed'}`)}
          >
            <Diff path="src/grid/filters.ts" change="modified" before={filtersBefore} after={filtersAfter} context={2} locale="en-GB" />
          </Step>
          <Step
            name="run_tests"
            argument="--shard 4 --retry"
            state="running"
            detail="29 of 41"
            duration={17000}
            locale="en-GB"
            defaultOpen
            streaming
            onOpenChange={(open) => (streamLog = `run_tests ${open ? 'open' : 'closed'}`)}
          >
            {#snippet output()}{shardOutput}{/snippet}
            <CodeBlock code={'{ "shard": 4, "retry": true }'} label="The call" />
          </Step>
        </div>
      </Panel>
      <Lanes label="The shards of run 4127" lanes={runLanes} locale="en-GB" />
      <Log lines={streamLines} label="The log of run 4127" locale="en-GB" />
      <div class="row">
        <Button
          size="sm"
          disabled={streamLines.length > runLines.length}
          onclick={() => {
            streamLines = [...streamLines, runNextLine]
            streamLog = `log 02:16:58 ${runNextLine.text}`
          }}
        >
          Next line
        </Button>
      </div>
    </div>
    <pre class="state">{streamLog}</pre>
  </section>

  <section id="run-chat">
    <h3>Turn, composer, thinking, approval and failure</h3>

    {#snippet firstReasoning()}
      <Thinking duration={4.1} locale="en-GB">{chatThread.reasoning}</Thinking>
    {/snippet}
    {#snippet firstActions()}
      <Button size="sm" emphasis="minimal" aria-label="Copy" onclick={() => (chatLog = 'copied the answer')}>
        <span data-icon="copy" aria-hidden="true"></span>
      </Button>
      <Button size="sm" emphasis="minimal" aria-label="Retry" onclick={() => (chatLog = 'asked again')}>
        <span data-icon="refresh" aria-hidden="true"></span>
      </Button>
      <Button size="sm" emphasis="minimal" aria-label="More" onclick={() => (chatLog = 'opened the menu')}>
        <span data-icon="more" aria-hidden="true"></span>
      </Button>
    {/snippet}
    {#snippet skipTheFile()}
      <Button size="sm" onclick={() => { breakdown = 'given-up'; chatLog = 'skipped the file' }}>Skip the file</Button>
    {/snippet}
    {#snippet theFailure()}
      <Failure
        {...chatFailure}
        state={breakdown}
        resolvedAt="14:05"
        onRetry={() => { breakdown = 'resolved'; chatLog = 'retried the read, and it worked' }}
        actions={skipTheFile}
      />
    {/snippet}
    {#snippet lastReasoning()}
      <Thinking streaming={running} duration={2.4} locale="en-GB">{chatThread.reasoning}</Thinking>
    {/snippet}
    {#snippet alwaysAllow()}
      <Button size="sm" emphasis="minimal" onclick={() => (decision = 'approved')}>Always allow</Button>
    {/snippet}
    {#snippet theApproval()}
      <Approval
        {...chatApproval}
        state={decision}
        decidedBy="You"
        decidedAt="14:07"
        live="assertive"
        onDecide={(taken) => { decision = taken; chatLog = taken === 'approved' ? 'allowed the rewrite' : 'denied the rewrite' }}
        actions={alwaysAllow}
      />
    {/snippet}

    <Stack gap="loose" style="max-inline-size: 680px">
      <Turn who="You" from="user" time="14:02">{chatThread.ask}</Turn>

      <Turn who="Agent" time="14:02" tokens={1284} duration={4.1} locale="en-GB" before={firstReasoning} actions={firstActions}>
        {chatThread.answer}
      </Turn>

      <Turn who="Agent" time="14:04" duration={5.2} locale="en-GB" after={theFailure}>{chatThread.reading}</Turn>

      <Turn who="You" from="user" time="14:06">{chatThread.followUp}</Turn>

      <Turn who="Agent" time="14:06" tokens={612} locale="en-GB" streaming={running} before={lastReasoning} after={theApproval}>
        {chatThread.working}
      </Turn>

      <Stack gap="tight">
        <Composer
          label="Describe a task or ask a question"
          placeholder="Describe a task or ask a question"
          busy={running}
          bind:value={draft}
          onSend={(text) => { draft = ''; running = true; chatLog = `sent ${JSON.stringify(text)}` }}
          onStop={() => { running = false; chatLog = 'stopped the run' }}
        >
          <Button size="sm" emphasis="minimal" aria-label="Add context" onclick={() => (chatLog = 'added context')}>
            <span data-icon="plus" aria-hidden="true"></span>
          </Button>
        </Composer>

        <Toolbar label="Session">
          <Button size="sm" emphasis="minimal">Auto</Button>
          <Button size="sm" emphasis="minimal">Opus 5</Button>
          <ToolbarSpacer />
          <Badge tone={running ? 'running' : 'neutral'}>{running ? 'working' : 'idle'}</Badge>
          <Badge tone="warn">context 90%</Badge>
        </Toolbar>
      </Stack>
    </Stack>
    <pre class="state">{`running   ${running}
draft     ${JSON.stringify(draft)}
approval  ${decision}
failure   ${breakdown}
last      ${chatLog}`}</pre>
  </section>
</div>
