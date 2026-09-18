import {
  connectBulk,
  connectColumns,
  connectFilters,
  draftFor,
  filterKindOf,
  setOptions,
  type ColumnDef,
  type DataGridController,
  type Filter,
  type FilterDraft,
  type GridView,
} from '@ggary/core/data-grid'
import { domNormalizer } from '@ggary/core'
import type { GgSelectElement } from '../select/select.element'
import { h, spread } from '../../spread'

/**
 * The working surface around a <gg-data-grid>, found by its id:
 *
 *   <gg-grid-filters for="leads"></gg-grid-filters>
 *   <gg-grid-columns for="leads"></gg-grid-columns>
 *   <gg-grid-bulk for="leads"><gg-button><button>Assign</button></gg-button></gg-grid-bulk>
 *
 * Each is built from the kit's own elements — a popover, a field, a checkbox
 * group — and reads and writes the grid's controller; none holds state of its own.
 */

type Controller = DataGridController<unknown>

/** Find the grid by id, now or once it has its controller. */
abstract class GridTool extends HTMLElement {
  protected grid: Controller | null = null
  #stop: (() => void) | null = null
  #wait: (() => void) | null = null

  connectedCallback(): void {
    this.#bind()
  }

  disconnectedCallback(): void {
    this.#stop?.()
    this.#stop = null
    this.#wait?.()
    this.#wait = null
  }

  #bind(): void {
    const target = document.getElementById(this.getAttribute('for') ?? '') as (HTMLElement & { controller?: Controller | null }) | null
    if (!target) return
    if (!target.controller) {
      const onReady = () => this.#bind()
      target.addEventListener('gridready', onReady, { once: true })
      this.#wait = () => target.removeEventListener('gridready', onReady)
      return
    }
    this.grid = target.controller
    this.#stop = this.grid.subscribe(() => this.update())
    this.update()
  }

  protected abstract update(): void
}

const textOf = (element: Element, text: string) => {
  if (element.textContent !== text) element.textContent = text
  return element
}

const button = (label: string, emphasis: string, type: 'button' | 'submit' = 'button') => {
  const wrapper = document.createElement('gg-button')
  wrapper.setAttribute('emphasis', emphasis)
  wrapper.setAttribute('size', 'sm')
  const inner = h('button')
  inner.type = type
  inner.textContent = label
  wrapper.append(inner)
  return { wrapper, inner }
}

const field = (label: string, control: HTMLElement) => {
  const wrapper = document.createElement('gg-field')
  wrapper.setAttribute('label', label)
  wrapper.append(control)
  return wrapper
}

/**
 * An editor for one column's filter, read back from its own inputs on submit:
 * the native controls hold the draft, so there is nothing to keep in step.
 */
