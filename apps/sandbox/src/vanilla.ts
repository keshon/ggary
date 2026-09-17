import './theme'
import './shared.css'
import '@ggary/elements'
import type { GgCheckboxElement, GgChipGroupElement, GgMenuElement, GgMenubarElement, GgRadioGroupElement, GgSelectElement } from '@ggary/elements'
import { newFile, openFiles, propertyPanels, propertyTabs, appMenus, applyView, describeView, documentMenu, frameworks, initialView, roles, tags, terms, viewMenu } from './demo-data'

const app = document.getElementById('app')!

app.innerHTML = `
  <section>
    <h2>Button — emphasis</h2>
    <div class="row">
      <gg-button emphasis="high"><button>high</button></gg-button>
      <gg-button emphasis="medium"><button>medium</button></gg-button>
      <gg-button emphasis="low"><button>low</button></gg-button>
      <gg-button emphasis="minimal"><button>minimal</button></gg-button>
    </div>
  </section>

  <section>
    <h2>Button — tone danger, across emphasis</h2>
    <div class="row">
      <gg-button emphasis="high" tone="danger"><button>high</button></gg-button>
      <gg-button emphasis="medium" tone="danger"><button>medium</button></gg-button>
      <gg-button emphasis="low" tone="danger"><button>low</button></gg-button>
      <gg-button emphasis="minimal" tone="danger"><button>minimal</button></gg-button>
    </div>
    <p class="hint">
      &lt;gg-button&gt; <b>enhances</b> a real &lt;button&gt; in the light DOM — view source, the markup
      works before JS runs.
    </p>
  </section>

  <section>
    <h2>Button — sizes and states</h2>
    <div class="row">
      <gg-button size="sm"><button>Small</button></gg-button>
      <gg-button size="md"><button>Medium</button></gg-button>
      <gg-button size="lg"><button>Large</button></gg-button>
      <gg-button loading><button>Loading</button></gg-button>
      <gg-button disabled><button>Disabled</button></gg-button>
    </div>
  </section>

  <section>
    <h2>Chip — standalone</h2>
    <div class="row">
      <gg-chip><span>low</span></gg-chip>
      <gg-chip emphasis="medium"><span>medium</span></gg-chip>
      <gg-chip emphasis="high"><span>high</span></gg-chip>
      <gg-chip selected><span>Selected</span></gg-chip>
      <gg-chip size="sm"><span>Small</span></gg-chip>
      <gg-chip removable id="dismissible"><span>Dismiss me</span></gg-chip>
    </div>
    <p class="hint">
      Like &lt;gg-button&gt;, &lt;gg-chip&gt; <b>enhances</b> server-rendered markup. A plain chip is a
      &lt;span&gt;, not a tab stop — only chips that do something become buttons.
    </p>
  </section>

  <section>
    <h2>ChipGroup — multi select, removable</h2>
    <gg-chip-group id="filters" label="Tags" mode="multi" removable name="tags"></gg-chip-group>
    <pre class="state" id="chip-state"></pre>
    <p class="hint">
      Tab in once, then arrow between chips (they wrap), type to jump, Space toggles, Delete removes.
      Removal is a <b>request</b>: the group fires <code>chipremove</code> and this page owns the list.
    </p>
    <div class="row" style="margin-top:12px">
      <gg-button size="sm"><button id="restore">Restore removed</button></gg-button>
    </div>
  </section>

  <section>
    <h2>ChipGroup — single select, vertical</h2>
    <gg-chip-group id="single" label="Priority" mode="single" orientation="vertical"></gg-chip-group>
  </section>

  <section>
    <h2>Select</h2>
    <div class="row">
      <gg-select id="basic" label="Framework" placeholder="Pick one…"></gg-select>
      <gg-select id="preset" label="With a default" value="svelte"></gg-select>
      <gg-select id="off" label="Disabled" disabled></gg-select>
      <gg-select id="empty" label="No options"></gg-select>
    </div>
    <pre class="state" id="inspector"></pre>
  </section>

  <section>
    <h2>Field + Input</h2>
    <div class="fields">
      <gg-field label="Full name" hint="As it appears on your ID"><input name="name" autocomplete="name"></gg-field>
      <gg-field label="Email" hint="Leave the field to validate" error="Enter a valid email address">
        <input type="email" required placeholder="you@example.com">
      </gg-field>
      <gg-field label="Disabled" disabled><input value="Can&#39;t touch this"></gg-field>
      <gg-field label="Read only" hint="Selectable, copyable, not editable"><input readonly value="INV-2041"></gg-field>
    </div>
    <p class="hint">
      &lt;gg-field&gt; wraps server markup: a plain &lt;input required&gt; is enough. No error shows while you
      type the first time, only when you leave the field or submit, and once shown it clears as you fix it.
    </p>
  </section>

  <section>
    <h2>Input — sizes</h2>
    <div class="fields">
      <gg-field label="Small"><gg-input size="sm"><input placeholder="sm"></gg-input></gg-field>
      <gg-field label="Medium"><input placeholder="md"></gg-field>
      <gg-field label="Large" size="lg"><input placeholder="lg"></gg-field>
      <gg-input><input type="search" aria-label="Search" placeholder="No field, just an input"></gg-input>
    </div>
  </section>

  <section>
    <h2>Textarea</h2>
    <div class="fields">
      <gg-field label="Description" hint="Drag the corner to resize">
        <textarea name="description" rows="3"></textarea>
      </gg-field>
      <gg-field label="Notes" hint="Grows with the text, up to 8 lines">
        <gg-textarea autoresize max-rows="8"><textarea rows="2" placeholder="Start typing…"></textarea></gg-textarea>
      </gg-field>
      <gg-field label="Release notes" hint="Read only">
        <textarea readonly rows="3">v2.4.0
- Field and Input in all three adapters
- Textarea with auto-resize</textarea>
      </gg-field>
    </div>
    <p class="hint">
      A textarea shares the input's field look and states; it rests at two and a half controls tall.
      <code>autoresize</code> grows it from its <code>rows</code> to <code>max-rows</code>, then it scrolls.
    </p>
  </section>

  <section>
    <h2>Checkbox</h2>
    <div class="row">
      <gg-checkbox><label><input type="checkbox"> Unchecked</label></gg-checkbox>
      <gg-checkbox><label><input type="checkbox" checked> Checked</label></gg-checkbox>
      <gg-checkbox indeterminate><label><input type="checkbox"> Indeterminate</label></gg-checkbox>
      <gg-checkbox><label><input type="checkbox" disabled> Disabled</label></gg-checkbox>
      <gg-checkbox readonly><label><input type="checkbox" checked> Read only</label></gg-checkbox>
    </div>
    <div class="stack" id="select-all">
      <gg-checkbox id="all"><label><input type="checkbox"> All notifications</label></gg-checkbox>
      <div class="nested">
        <gg-checkbox><label><input type="checkbox" checked> Mentions</label></gg-checkbox>
        <gg-checkbox><label><input type="checkbox"> Replies</label></gg-checkbox>
        <gg-checkbox><label><input type="checkbox"> Weekly digest</label></gg-checkbox>
      </div>
    </div>
    <p class="hint">"All notifications" is indeterminate while only some are checked; checking it checks them all.</p>
  </section>

  <section>
    <h2>Switch</h2>
    <div class="row">
      <gg-switch><label><input type="checkbox" checked> Wi-Fi</label></gg-switch>
      <gg-switch><label><input type="checkbox"> Bluetooth</label></gg-switch>
      <gg-switch><label><input type="checkbox" disabled> Disabled</label></gg-switch>
      <gg-switch readonly><label><input type="checkbox" checked> Read only</label></gg-switch>
    </div>
    <div class="fields" style="margin-top:16px">
      <gg-field label="Notifications" hint="Takes effect immediately">
        <gg-switch><label><input type="checkbox"> Email me</label></gg-switch>
      </gg-field>
    </div>
  </section>

  <section>
    <h2>Radio group</h2>
    <div class="choices">
      <gg-radio-group id="plan-demo" label="Plan" name="plan-demo">
        <label><input type="radio" value="free" checked> Free</label>
        <label><input type="radio" value="pro"> Pro</label>
        <label><input type="radio" value="team" disabled> Team (contact sales)</label>
      </gg-radio-group>
      <gg-radio-group label="Billing" orientation="horizontal">
        <label><input type="radio" name="billing" value="monthly" checked> Monthly</label>
        <label><input type="radio" name="billing" value="yearly"> Yearly</label>
      </gg-radio-group>
    </div>
    <pre class="state" id="radio-state"></pre>
    <p class="hint">
      Native radios: one tab stop, arrow keys move and select, and the value submits with the form.
      The element only enhances the markup.
    </p>
  </section>

  <section>
    <h2>Field — invalid declared by the owner</h2>
    <div class="row">
      <gg-field id="username" label="Username" hint="Letters and digits" error="That username is taken">
        <input value="garry">
      </gg-field>
      <gg-button><button id="taken">Toggle “taken”</button></gg-button>
    </div>
    <p class="hint">
      A server answer is not a constraint the browser knows. <code>invalid</code> shows the error at once,
      touched or not, and the error replaces the hint in the same slot.
    </p>
  </section>

  <section>
    <h2>Field — a validated form</h2>
    <form class="stack" id="signup" novalidate>
      <gg-field label="Name" error="Tell us your name"><input name="name" required></gg-field>
      <gg-field label="Email" error="Enter a valid email address"><input name="email" type="email" required></gg-field>
      <gg-field label="Password" hint="At least 8 characters" error="Use 8 or more characters">
        <input name="password" type="password" minlength="8" required>
      </gg-field>
      <gg-fieldset legend="Plan" error="Choose a plan" required>
        <gg-radio-group name="plan" orientation="horizontal">
          <label><input type="radio" value="free"> Free</label>
          <label><input type="radio" value="pro"> Pro</label>
        </gg-radio-group>
      </gg-fieldset>
      <gg-fieldset legend="Interests" hint="Pick at least one" error="Pick at least one interest" required>
        <gg-checkbox-group name="interests">
          <label><input type="checkbox" value="design"> Design</label>
          <label><input type="checkbox" value="code"> Code</label>
          <label><input type="checkbox" value="research"> Research</label>
        </gg-checkbox-group>
      </gg-fieldset>
      <gg-field error="Accept the terms to continue">
        <gg-checkbox><label><input type="checkbox" name="terms" required> I accept the terms</label></gg-checkbox>
      </gg-field>
      <gg-field label="About you" hint="Optional, up to 280 characters">
        <gg-textarea autoresize max-rows="6"><textarea name="about" rows="2" maxlength="280"></textarea></gg-textarea>
      </gg-field>
      <div class="row">
        <gg-button emphasis="high"><button type="submit">Create account</button></gg-button>
      </div>
    </form>
    <pre class="state" id="signup-output">submit empty to see every error at once</pre>
    <p class="hint">
      <code>novalidate</code> turns off the browser bubble; <code>checkValidity()</code> on submit still
      fires each control's <code>invalid</code> event, which is what the fields listen to.
    </p>
  </section>

  <section>
    <h2>Dialog</h2>
    <div class="row">
      <gg-dialog id="edit-dialog" heading="Edit profile" description="Changes show on your public profile.">
        <gg-button slot="trigger"><button>Edit profile</button></gg-button>
        <div class="dialog-fields">
          <gg-field label="Display name"><input value="Garry"></gg-field>
          <gg-select id="role-select" label="Role" value="editor"></gg-select>
          <gg-field label="Bio" hint="Optional"><gg-textarea autoresize max-rows="6"><textarea rows="3"></textarea></gg-textarea></gg-field>
        </div>
        <footer>
          <form method="dialog">
            <gg-button emphasis="minimal"><button value="cancel">Cancel</button></gg-button>
            <gg-button emphasis="high"><button value="save">Save</button></gg-button>
          </form>
        </footer>
      </gg-dialog>

      <gg-dialog id="delete-dialog" heading="Delete project?" description="This cannot be undone." alert persistent no-close-button size="sm">
        <gg-button slot="trigger" tone="danger"><button>Delete project…</button></gg-button>
        <p>Everything in “Atlas” goes, including its run history and settings.</p>
        <footer>
          <form method="dialog">
            <gg-button emphasis="minimal"><button value="cancel">Cancel</button></gg-button>
            <gg-button emphasis="high" tone="danger"><button value="delete">Delete</button></gg-button>
          </form>
        </footer>
      </gg-dialog>

      <gg-dialog id="terms-dialog" heading="Terms of service" size="lg">
        <gg-button slot="trigger" emphasis="low"><button>Read the terms</button></gg-button>
        ${terms.map((clause, i) => `<p>${i + 1}. ${clause}</p>`).join('')}
        <footer>
          <form method="dialog"><gg-button emphasis="high"><button value="accept">Accept</button></gg-button></form>
        </footer>
      </gg-dialog>

      <gg-sheet id="parameters-sheet" heading="Run parameters" description="Applied to the next run.">
        <gg-button slot="trigger" emphasis="low"><button>Parameters…</button></gg-button>
        <div class="dialog-fields">
          <gg-field label="Agents" hint="1 to 12"><input type="number" value="7"></gg-field>
          <gg-switch><label><input type="checkbox" checked> Keep logs</label></gg-switch>
        </div>
        <footer>
          <form method="dialog"><gg-button emphasis="high"><button value="apply">Apply</button></gg-button></form>
        </footer>
      </gg-sheet>

      <gg-sheet id="sections-sheet" side="start" size="sm" heading="Sections">
        <gg-button slot="trigger" emphasis="minimal"><button>Sections (start edge)</button></gg-button>
        <p>Runs</p>
        <p>Artefacts</p>
        <p>Settings</p>
      </gg-sheet>
    </div>
    <pre class="state" id="dialog-state">open a dialog</pre>
    <p class="hint">
      A native &lt;dialog&gt; in the top layer: no portal, the page behind is inert, and it does not scroll.
      Escape and a click outside close it unless it is <code>persistent</code>; a
      <code>&lt;form method="dialog"&gt;</code> closes it and reports the button's value. A select inside a
      dialog takes the first Escape.
    </p>
  </section>

  <section>
    <h2>Fieldset and CheckboxGroup</h2>
    <div class="choices">
      <gg-fieldset legend="Notifications" hint="Sent to your work address">
        <gg-checkbox-group name="notify">
          <label><input type="checkbox" value="mentions" checked> Mentions</label>
          <label><input type="checkbox" value="replies" checked> Replies</label>
          <label><input type="checkbox" value="digest"> Weekly digest</label>
        </gg-checkbox-group>
        <gg-radio-group label="Frequency" name="frequency">
          <label><input type="radio" value="instant" checked> As it happens</label>
          <label><input type="radio" value="hourly"> Hourly summary</label>
        </gg-radio-group>
      </gg-fieldset>
      <gg-fieldset legend="Billing address" hint="Locked while an invoice is open" disabled>
        <gg-field label="Company"><input value="Atlas Ltd"></gg-field>
        <gg-field label="VAT number"><input value="GB123456789"></gg-field>
      </gg-fieldset>
    </div>
    <p class="hint">
      A native &lt;fieldset&gt; and &lt;legend&gt;: one name for a group of controls, one slot for its hint or
      error, and Field's timing — no error until focus leaves the group or a submit is attempted. A disabled
      fieldset disables everything inside it. Options sit <code>--gg-space-option</code> apart and groups
      <code>--gg-space-group</code> apart, in every theme.
    </p>
  </section>

  <section>
    <h2>Popover and Tooltip</h2>
    <div class="row" style="align-items: center">
      <gg-popover id="filters-popover" heading="Filters">
        <gg-button slot="trigger"><button>Filters</button></gg-button>
        <div class="dialog-fields">
          <gg-checkbox-group label="Show" name="show">
            <label><input type="checkbox" value="open" checked> Only open issues</label>
            <label><input type="checkbox" value="mine"> Assigned to me</label>
          </gg-checkbox-group>
          <gg-radio-group label="Sort" name="sort">
            <label><input type="radio" value="newest" checked> Newest first</label>
            <label><input type="radio" value="oldest"> Oldest first</label>
          </gg-radio-group>
        </div>
      </gg-popover>
      <gg-popover id="share-popover" heading="Share" close-button placement="bottom-end">
        <gg-button slot="trigger" emphasis="low"><button>Share…</button></gg-button>
        <gg-field label="Link" hint="Anyone with the link can view"><input readonly value="https://example.com/p/atlas"></gg-field>
      </gg-popover>
      <span style="flex: 1"></span>
      <gg-tooltip content="Bold (Ctrl+B)"><gg-button emphasis="minimal" size="sm"><button aria-label="Bold"><b>B</b></button></gg-button></gg-tooltip>
      <gg-tooltip content="Italic (Ctrl+I)"><gg-button emphasis="minimal" size="sm"><button aria-label="Italic"><i>I</i></button></gg-button></gg-tooltip>
      <gg-tooltip content="Underline (Ctrl+U)"><gg-button emphasis="minimal" size="sm"><button aria-label="Underline"><u>U</u></button></gg-button></gg-tooltip>
      <gg-tooltip content="Shown below, when there is room" placement="bottom"><gg-button emphasis="minimal" size="sm"><button>Below</button></gg-button></gg-tooltip>
    </div>
    <pre class="state" id="overlay-state">open a popover</pre>
    <p class="hint">
      Both live in the top layer as <code>popover="manual"</code> elements, placed by Floating UI: an
      <code>overflow: hidden</code> ancestor cannot clip them. A popover takes focus and gives it back; a
      tooltip describes its trigger, shows on hover after a delay or on keyboard focus at once, and moving
      along the toolbar skips the delay.
    </p>
  </section>

  <section id="tabs">
    <h2>Tabs</h2>
    <gg-tabs id="property-tabs" label="Object properties">
      ${propertyTabs
        .map((tab) => `<section data-tab="${tab.value}" data-label="${tab.label}"${tab.disabled ? ' data-disabled' : ''}><p>${propertyPanels[tab.value]}</p></section>`)
        .join('')}
    </gg-tabs>
    <div class="row" style="align-items: center; margin-block-start: 16px">
      <div style="flex: 1; min-width: 0">
        <gg-tabs id="file-tabs" variant="chips" label="Open files">
          ${openFiles
            .map((file) => `<section data-tab="${file.value}" data-label="${file.label}" data-closable${file.modified ? ' data-modified' : ''}><p>Editing ${file.label}</p></section>`)
            .join('')}
        </gg-tabs>
      </div>
      <gg-button emphasis="low"><button id="new-file">New file</button></gg-button>
    </div>
    <pre class="state" id="tabs-state">pick a tab</pre>
    <p class="hint">Tab reaches the tab list once; the arrows move and select. Open files close with their button, Delete or a middle click, and the neighbour takes over; a dot marks unsaved changes.</p>
  </section>

  <section id="menubar">
    <h2>Menubar</h2>
    <gg-menubar id="app-menubar" label="Application" mnemonics></gg-menubar>
    <pre class="state" id="menubar-state">choose something</pre>
    <p class="hint">A menubar: Tab reaches it once, arrows walk it, Enter or ArrowDown opens a menu. While a menu is open, ArrowLeft and ArrowRight move between menus, and so does the pointer. Hold Alt to see the access keys; Alt+F opens File, F10 goes to the bar.</p>
  </section>

  <section id="menu">
    <h2>Menu</h2>
    <div class="row" style="align-items: center">
      <gg-menu id="document-menu">
        <gg-button slot="trigger"><button>Document</button></gg-button>
      </gg-menu>
      <gg-menu id="view-menu" label="View options" keep-open>
        <gg-button slot="trigger" emphasis="low"><button>View</button></gg-button>
      </gg-menu>
    </div>
    <pre class="state" id="menu-state">choose something</pre>
    <p class="hint">A menu button: arrows walk every item, disabled ones too, and wrap; a letter jumps to an item; Enter or a click chooses. The view menu stays open while you toggle: the page owns the state and passes new items back.</p>
  </section>

  <section>
    <h2>Native form participation</h2>
    <form class="demo" id="demo-form">
      <gg-select id="form-select" name="framework" label="framework" placeholder="Required…"></gg-select>
      <gg-button emphasis="high" type="submit"><button type="submit">Submit</button></gg-button>
      <gg-button emphasis="minimal" type="reset"><button type="reset">Reset</button></gg-button>
    </form>
    <pre class="state" id="form-output">submit to see the FormData the hidden input contributes</pre>
  </section>
`

