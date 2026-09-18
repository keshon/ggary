import './theme'
import './shared.css'
import '@ggary/elements'
import { toast } from '@ggary/elements'
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
  statusItems,
  statusTone,
  HINT_ROWS,
  type Lead,
} from './leads'
import { attachColumnStorage, attachQueryToUrl } from '@ggary/core/data-grid'
import type { GgDataGridElement, GgGridDetailElement, GgGridMenuElement, GgAvatarGroupElement, GgCheckboxElement, GgSliderElement, GgChipGroupElement, GgMenuElement, GgMenubarElement, GgRadioGroupElement, GgSelectElement } from '@ggary/elements'
import { agentsText, badgeTones, crumbs, densities, importSteps, layoutLeads, navGroups, railItems, HINT_RAIL, HINT_SHELL, people, runExtras, runModes, viewModes, toastDemos, newFile, openFiles, propertyPanels, propertyTabs, appMenus, applyView, describeView, documentMenu, frameworks, initialView, roles, tags, terms, viewMenu } from './demo-data'

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

  <section id="toast">
    <h2>Toast</h2>
    <div class="row">
      <gg-button><button data-toast="queued">Success</button></gg-button>
      <gg-button><button data-toast="failed">Error that stays</button></gg-button>
      <gg-button><button data-toast="warn">Warning</button></gg-button>
      <gg-button emphasis="low"><button id="toast-saving">Saving, then saved</button></gg-button>
      <gg-button emphasis="minimal"><button id="toast-undo">With an action</button></gg-button>
    </div>
    <p class="hint">Toasts stand in the top layer and leave after five seconds; an error stays until dismissed. Rest the pointer on one, or tab to its button, and time stands still. They are announced through live regions that exist before the first toast.</p>
    <gg-toaster></gg-toaster>
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

  <section id="controls">
    <h2>Segmented control</h2>
    <div class="row" style="align-items: center">
      <gg-segmented-control id="view-mode" label="View mode" name="view">
        ${viewModes
          .map(
            (mode) =>
              `<label><input type="radio" value="${mode.value}"${mode.value === 'list' ? ' checked' : ''}${mode.disabled ? ' disabled' : ''}> ${mode.label}</label>`
          )
          .join('')}
      </gg-segmented-control>
      <gg-segmented-control id="density-control" label="Row density" size="sm">
        ${densities
          .map((item) => `<label><input type="radio" value="${item.value}"${item.value === 'regular' ? ' checked' : ''}> ${item.label}</label>`)
          .join('')}
      </gg-segmented-control>
    </div>
    <pre class="state" id="controls-state">—</pre>
    <p class="hint">A segmented control is native radios: one Tab stop, the arrow keys move and choose, the value submits with the form. The chosen segment is a surface and a border, never colour alone, and its weight does not change — a bolder label would shift the segments after it.</p>

    <h2 style="margin-top: 32px">Slider</h2>
    <div class="controls">
      <gg-slider id="agents-slider" label="Parallel agents" show-value>
        <input type="range" name="agents" min="0" max="16" step="1" value="6">
      </gg-slider>
      <gg-field label="Confidence threshold" hint="Below it the agent asks before acting">
        <gg-slider show-value>
          <input type="range" name="confidence" min="0" max="100" step="5" value="80">
        </gg-slider>
      </gg-field>
    </div>
    <p class="hint">A native range input: the keys, the step and the announcement are the platform’s. The track is filled up to the thumb, which CSS cannot do by itself, so the share is handed to the theme as a custom property. The number beside it is hidden from screen readers, which already hear the value.</p>

    <h2 style="margin-top: 32px">Number field</h2>
    <div class="vector">
      <gg-number-field axis="X" label="Position X"><input type="number" name="x" value="128" step="1"></gg-number-field>
      <gg-number-field axis="Y" label="Position Y"><input type="number" name="y" value="0" step="1"></gg-number-field>
      <gg-number-field axis="Z" label="Position Z"><input type="number" name="z" value="-64" step="1"></gg-number-field>
    </div>
    <div class="controls">
      <gg-field label="Opacity" hint="Between 0 and 1, in hundredths">
        <gg-number-field size="sm"><input type="number" name="opacity" value="0.5" step="0.01" min="0" max="1"></gg-number-field>
      </gg-field>
    </div>
    <pre class="state" id="number-state">—</pre>
    <p class="hint">Drag the axis letter sideways to change the number — Shift is ten times faster, Alt a tenth. The letter is a handle, not a label: each field is named "Position X" in full, because three squares marked X, Y and Z say nothing on their own.</p>
  </section>

  <section id="grid">
    <h2>Data grid</h2>
    <div class="row" style="align-items: center; margin-bottom: 12px">
      <gg-search label="Search the leads" style="flex: 1 1 18rem"><input type="search" id="lead-search" placeholder="Company, contact or email"></gg-search>
      <span class="hint" id="lead-count" style="margin: 0">Loading…</span>
      <gg-grid-columns for="leads"></gg-grid-columns>
      <gg-button size="sm" emphasis="low"><button id="lead-export">Export CSV</button></gg-button>
    </div>
    <div class="grid-tools">
      <gg-grid-filters for="leads" id="lead-filters"></gg-grid-filters>
      <gg-grid-bulk for="leads">
        <gg-menu id="lead-assign"><gg-button slot="trigger" size="sm"><button>Assign to…</button></gg-button></gg-menu>
        <gg-button size="sm" emphasis="low"><button id="lead-export-selected">Export selected</button></gg-button>
      </gg-grid-bulk>
    </div>
    <gg-data-grid id="leads" label="Leads" selectable locale="en-US" style="block-size: 520px"></gg-data-grid>
    <gg-grid-menu for="leads" id="lead-menu"></gg-grid-menu>
    <gg-grid-detail for="leads" id="lead-detail"></gg-grid-detail>
    <pre class="state" id="lead-state">—</pre>
    <p class="hint">${HINT_ROWS}</p>
    <p class="hint">Filters are chips: press one to change it, × to remove it; Views applies a named query, and the whole query lives in the address bar. Columns hides and shows columns and remembers the layout. Select rows and the bar offers every lead the query matches; Assign really reassigns them and the grid reloads, Export writes the query or the selection.</p>
    <p class="hint">700,000 leads, answered after a 120 ms delay as a server would. Only a screenful of rows exists at a time; the scrollbar covers the whole list, and the last row is reachable. Sort by a header (Shift adds a second key), drag a header edge to resize, scroll sideways and the company stays pinned. The grid is one Tab stop: arrows move the active cell, Space selects, Shift+arrows extend, Ctrl+A selects all matching, Enter opens a lead.</p>
  </section>

  <section id="navigation">
    <h2>Breadcrumbs</h2>
    <gg-breadcrumbs label="Breadcrumbs">
      ${crumbs.map((crumb) => (crumb.href ? `<a href="${crumb.href}">${crumb.label}</a>` : `<span>${crumb.label}</span>`)).join('')}
    </gg-breadcrumbs>
    <p class="hint">Breadcrumbs answer "where am I and how do I get one level up" — not "what else is there". An ordered list inside a named landmark, and the last crumb is the page itself: text, never a link to where you already are. The chevron is drawn, so it reaches neither a screen reader nor a copy of the path.</p>

    <h2 style="margin-top: 32px">Nav</h2>
    <div class="nav-demo">
      <gg-nav label="Sections">
        ${navGroups
          .map(
            (group) =>
              `<div data-group="${group.label}">${group.items
                .map(
                  (item, index) =>
                    `<a href="${item.href}" data-icon="${item.icon}"${group.label === 'Work' && index === 0 ? ' aria-current="page"' : ''}>${item.label}${
                      'count' in item ? `<span data-count>${item.count}</span>` : ''
                    }</a>`
                )
                .join('')}</div>`
          )
          .join('')}
      </gg-nav>
      <gg-panel heading="Runs">
        <gg-toolbar label="Run tools" slot="toolbar">
          <gg-button size="sm" emphasis="minimal"><button>Filter</button></gg-button>
          <gg-button size="sm" emphasis="minimal"><button>Sort</button></gg-button>
          <span data-separator></span>
          <gg-button size="sm" emphasis="minimal"><button>Export</button></gg-button>
          <span data-spacer></span>
          <gg-badge tone="running">7 running</gg-badge>
        </gg-toolbar>
        <p>Rows would stand here.</p>
      </gg-panel>
    </div>
    <p class="hint">Every item is a real link, so the middle click and "open in a new tab" work. The current one is marked by a bar at its edge as well as a surface, and by aria-current — never by colour alone. Naming a strip makes it a toolbar: one Tab stop, and the arrows move between the tools — so the name is only taken when the behaviour is there. A separator groups; one spacer pushes the tail to the far edge.</p>

    <h2 style="margin-top: 32px">Pagination</h2>
    <gg-pagination id="pages" label="Pages">
      <a href="#p7" data-page="7">Back</a>
      <a href="#p1" data-page="1">1</a>
      <span>…</span>
      <a href="#p7" data-page="7">7</a>
      <a href="#p8" data-page="8" aria-current="page">8</a>
      <a href="#p9" data-page="9">9</a>
      <span>…</span>
      <a href="#p24" data-page="24">24</a>
      <a href="#p9" data-page="9">Forward</a>
    </gg-pagination>
    <pre class="state" id="pages-state">—</pre>
    <p class="hint">Pages are addresses, so these are links. At the edges the link stays reachable and is spoken as unavailable (aria-disabled): removing it would move the focus mid-journey. An ellipsis is only drawn when it stands for more than one page.</p>

    <h2 style="margin-top: 32px">Steps</h2>
    <gg-steps label="Import">
      ${importSteps.map((step) => `<div data-state="${step.state}">${step.name}</div>`).join('')}
    </gg-steps>
    <p class="hint">The bar says where the process is; the word under the name says it again in language, which is what survives a printout and a reader who cannot tell the shades apart.</p>
  </section>

  <section id="layout">
    <h2>Shell and split</h2>
    <div class="shell-demo">
      <gg-shell>
        <a slot="brand" href="#layout">Leads</a>
        <gg-nav slot="aside" label="Sections">
          ${navGroups
            .map(
              (group, index) =>
                `<div data-group="${group.label}">${group.items
                  .map(
                    (item, itemIndex) =>
                      `<a href="${item.href}" data-icon="${item.icon}"${index === 0 && itemIndex === 0 ? ' aria-current="page"' : ''}>${item.label}${'count' in item && item.count !== undefined ? `<span data-count>${item.count}</span>` : ''}</a>`
                  )
                  .join('')}</div>`
            )
            .join('')}
        </gg-nav>
        <gg-breadcrumbs slot="header" label="Breadcrumbs">
          ${crumbs.map((crumb) => (crumb.href ? `<a href="${crumb.href}">${crumb.label}</a>` : `<span>${crumb.label}</span>`)).join('')}
        </gg-breadcrumbs>
        <gg-status-bar slot="footer" label="Registry status">
          <span>main</span>
          <span data-tone="error">3 failed saves</span>
          <span data-spacer></span>
          <span>700,000 leads</span>
          <gg-button size="sm" emphasis="minimal"><button>Sync</button></gg-button>
        </gg-status-bar>
        <gg-split label="Resize the lead list" collapsible default-size="260" min="180" max="420" rest-min="220" style="block-size: 100%">
          <ul>${layoutLeads.map((lead) => `<li>${lead}</li>`).join('')}</ul>
          <article>
            <h3 style="margin-top: 0">Acme Labs 214</h3>
            <p>The lead would stand here, beside the list it was picked from.</p>
          </article>
        </gg-split>
      </gg-shell>
    </div>
    <p class="hint">${HINT_SHELL}</p>

    <h2 style="margin-top: 32px">Rail</h2>
    <div class="rail-demo">
      <gg-rail label="Workspaces">
        ${railItems
          .map(
            (item) =>
              `<a href="${item.href}" data-icon="${item.icon}"${item.current ? ' aria-current="page"' : ''}${item.end ? ' data-end' : ''}>${item.label}${item.count !== undefined ? `<span data-count>${item.count}</span>` : ''}</a>`
          )
          .join('')}
      </gg-rail>
      <div><p>The section's content.</p></div>
    </div>
    <p class="hint">${HINT_RAIL}</p>
  </section>

  <section id="fields">
    <h2>Choice cards</h2>
    <div class="form-column">
      <gg-choice-cards id="run-mode" label="Run mode" name="mode">
        ${runModes
          .map(
            (mode) =>
              `<label><input type="radio" value="${mode.value}"${mode.value === 'parallel' ? ' checked' : ''}${mode.disabled ? ' disabled' : ''}>${mode.title}<span slot="description">${mode.description}</span></label>`
          )
          .join('')}
      </gg-choice-cards>
      <gg-choice-cards id="run-extras" label="Also" type="checkbox" name="extras" orientation="horizontal">
        ${runExtras
          .map((item) => `<label><input type="checkbox" value="${item.value}">${item.title}<span slot="description">${item.description}</span></label>`)
          .join('')}
      </gg-choice-cards>
    </div>
    <pre class="state" id="cards-state">—</pre>
    <p class="hint">A card is a bigger target for a real radio or checkbox — the box inside is the plain control, drawn by one rule. The heading and the explanation are inside the label, so both are the option’s name; the chosen one carries a border, a bar and its own check, never colour alone.</p>

    <h2 style="margin-top: 32px">Search, and a field with affixes</h2>
    <div class="form-column">
      <gg-field label="Search the runs" hint="By name, id or the agent that started it">
        <gg-search><input type="search" name="q" placeholder="worldgen"></gg-search>
      </gg-field>
      <gg-field label="Budget" hint="Per agent, in dollars an hour">
        <gg-input-group prefix="$" suffix="per hour"><input type="number" name="budget" value="12" step="1" min="0"></gg-input-group>
      </gg-field>
      <gg-input-group suffix=".example.com" size="sm"><input name="subdomain" value="worldbox" aria-label="Subdomain"></gg-input-group>
    </div>
    <p class="hint">A native search field: the clear cross and Escape are the browser’s, so no script is needed. The magnifier is decoration and hidden from screen readers — the work is named by the label. The border belongs to the group, not to the field inside it: two borders at the join give two lines, and focus would ring half the control. An affix names nothing, so put the unit in the label or the hint too.</p>

    <h2 style="margin-top: 32px">File drop</h2>
    <div class="form-column">
      <gg-file-drop label="Drag files in or choose them" hint="Up to 20 MB, the formats .json and .csv">
        <input type="file" name="import" accept=".json,.csv" multiple>
      </gg-file-drop>
    </div>
    <pre class="state" id="files-state">—</pre>
    <p class="hint">Drag a file onto the zone, or press it and choose one. The input is clipped to a pixel rather than hidden, so Tab still reaches the zone; a drop writes the files into it, so the form submits them as if they had been chosen.</p>

    <h2 style="margin-top: 32px">Button group</h2>
    <div class="row">
      <gg-button-group size="sm" label="Alignment">
        <gg-button size="sm" emphasis="medium"><button>Left</button></gg-button>
        <gg-button size="sm" emphasis="medium"><button>Centre</button></gg-button>
        <gg-button size="sm" emphasis="medium"><button>Right</button></gg-button>
      </gg-button-group>
      <gg-button-group>
        <gg-button emphasis="medium"><button>Run</button></gg-button>
        <gg-button emphasis="medium"><button>Schedule</button></gg-button>
      </gg-button-group>
    </div>
    <p class="hint">Several different actions standing flush — unlike a segmented control, a group has no chosen one. Tab goes through every button, because each does its own thing.</p>
  </section>

  <section id="display">
    <h2>Badge, Avatar, Spinner and Skeleton</h2>
    <div class="row" style="align-items: center">
      ${badgeTones.map(({ tone, label }) => `<gg-badge tone="${tone}">${label}</gg-badge>`).join('')}
      <gg-badge variant="outline">v2.4</gg-badge>
      <gg-badge variant="count" tone="running">12</gg-badge>
    </div>
    <div class="row" style="align-items: center; margin-top: 16px">
      <gg-avatar name="Ada Lovelace" size="sm"></gg-avatar>
      <gg-avatar name="Alan Turing"></gg-avatar>
      <gg-avatar name="Grace Hopper" size="lg"></gg-avatar>
      <gg-avatar-group id="team" label="Reviewers" max="3"></gg-avatar-group>
      <gg-spinner label="Loading runs" size="sm"></gg-spinner>
      <gg-spinner label="Loading runs"></gg-spinner>
      <gg-spinner label="Loading runs" size="lg"></gg-spinner>
    </div>
    <div class="tiles">
      <gg-card heading="Loading…"><gg-skeleton title lines="3"></gg-skeleton></gg-card>
    </div>
    <p class="hint">Badges state a status in words, never colour alone. An avatar shows initials until its picture has loaded, and keeps them if it fails. The spinner is a status with a name; the skeleton is hidden from assistive technology, so say what is loading elsewhere.</p>
  </section>

  <section id="regions">
    <h2>Card and Panel</h2>
    <div class="tiles">
      <gg-card heading="Deployments" subtitle="Last 24 hours" rank="lead">42 successful, 1 rolled back.</gg-card>
      <gg-card id="queue-card" heading="Queue" interactive>Nothing waiting. Click to refresh.</gg-card>
      <gg-card heading="Archive" rank="support">Runs older than 90 days.</gg-card>
    </div>
    <div class="panels">
      <gg-panel heading="Runners" region>
        <gg-button slot="actions" emphasis="minimal" size="sm"><button>Add runner</button></gg-button>
        <div class="banners">
          <gg-card heading="runner-01" tone="ok">Idle, last job 2 minutes ago.</gg-card>
          <gg-note tone="warn">runner-02 has not reported for 5 minutes.</gg-note>
        </div>
      </gg-panel>
      <gg-panel heading="Artifacts">
        <gg-empty-state heading="No artifacts yet" description="Artifacts appear here after the first successful build.">
          <gg-button emphasis="low" size="sm"><button>Start a build</button></gg-button>
        </gg-empty-state>
      </gg-panel>
    </div>
    <pre class="state" id="regions-state">—</pre>
    <p class="hint">A card is an object on the page, a panel is a place. Rank sets the ground, the edge and the title size: lead, default, support. A region inside a region recedes. A tone tints only the ground. Link cards are React and Svelte only: an element cannot become an anchor.</p>
  </section>

  <section id="banners">
    <h2>Banner and Note</h2>
    <div class="banners">
      <gg-banner id="disk-banner" tone="warn" heading="Disk almost full" dismissible>
        Old snapshots will be pruned tonight.
        <gg-button slot="actions" emphasis="low" size="sm"><button>Review</button></gg-button>
      </gg-banner>
      <gg-banner tone="error" heading="Build failed" live="alert">3 tests failed on main.</gg-banner>
      <gg-banner>Maintenance on Sunday, 02:00 UTC.</gg-banner>
      <gg-note>Notes are asides: the bar only groups, the words carry the meaning.</gg-note>
      <gg-note tone="error">Deleting a project cannot be undone.</gg-note>
    </div>
    <div class="row" style="margin-top: 12px">
      <gg-button emphasis="minimal"><button id="banner-restore">Show the banner again</button></gg-button>
    </div>
    <p class="hint">A banner is about the whole screen and can carry actions; whether closing one hides it is for the page to decide. A note is an aside. With live set to alert, a message is announced when it appears.</p>
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

