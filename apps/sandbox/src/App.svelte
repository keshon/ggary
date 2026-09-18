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
    Input,
    InputGroup,
    Menu,
    Menubar,
    Nav,
    Calendar,
    Combobox,
    DatePicker,
    Cascader,
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
    HINT_COMBOBOX,
    statusItems,
    statusTone,
    HINT_ROWS,
    type Lead,
  } from './leads'
  import { attachColumnStorage, attachQueryToUrl } from '@ggary/core/data-grid'
  import { agentsText, badgeTones, crumbs, densities, importSteps, isWeekend, layoutLeads, navGroups, railItems, weekTiles, HINT_DATES, HINT_CASCADER, regions, teams, HINT_FLOW, HINT_RAIL, HINT_SHELL, people, runExtras, runModes, viewModes, toastDemos, newFile, openFiles, propertyPanels, propertyTabs, appMenus, applyView, describeView, documentMenu, frameworks, initialView, roles, tags, terms, viewMenu } from './demo-data'

  let value = $state<string | null>('svelte')
  let lastEvent = $state('—')
  let refreshes = $state(0)
  let diskBanner = $state(true)
  let viewMode = $state('list')
  let density = $state('regular')
  let agents = $state(6)
  let position = $state({ x: 128, y: 0, z: -64 })
  let mode = $state('parallel')
  let extras = $state<string[]>([])
  let chosenFiles = $state<File[]>([])
  let page = $state(8)
  let leadGrid = $state<DataGridController<Lead>>()
  let leadLog = $state('—')
  let comboLog = $state('—')
  let dateLog = $state('—')
  let placeLog = $state('—')
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

<section>
  <h2>Fieldset and CheckboxGroup</h2>
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

<section>
  <h2>Popover and Tooltip</h2>
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

<section id="toast">
  <h2>Toast</h2>
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
  <p class="hint">Toasts stand in the top layer and leave after five seconds; an error stays until dismissed. Rest the pointer on one, or tab to its button, and time stands still. They are announced through live regions that exist before the first toast.</p>
  <Toaster />
</section>

