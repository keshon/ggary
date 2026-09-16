import '@ggary/styles'
import './shared.css'
import '@ggary/elements'
import type { GgChipGroupElement, GgSelectElement } from '@ggary/elements'
import { frameworks, installThemeToggle, tags } from './demo-data'

installThemeToggle(document.getElementById('theme-toggle')!)

const app = document.getElementById('app')!

app.innerHTML = `
  <section>
    <h2>Button — variants</h2>
    <div class="row">
      <gg-button><button>Solid</button></gg-button>
      <gg-button variant="subtle"><button>Subtle</button></gg-button>
      <gg-button variant="outline"><button>Outline</button></gg-button>
      <gg-button variant="ghost"><button>Ghost</button></gg-button>
      <gg-button variant="danger"><button>Danger</button></gg-button>
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
      <gg-chip><span>Plain</span></gg-chip>
      <gg-chip variant="outline"><span>Outline</span></gg-chip>
      <gg-chip variant="solid"><span>Solid</span></gg-chip>
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
      <gg-button size="sm" variant="outline"><button id="restore">Restore removed</button></gg-button>
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
    <h2>Native form participation</h2>
    <form class="demo" id="demo-form">
      <gg-select id="form-select" name="framework" label="framework" placeholder="Required…"></gg-select>
      <gg-button type="submit"><button type="submit">Submit</button></gg-button>
      <gg-button variant="ghost" type="reset"><button type="reset">Reset</button></gg-button>
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