// --- toast -------------------------------------------------------------------------
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-toast]')) {
  button.addEventListener('click', () => toast({ ...toastDemos[button.dataset.toast as keyof typeof toastDemos] }))
}
document.getElementById('toast-saving')!.addEventListener('click', () => {
  const id = toast({ tone: 'running', title: 'Saving…', duration: 0 })
  setTimeout(() => toast({ id, tone: 'ok', title: 'Saved' }), 1500)
})
document.getElementById('toast-undo')!.addEventListener('click', () => {
  toast({ title: 'Task deleted', action: { label: 'Undo', onClick: () => toast({ title: 'Task restored' }) } })
})

// --- display -----------------------------------------------------------------------
;(document.getElementById('team') as GgAvatarGroupElement).people = people
let refreshes = 0
document.getElementById('queue-card')!.addEventListener('click', () => {
  document.getElementById('regions-state')!.textContent = `refreshed the queue ${++refreshes}×`
})
// Unprevented, a dismissed banner hides itself; showing it again is the page's.
const diskBanner = document.getElementById('disk-banner')!
document.getElementById('banner-restore')!.addEventListener('click', () => diskBanner.removeAttribute('hidden'))


// --- controls ----------------------------------------------------------------------
const controlsState = document.getElementById('controls-state')!
for (const id of ['view-mode', 'density-control']) {
  document.getElementById(id)!.addEventListener('valuechange', (event) => {
    controlsState.textContent = `${id} is ${(event as CustomEvent).detail.value}`
  })
}
// The words beside the thumb are the page's: the kit shows the number.
;(document.getElementById('agents-slider') as GgSliderElement).formatValue = agentsText