<section id="tabs">
  <h2>Tabs</h2>
  <Tabs items={propertyTabs} label="Object properties" onValueChange={(value) => (tabsLog = `selected ${value}`)}>
    {#snippet panel(item)}
      <p>{propertyPanels[item.value]}</p>
    {/snippet}
  </Tabs>
  <div class="row" style="align-items: center; margin-block-start: 16px">
    <div style="flex: 1; min-width: 0">
      <Tabs
        items={files}
        variant="chips"
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
  <p class="hint">Tab reaches the tab list once; the arrows move and select. Open files close with their button, Delete or a middle click, and the neighbour takes over; a dot marks unsaved changes.</p>
</section>

<section id="menubar">
  <h2>Menubar</h2>
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
  <p class="hint">A menubar: Tab reaches it once, arrows walk it, Enter or ArrowDown opens a menu. While a menu is open, ArrowLeft and ArrowRight move between menus, and so does the pointer. Hold Alt to see the access keys; Alt+F opens File, F10 goes to the bar.</p>
</section>

<section id="menu">
  <h2>Menu</h2>
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
  <p class="hint">A menu button: arrows walk every item, disabled ones too, and wrap; a letter jumps to an item; Enter or a click chooses. The view menu stays open while you toggle: the page owns the state and passes new items back.</p>
</section>

<section id="controls">
  <h2>Segmented control</h2>
  <div class="row" style="align-items: center">
    <SegmentedControl items={viewModes} label="View mode" bind:value={viewMode} />
    <SegmentedControl items={densities} label="Row density" size="sm" bind:value={density} />
  </div>
  <pre class="state">view mode is {viewMode}, density is {density}</pre>
  <p class="hint">A segmented control is native radios: one Tab stop, the arrow keys move and choose, the value submits with the form. The chosen segment is a surface and a border, never colour alone, and its weight does not change — a bolder label would shift the segments after it.</p>

  <h2 style="margin-top: 32px">Slider</h2>
  <div class="controls">
    <Slider label="Parallel agents" min={0} max={16} bind:value={agents} showValue formatValue={agentsText} />
    <Field label="Confidence threshold" hint="Below it the agent asks before acting">
      <Slider min={0} max={100} step={5} defaultValue={80} showValue />
    </Field>
  </div>
  <p class="hint">A native range input: the keys, the step and the announcement are the platform’s. The track is filled up to the thumb, which CSS cannot do by itself, so the share is handed to the theme as a custom property. The number beside it is hidden from screen readers, which already hear the value.</p>

  <h2 style="margin-top: 32px">Number field</h2>
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
  <p class="hint">Drag the axis letter sideways to change the number — Shift is ten times faster, Alt a tenth. The letter is a handle, not a label: each field is named "Position X" in full, because three squares marked X, Y and Z say nothing on their own.</p>
</section>

<section id="grid">
  <h2>Data grid</h2>
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
  <p class="hint">{HINT_ROWS}</p>
  <p class="hint">Filters are chips: press one to change it, × to remove it; Views applies a named query, and the whole query lives in the address bar. Columns hides and shows columns and remembers the layout. Select rows and the bar offers every lead the query matches; Assign really reassigns them and the grid reloads, Export writes the query or the selection.</p>
  <p class="hint">700,000 leads, answered after a 120 ms delay as a server would. Only a screenful of rows exists at a time; the scrollbar covers the whole list, and the last row is reachable. Sort by a header (Shift adds a second key), drag a header edge to resize, scroll sideways and the company stays pinned. The grid is one Tab stop: arrows move the active cell, Space selects, Shift+arrows extend, Ctrl+A selects all matching, Enter opens a lead.</p>
</section>

<section id="navigation">
  <h2>Breadcrumbs</h2>
  <Breadcrumbs items={crumbs} />
  <p class="hint">Breadcrumbs answer "where am I and how do I get one level up" — not "what else is there". An ordered list inside a named landmark, and the last crumb is the page itself: text, never a link to where you already are. The chevron is drawn, so it reaches neither a screen reader nor a copy of the path.</p>

  <h2 style="margin-top: 32px">Nav</h2>
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
  <p class="hint">Every item is a real link, so the middle click and "open in a new tab" work. The current one is marked by a bar at its edge as well as a surface, and by aria-current — never by colour alone. Naming a strip makes it a toolbar: one Tab stop, and the arrows move between the tools — so the name is only taken when the behaviour is there. A separator groups; one spacer pushes the tail to the far edge.</p>

  <h2 style="margin-top: 32px">Pagination</h2>
  <Pagination
    items={paginationRange({ page, pages: 24, previousLabel: 'Back', nextLabel: 'Forward', href: (n: number) => `#p${n}` })}
    onPageChange={(next, event) => {
      event.preventDefault()
      page = next
    }}
  />
  <pre class="state">page {page}</pre>
  <p class="hint">Pages are addresses, so these are links. At the edges the link stays reachable and is spoken as unavailable (aria-disabled): removing it would move the focus mid-journey. An ellipsis is only drawn when it stands for more than one page.</p>

  <h2 style="margin-top: 32px">Steps</h2>
  <Steps items={importSteps} label="Import" />
  <p class="hint">The bar says where the process is; the word under the name says it again in language, which is what survives a printout and a reader who cannot tell the shades apart.</p>
</section>

<section id="layout">
  <h2>Shell and split</h2>
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
  <p class="hint">{HINT_SHELL}</p>

  <h2 style="margin-top: 32px">Rail</h2>
  <div class="rail-demo">
    <Rail label="Workspaces" items={railItems} />
    <div><p>The section's content.</p></div>
  </div>
  <p class="hint">{HINT_RAIL}</p>

  <h2 style="margin-top: 32px">Page header, sections and flow</h2>
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
  <p class="hint">{HINT_FLOW}</p>
</section>

<section id="combobox">
  <h2>Combobox</h2>
  <div class="fields">
    <Combobox label="Manager" items={managerOptions} placeholder="Anyone" onValueChange={(value) => (comboLog = `manager: ${value.join(', ') || '—'}`)} />
    <Combobox label="Tags" items={tagOptions} multiple defaultValue={['renewal', 'partner']} placeholder="Add a tag" name="tags" />
    <Combobox
      label="Company"
      load={searchCompanies}
      placeholder="Search 700,000 leads"
      words={{ locale: 'en-US', more: (shown, total) => `${shown} of ${total.toLocaleString('en-US')} — type to narrow` }}
      onValueChange={(value, chosen) => (comboLog = `company: ${chosen[0]?.label ?? '—'}`)}
    />
  </div>
  <pre class="state">{comboLog}</pre>
  <p class="hint">{HINT_COMBOBOX}</p>
</section>

<section id="dates">
  <h2>Date picker and calendar</h2>
  <div class="fields">
    <DatePicker label="Follow up on" locale="en-GB" min={todayISO()} onValueChange={(value) => (dateLog = `follow up: ${value.start ?? '—'}`)} name="follow" />
    <DatePicker label="Registered between" mode="range" locale="en-GB" onValueChange={(value) => (dateLog = `registered: ${value.start ?? '…'} – ${value.end ?? '…'}`)} />
  </div>
  <div style="margin-top: 16px">
    <Calendar locale="en-GB" isDateDisabled={isWeekend} onValueChange={(value) => (dateLog = `call on: ${value.start}`)} />
  </div>
  <pre class="state">{dateLog}</pre>
  <p class="hint">{HINT_DATES}</p>
</section>

<section id="cascader">
  <h2>Cascader</h2>
  <div class="fields">
    <Cascader label="City" items={regions} defaultValue={['ru', 'tat', 'kzn']} name="city" onValueChange={(value) => (placeLog = `city: ${value.join(' / ')}`)} />
    <Cascader label="Team" items={teams} selectParents placeholder="Any team" onValueChange={(value) => (placeLog = `team: ${value.join(' / ')}`)} />
  </div>
  <pre class="state">{placeLog}</pre>
  <p class="hint">{HINT_CASCADER}</p>
</section>

<section id="fields">
  <h2>Choice cards</h2>
  <div class="form-column">
    <ChoiceCardGroup items={runModes} label="Run mode" name="mode" bind:value={mode} />
    <ChoiceCardGroup items={runExtras} type="checkbox" label="Also" name="extras" orientation="horizontal" bind:value={extras} />
  </div>
  <pre class="state">mode {mode}  ·  also {extras.join(', ') || 'nothing'}</pre>
  <p class="hint">A card is a bigger target for a real radio or checkbox — the box inside is the plain control, drawn by one rule. The heading and the explanation are inside the label, so both are the option’s name; the chosen one carries a border, a bar and its own check, never colour alone.</p>

  <h2 style="margin-top: 32px">Search, and a field with affixes</h2>
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
  <p class="hint">A native search field: the clear cross and Escape are the browser’s, so no script is needed. The magnifier is decoration and hidden from screen readers — the work is named by the label. The border belongs to the group, not to the field inside it: two borders at the join give two lines, and focus would ring half the control. An affix names nothing, so put the unit in the label or the hint too.</p>

  <h2 style="margin-top: 32px">File drop</h2>
  <div class="form-column">
    <FileDrop name="import" accept=".json,.csv" multiple hint="Up to 20 MB, the formats .json and .csv" onFilesChange={(list) => (chosenFiles = list)} />
  </div>
  <pre class="state">{chosenFiles.map((file) => `${file.name} (${Math.ceil(file.size / 1024)} KB)`).join(', ') || '—'}</pre>
  <p class="hint">Drag a file onto the zone, or press it and choose one. The input is clipped to a pixel rather than hidden, so Tab still reaches the zone; a drop writes the files into it, so the form submits them as if they had been chosen.</p>

  <h2 style="margin-top: 32px">Button group</h2>
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
  <p class="hint">Several different actions standing flush — unlike a segmented control, a group has no chosen one. Tab goes through every button, because each does its own thing.</p>
</section>

<section id="display">
  <h2>Badge, Avatar, Spinner and Skeleton</h2>
  <div class="row" style="align-items: center">
    {#each badgeTones as { tone, label } (tone)}
      <Badge {tone}>{label}</Badge>
    {/each}
    <Badge variant="outline">v2.4</Badge>
    <Badge variant="count" tone="running">12</Badge>
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
  <p class="hint">Badges state a status in words, never colour alone. An avatar shows initials until its picture has loaded, and keeps them if it fails. The spinner is a status with a name; the skeleton is hidden from assistive technology, so say what is loading elsewhere.</p>
</section>

<section id="regions">
  <h2>Card and Panel</h2>
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
  <p class="hint">A card is an object on the page, a panel is a place. Rank sets the ground, the edge and the title size: lead, default, support. A region inside a region recedes. A tone tints only the ground.</p>
</section>

<section id="banners">
  <h2>Banner and Note</h2>
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
  <p class="hint">A banner is about the whole screen and can carry actions; whether closing one hides it is for the page to decide. A note is an aside. With live set to alert, a message is announced when it appears.</p>
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