// `items` is a property, not an attribute: no JSON round-trip, no string parsing.
for (const id of ['basic', 'preset', 'off', 'form-select']) {
  document.querySelector<GgSelectElement>(`#${id}`)!.items = frameworks
}
document.querySelector<GgSelectElement>('#empty')!.items = []

// --- chips -----------------------------------------------------------------
const filters = document.querySelector<GgChipGroupElement>('#filters')!
filters.items = tags
document.querySelector<GgChipGroupElement>('#single')!.items = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
]

const chipState = document.getElementById('chip-state')!
const paintChips = () => {
  chipState.innerHTML = [
    `selection   <b>${JSON.stringify(filters.selection)}</b>`,
    `items       <b>${filters.items.length}</b>`,
    `tab stop    <b>${filters.querySelector('[data-part="root"][tabindex="0"]')?.textContent?.trim() ?? '—'}</b>`,
  ].join('\n')
}

// The owner owns the list. The group only asks.
filters.addEventListener('chipremove', (event) => {
  const { value } = (event as CustomEvent).detail
  filters.items = filters.items.filter((item) => item.value !== value)
  paintChips()
})
filters.addEventListener('selectionchange', paintChips)
document.getElementById('restore')!.addEventListener('click', () => {
  filters.items = tags
  paintChips()
})
new MutationObserver(paintChips).observe(filters, { attributes: true, subtree: true })
paintChips()