const numberState = document.getElementById('number-state')!
const position: Record<string, string> = { x: '128', y: '0', z: '-64' }
for (const field of document.querySelectorAll('gg-number-field')) {
  field.addEventListener('valuechange', (event) => {
    const input = field.querySelector('input')!
    if (!input.name) return
    position[input.name] = String((event as CustomEvent).detail.value ?? '')
    numberState.textContent = `x ${position.x}  y ${position.y}  z ${position.z}`
  })
}

// --- fields ------------------------------------------------------------------------
const cardsState = document.getElementById('cards-state')!
const choices: Record<string, string> = { 'run-mode': 'parallel', 'run-extras': '' }
for (const id of ['run-mode', 'run-extras']) {
  document.getElementById(id)!.addEventListener('valuechange', (event) => {
    const { value } = (event as CustomEvent).detail
    choices[id] = Array.isArray(value) ? value.join(', ') || 'nothing' : value
    cardsState.textContent = `mode ${choices['run-mode']}  ·  also ${choices['run-extras'] || 'nothing'}`
  })
}

const filesState = document.getElementById('files-state')!
document.querySelector('gg-file-drop')!.addEventListener('fileschange', (event) => {
  const { files } = (event as CustomEvent).detail as { files: File[] }
  filesState.textContent = files.map((file) => `${file.name} (${Math.ceil(file.size / 1024)} KB)`).join(', ')
})