function buildEditor(
  api: ReturnType<typeof connectFilters<unknown, ReturnType<typeof domNormalizer>>>,
  columns: ColumnDef[],
  fixed: ColumnDef | undefined,
  filter: Filter | undefined,
  onApply: (column: ColumnDef, draft: FilterDraft) => void
): HTMLFormElement {
  const form = h('form') as HTMLFormElement
  spread(form, api.editorProps)
  const fields = h('div')
  spread(fields, api.editorFieldsProps)
  const actions = h('div')
  spread(actions, api.editorActionsProps)

  let column = fixed ?? columns[0]
  const body = h('div')
  body.style.display = 'contents'

  const drawFields = () => {
    const draft = draftFor(column, column.id === filter?.column ? filter : undefined)
    const parts: HTMLElement[] = []
    if (draft.kind === 'text') {
      const input = h('input')
      input.name = 'text'
      input.value = draft.text
      parts.push(field(`${column.header} contains`, input))
    } else if (draft.kind === 'set') {
      const group = document.createElement('gg-checkbox-group')
      group.setAttribute('label', column.header)
      for (const option of setOptions(column)) {
        const label = h('label')
        const box = h('input')
        box.type = 'checkbox'
        box.name = 'values'
        box.value = String(option.value)
        box.checked = draft.values.some((value) => String(value) === String(option.value))
        label.append(box, ` ${option.label}`)
        group.append(label)
      }
      parts.push(group)
    } else {
      const kind = draft.kind
      for (const [name, word] of [['start', 'from'], ['end', 'to']] as const) {
        const input = h('input')
        input.name = name
        if (kind === 'range') {
          input.type = 'number'
          const value = name === 'start' ? draft.min : draft.max
          if (value !== null) input.value = String(value)
          const number = document.createElement('gg-number-field')
          number.append(input)
          parts.push(field(`${column.header}, ${word}`, number))
        } else {
          input.type = 'date'
          input.value = name === 'start' ? draft.from : draft.to
          parts.push(field(`${column.header}, ${word}`, input))
        }
      }
    }
    body.replaceChildren(...parts)
  }

  if (!fixed) {
    const select = document.createElement('gg-select') as GgSelectElement
    select.setAttribute('label', 'Column')
    select.items = columns.map((candidate) => ({ value: candidate.id, label: candidate.header }))
    select.value = column.id
    select.addEventListener('valuechange', (event) => {
      const next = columns.find((candidate) => candidate.id === (event as CustomEvent).detail.value)
      if (next) {
        column = next
        drawFields()
      }
    })
    fields.append(select)
  }
  drawFields()
  fields.append(body)

  const read = (): FilterDraft => {
    const draft = draftFor(column)
    const data = new FormData(form)
    const kind = filterKindOf(column)
    if (kind === 'text') draft.text = String(data.get('text') ?? '')
    if (kind === 'set') {
      const picked = data.getAll('values').map(String)
      draft.values = setOptions(column).filter((option) => picked.includes(String(option.value))).map((option) => option.value)
    }
    if (kind === 'range') {
      const number = (key: string) => {
        const text = String(data.get(key) ?? '')
        return text === '' || !Number.isFinite(Number(text)) ? null : Number(text)
      }
      draft.min = number('start')
      draft.max = number('end')
    }
    if (kind === 'date') {
      draft.from = String(data.get('start') ?? '')
      draft.to = String(data.get('end') ?? '')
    }
    return draft
  }

  const clear = button('Clear', 'minimal')
  clear.inner.addEventListener('click', () => onApply(column, draftFor(column)))
  const submit = button('Apply', 'high', 'submit')
  actions.append(clear.wrapper, submit.wrapper)
  form.append(fields, actions)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    onApply(column, read())
  })
  return form
}

/**
 * Attributes: for (the grid's id). Property: views — [{ id, label, query }].
 * The chips are redrawn only when the filters change, never on a scroll.
 */
export class GgGridFiltersElement extends GridTool {
  #drawn = ''
  #views: GridView[] = []

  get views(): GridView[] {
    return this.#views
  }
  set views(next: GridView[]) {
    this.#views = next
    this.#drawn = ''
    this.update()
  }