document.getElementById('dismissible')!.addEventListener('remove', (event) => {
  (event.currentTarget as HTMLElement).remove()
})

// --- state inspector -------------------------------------------------------
// Reads nothing but the public DOM contract: `valuechange` and `data-state`.
// If a third-party component emitted the same attributes, this would work on it
// unchanged — that is what "the contract is the API" buys you.
const basic = document.querySelector<GgSelectElement>('#basic')!
const inspector = document.getElementById('inspector')!
const trigger = () => basic.querySelector('[data-part="trigger"]')!

const paint = () => {
  const el = trigger()
  inspector.innerHTML = [
    `value                  <b>${JSON.stringify(basic.value)}</b>`,
    `data-state             <b>${el.getAttribute('data-state')}</b>`,
    `aria-expanded          <b>${el.getAttribute('aria-expanded')}</b>`,
    `aria-activedescendant  <b>${el.getAttribute('aria-activedescendant') ?? '—'}</b>`,
  ].join('\n')
}

basic.addEventListener('valuechange', paint)
new MutationObserver(paint).observe(basic, { attributes: true, subtree: true })
paint()

// --- form ------------------------------------------------------------------
const form = document.getElementById('demo-form') as HTMLFormElement
const output = document.getElementById('form-output')!

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const entries = [...new FormData(form).entries()]
  output.textContent = entries.length
    ? entries.map(([key, value]) => `${key} = ${JSON.stringify(value)}`).join('\n')
    : '(empty form)'
})
form.addEventListener('reset', () => {
  document.querySelector<GgSelectElement>('#form-select')!.value = null
  output.textContent = 'reset'
})