// --- navigation ---------------------------------------------------------------------
const pagesState = document.getElementById('pages-state')!
document.getElementById('pages')!.addEventListener('pagechange', (event) => {
  const { page, event: press } = (event as CustomEvent).detail as { page: number; event: Event }
  // The demo has nowhere to go, so it keeps the page and only reports it.
  press.preventDefault()
  pagesState.textContent = `page ${page}`
})

// --- data grid -----------------------------------------------------------------------
const leadGrid = document.getElementById('leads') as GgDataGridElement<Lead>
leadGrid.rowKey = (lead) => lead.id
leadGrid.columns = leadColumns
leadGrid.renderCell = (lead, column, text) => {
  if (column.id !== 'status') return text
  const badge = document.createElement('gg-badge')
  badge.setAttribute('tone', statusTone[lead.status])
  badge.textContent = text
  return badge
}
leadGrid.onCellEdit = saveLead
leadGrid.source = leadSource

// What opens from a row: its menu, and the lead in a sheet.
const leadMenuElement = document.getElementById('lead-menu') as GgGridMenuElement
leadMenuElement.items = (target) => leadMenu(target as Parameters<typeof leadMenu>[0])
leadMenuElement.addEventListener('itemselect', async (event) => {
  const { value, target } = (event as CustomEvent).detail
  const said = await runLeadMenu(leadGrid.controller!, value, target)
  if (said) toast({ tone: 'ok', title: said })
})
const leadDetail = document.getElementById('lead-detail') as GgGridDetailElement
leadDetail.words = { locale: 'en-US' }
leadDetail.heading = (lead: Lead) => lead.company
leadDetail.description = (lead: Lead) => `Lead ${lead.id.toLocaleString('en-US')}`
leadDetail.render = (lead: Lead, index: number) => {
  const box = document.createElement('div')
  box.className = 'lead-detail'
  const status = document.createElement('gg-select') as GgSelectElement
  status.setAttribute('label', 'Status')
  status.items = statusItems
  status.value = lead.status
  status.addEventListener('valuechange', (event) => {
    const next = (event as CustomEvent).detail.value
    if (next && next !== lead.status) void leadGrid.controller!.saveCell(index, 'status', next)
  })
  const facts = document.createElement('dl')
  for (const fact of leadFacts(lead)) {
    const item = document.createElement('div')
    const term = document.createElement('dt')
    term.textContent = fact.label
    const text = document.createElement('dd')
    text.textContent = fact.text
    item.append(term, text)
    facts.append(item)
  }
  box.append(status, facts)
  return box
}
const leadState = document.getElementById('lead-state')!
const leadCount = document.getElementById('lead-count')!
const showCount = () => {
  const snapshot = leadGrid.controller?.getSnapshot()
  const total = snapshot?.data.total
  leadCount.textContent = total === undefined ? 'Loading…' : `${total.toLocaleString('en-US')} leads`
}
leadGrid.controller?.subscribe(showCount)
leadGrid.addEventListener('rowactivate', (event) => {
  const { row } = (event as CustomEvent).detail as { row: Lead }
  leadState.textContent = `opened ${row.company} — ${row.contact}`
})
leadGrid.addEventListener('selectionchange', (event) => {
  const { selection } = (event as CustomEvent).detail
  leadState.textContent = selection.mode === 'matching' ? 'selected: every lead matching' : `selected: ${selection.keys.size}`
})
document.getElementById('lead-search')!.addEventListener(
  'input',
  debounce((event: Event) => leadGrid.controller?.send({ type: 'SET_SEARCH', search: (event.target as HTMLInputElement).value }))
)