  protected update(): void {
    const grid = this.grid
    if (!grid) return
    const snapshot = grid.getSnapshot()
    const signature = JSON.stringify([snapshot.grid.query.filters, snapshot.grid.query.search, this.#views.map((view) => view.id)])
    if (signature === this.#drawn) return
    this.#drawn = signature

    const api = connectFilters(snapshot, grid, domNormalizer, { locale: document.documentElement.lang || undefined })
    spread(this, api.rootProps, 'grid-filters')
    const parts: Node[] = []

    const apply = (column: ColumnDef, draft: FilterDraft) => {
      api.apply(column, draft)
      for (const popover of this.querySelectorAll<HTMLElement & { close?: () => void }>('gg-popover')) popover.close?.()
    }

    if (this.#views.length > 0) {
      const menu = document.createElement('gg-menu') as HTMLElement & { items: unknown }
      const trigger = button('Views', 'low')
      trigger.wrapper.slot = 'trigger'
      menu.append(trigger.wrapper)
      menu.items = this.#views.map((view) => ({ value: view.id, label: view.label }))
      menu.addEventListener('itemselect', (event) => {
        const view = this.#views.find((candidate) => candidate.id === (event as CustomEvent).detail.value)
        if (view) api.applyView(view)
      })
      parts.push(menu)
    }

    for (const chip of api.chips) {
      const root = h('span')
      spread(root, chip.rootProps)
      const popover = document.createElement('gg-popover')
      popover.setAttribute('heading', chip.name)
      popover.setAttribute('placement', 'bottom-start')
      const trigger = h('button')
      spread(trigger, chip.buttonProps)
      trigger.slot = 'trigger'
      const name = textOf(h('span'), chip.name)
      spread(name, chip.nameProps)
      const value = textOf(h('span'), chip.value)
      spread(value, chip.valueProps)
      trigger.append(name, value)
      popover.append(trigger, buildEditor(api, api.columns, chip.column, chip.filter, apply))
      const remove = h('button')
      spread(remove, chip.removeProps)
      const icon = h('span')
      spread(icon, chip.removeIconProps)
      remove.append(icon)
      root.append(popover, remove)
      parts.push(root)
    }

    const adder = document.createElement('gg-popover')
    adder.setAttribute('heading', 'Add a filter')
    adder.setAttribute('placement', 'bottom-start')
    const add = button('Add a filter', 'minimal')
    add.wrapper.slot = 'trigger'
    adder.append(add.wrapper, buildEditor(api, api.columns, undefined, undefined, apply))
    parts.push(adder)

    if (api.hasFilters) {
      const clear = button('Clear all', 'minimal')
      clear.inner.addEventListener('click', api.clear)
      parts.push(clear.wrapper)
    }
    this.replaceChildren(...parts)
  }
}

/** Attributes: for (the grid's id). */
export class GgGridColumnsElement extends GridTool {
  #drawn = ''

  protected update(): void {
    const grid = this.grid
    if (!grid) return
    const api = connectColumns(grid.getSnapshot(), grid, domNormalizer)
    const signature = JSON.stringify(api.items.map((item) => [item.value, item.label, item.disabled]).concat(api.value))
    if (signature === this.#drawn) return
    this.#drawn = signature

    const popover = document.createElement('gg-popover')
    popover.setAttribute('heading', 'Columns')
    popover.setAttribute('placement', 'bottom-end')
    const trigger = button('Columns', 'low')
    trigger.wrapper.slot = 'trigger'
    const root = h('div')
    spread(root, api.rootProps)
    const group = document.createElement('gg-checkbox-group')
    group.setAttribute('label', 'Columns')
    for (const item of api.items) {
      const label = h('label')
      const box = h('input')
      box.type = 'checkbox'
      box.value = item.value
      box.checked = api.value.includes(item.value)
      box.disabled = item.disabled
      label.append(box, ` ${item.label}`)
      group.append(label)
    }
    group.addEventListener('valuechange', (event) => api.setVisible((event as CustomEvent).detail.value))
    const reset = button('Reset columns', 'minimal')
    reset.inner.addEventListener('click', api.reset)
    spread(reset.wrapper, api.resetProps, 'grid-columns')
    root.append(group, reset.wrapper)
    popover.append(trigger.wrapper, root)
    // An open picker stays open: only its contents are replaced.
    const open = this.querySelector('gg-popover')?.hasAttribute('open')
    if (open) popover.setAttribute('open', '')
    this.replaceChildren(popover)
  }
}

/** Attributes: for (the grid's id). The actions are its children, shown while something is selected. */
export class GgGridBulkElement extends GridTool {
  #count: HTMLSpanElement | null = null
  #selectAll: HTMLButtonElement | null = null
  #clear: HTMLButtonElement | null = null
  #actions: HTMLDivElement | null = null

  protected update(): void {
    const grid = this.grid
    if (!grid) return
    if (!this.#actions) {
      this.#actions = h('div')
      this.#actions.append(...this.childNodes)
      this.#count = h('span')
      this.#selectAll = h('button')
      this.#clear = h('button')
      this.replaceChildren(this.#count, this.#selectAll, this.#clear, this.#actions)
    }
    const api = connectBulk(grid.getSnapshot(), grid, domNormalizer, { locale: document.documentElement.lang || undefined })
    this.hidden = !api.visible
    spread(this, api.rootProps, 'grid-bulk')
    spread(this.#count!, api.countProps)
    textOf(this.#count!, api.countText)
    spread(this.#selectAll!, api.selectAllProps)
    textOf(this.#selectAll!, api.selectAllText)
    this.#selectAll!.hidden = !api.offer
    spread(this.#clear!, api.clearProps)
    textOf(this.#clear!, api.clearText)
    spread(this.#actions, api.actionsProps)
  }

  /** What the selection is, for an action: keys, or the query and its exceptions. */
  get payload() {
    const grid = this.grid
    return grid ? connectBulk(grid.getSnapshot(), grid, domNormalizer).payload() : null
  }
}

for (const [name, element] of [
  ['gg-grid-filters', GgGridFiltersElement],
  ['gg-grid-columns', GgGridColumnsElement],
  ['gg-grid-bulk', GgGridBulkElement],
] as const) {
  if (!customElements.get(name)) customElements.define(name, element)
}

declare global {
  interface HTMLElementTagNameMap {
    'gg-grid-filters': GgGridFiltersElement
    'gg-grid-columns': GgGridColumnsElement
    'gg-grid-bulk': GgGridBulkElement
  }
}