// --- fields ------------------------------------------------------------------
const username = document.getElementById('username')!
document.getElementById('taken')!.addEventListener('click', () => username.toggleAttribute('invalid'))

const signup = document.getElementById('signup') as HTMLFormElement
const signupOutput = document.getElementById('signup-output')!
signup.addEventListener('submit', (event) => {
  event.preventDefault()
  if (!signup.checkValidity()) {
    signupOutput.textContent = 'invalid — see the fields'
    return
  }
  const entries = [...new FormData(signup).entries()]
  signupOutput.textContent = entries.map(([key, value]) => `${key} = ${JSON.stringify(value)}`).join('\n')
})

// --- choice controls -----------------------------------------------------------
const all = document.querySelector<GgCheckboxElement>('#all')!
const notifications = [...document.querySelectorAll<GgCheckboxElement>('#select-all .nested gg-checkbox')]
const syncAll = () => {
  const on = notifications.filter((box) => box.checked).length
  all.indeterminate = on > 0 && on < notifications.length
  all.checked = on === notifications.length
}
notifications.forEach((box) => box.addEventListener('checkedchange', syncAll))
all.addEventListener('checkedchange', (event) => {
  const on = (event as CustomEvent).detail.checked
  notifications.forEach((box) => (box.checked = on))
  syncAll()
})
syncAll()