// The grid's tools: views, the address bar, remembered columns, the bulk actions.
;(document.getElementById('lead-filters') as HTMLElement & { views: unknown }).views = leadViews
const leadAssign = document.getElementById('lead-assign') as HTMLElement & { items: unknown }
leadAssign.items = managerItems
const whenGrid = (run: () => void) => (leadGrid.controller ? run() : leadGrid.addEventListener('gridready', run, { once: true }))
whenGrid(() => {
  attachQueryToUrl(leadGrid.controller!)
  attachColumnStorage(leadGrid.controller!, 'gg-sandbox-leads-columns')
})
leadAssign.addEventListener('itemselect', async (event) => {
  const manager = (event as CustomEvent).detail.value as string
  const count = await assignLeads(leadGrid.controller!, manager)
  toast({ tone: 'ok', title: `Assigned ${count.toLocaleString('en-US')} leads to ${manager}` })
})
const exportAllLeads = async () => {
  const id = toast({ tone: 'running', title: 'Exporting…', duration: 0 })
  const count = await exportLeads(leadGrid.controller!, (done, total) =>
    toast({ id, tone: 'running', title: `Exporting… ${Math.round((done / total) * 100)}%` })
  )
  toast({ id, tone: 'ok', title: `Exported ${count.toLocaleString('en-US')} leads` })
}
document.getElementById('lead-export')!.addEventListener('click', exportAllLeads)
document.getElementById('lead-export-selected')!.addEventListener('click', exportAllLeads)