const planDemo = document.querySelector<GgRadioGroupElement>('#plan-demo')!
const radioState = document.getElementById('radio-state')!
const paintPlan = () => (radioState.innerHTML = `value  <b>${JSON.stringify(planDemo.value)}</b>`)
planDemo.addEventListener('valuechange', paintPlan)
paintPlan()

// --- dialogs -------------------------------------------------------------------
document.querySelector<GgSelectElement>('#role-select')!.items = roles
const dialogState = document.getElementById('dialog-state')!
for (const id of ['edit-dialog', 'delete-dialog', 'terms-dialog', 'parameters-sheet', 'sections-sheet']) {
  document.getElementById(id)!.addEventListener('openchange', (event) => {
    const { open, reason, returnValue } = (event as CustomEvent).detail
    dialogState.innerHTML = `${id}  <b>${open ? 'open' : 'closed'}</b>  reason <b>${reason}</b>${returnValue ? `  returnValue <b>${returnValue}</b>` : ''}`
  })
}

// --- popovers ------------------------------------------------------------------
const overlayState = document.getElementById('overlay-state')!
for (const id of ['filters-popover', 'share-popover']) {
  document.getElementById(id)!.addEventListener('openchange', (event) => {
    const { open, reason } = (event as CustomEvent).detail
    overlayState.innerHTML = `${id}  <b>${open ? 'open' : 'closed'}</b>  reason <b>${reason}</b>`
  })
}

// --- menus ---------------------------------------------------------------------
const menuState = document.getElementById('menu-state')!
const documentMenuEl = document.getElementById('document-menu') as GgMenuElement
documentMenuEl.items = documentMenu
documentMenuEl.addEventListener('itemselect', (event) => {
  menuState.textContent = `chose ${(event as CustomEvent).detail.value}`
})

// The page owns the toggles: every choice comes back as new items.
let view = initialView
const viewMenuEl = document.getElementById('view-menu') as GgMenuElement
viewMenuEl.items = viewMenu(view)
viewMenuEl.addEventListener('itemselect', (event) => {
  const { value, checked } = (event as CustomEvent).detail
  view = applyView(view, value, checked)
  viewMenuEl.items = viewMenu(view)
  menubar.menus = appMenus(view)
  menuState.textContent = describeView(view)
})

// --- menubar ------------------------------------------------------------------
const menubarState = document.getElementById('menubar-state')!
const menubar = document.getElementById('app-menubar') as GgMenubarElement
menubar.menus = appMenus(view)
menubar.addEventListener('itemselect', (event) => {
  const { value, checked, menu } = (event as CustomEvent).detail
  const next = applyView(view, value, checked)
  menubarState.textContent = next === view ? `chose ${menu} / ${value}` : describeView(next)
  view = next
  menubar.menus = appMenus(view)
  viewMenuEl.items = viewMenu(view)
})

// --- tabs ------------------------------------------------------------------------
const tabsState = document.getElementById('tabs-state')!
const fileTabs = document.getElementById('file-tabs')!
for (const id of ['property-tabs', 'file-tabs']) {
  document.getElementById(id)!.addEventListener('valuechange', (event) => {
    tabsState.textContent = `selected ${(event as CustomEvent).detail.value}`
  })
}
// Closing is the page's: remove the panel, and the tab goes with it.
fileTabs.addEventListener('tabclose', (event) => {
  const { value } = (event as CustomEvent).detail
  fileTabs.querySelector(`[data-tab="${CSS.escape(value)}"]`)?.remove()
  tabsState.textContent = `closed ${value}`
})
document.getElementById('new-file')!.addEventListener('click', () => {
  const file = newFile()
  const panel = document.createElement('section')
  Object.assign(panel.dataset, { tab: file.value, label: file.label })
  panel.toggleAttribute('data-closable', true)
  panel.toggleAttribute('data-modified', true)
  panel.innerHTML = `<p>Editing ${file.label}</p>`
  fileTabs.append(panel)
})
