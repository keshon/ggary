import {
  connect,
  createArraySource,
  createDataGrid,
  type CellEdit,
  type CellEditor,
  type ColumnDef,
  type DataGridController,
  type GridQuery,
  type GridSource,
  type RowKey,
} from '@ggary/core/data-grid'
import { domNormalizer, uid, type DomProps } from '@ggary/core'
import { h, reconcileChildren, spread } from '../../spread'

type Cell = { element: HTMLDivElement; box: HTMLInputElement | null; placeholder: HTMLSpanElement | null }
type Line = { element: HTMLDivElement; cells: Cell[] }

/**
 * A data grid is data, not markup: columns and rows arrive as properties.
 *
 *   const grid = document.querySelector('gg-data-grid')
 *   grid.columns = [{ id: 'name', header: 'Name' }, { id: 'sum', header: 'Sum', type: 'money' }]
 *   grid.rowKey = (row) => row.id
 *   grid.rows = leads            // or grid.source = { load(request, signal) { … } }
 *
 * Attributes: label, selectable, locale (else the page's lang). Properties: columns, rows, source, rowKey,
 * renderCell (row, column, text) => Node | string, initialQuery, controller, onCellEdit (edit) => Promise,
 * saveFailedText (column, message) => string.
 * Events: gridready, querychange { query }, selectionchange { selection }, rowactivate { row, index }.
 *
 * Rows are drawn from a pool that is reused as they scroll: the elements stay,
 * their contents change, so scrolling 700k rows creates no new nodes.
 */
export class GgDataGridElement<Row = any> extends HTMLElement {
  static observedAttributes = ['label', 'selectable', 'locale']

  #columns: ColumnDef<Row>[] = []
  #rows: readonly Row[] | undefined
  #source: GridSource<Row> | undefined
  #rowKey: (row: Row) => RowKey = (row) => (row as { id: RowKey }).id
  #renderCell: ((row: Row, column: ColumnDef<Row>, text: string) => Node | string) | null = null
  #initialQuery: Partial<GridQuery> | undefined
  #onCellEdit: ((edit: CellEdit<Row>) => Promise<Row | void> | Row | void) | undefined
  #saveFailedText: ((column: string, message: string) => string) | undefined
  /** The row being edited has a line of its own, so recycling the pool never moves its editor. */
  #editLine: Line | null = null
  #editor: { session: string; kind: string; field: HTMLInputElement | HTMLSelectElement; error: HTMLSpanElement; fresh: boolean } | null = null
  #controller: DataGridController<Row> | null = null
  #stopAttach: (() => void) | null = null
  #stopSubscribe: (() => void) | null = null
  #id = uid('gg-grid')

  #grid: HTMLDivElement | null = null
  #header: HTMLDivElement | null = null
  #body: HTMLDivElement | null = null
  #overlay: HTMLDivElement | null = null
  #status: HTMLDivElement | null = null
  #headerCells: HTMLDivElement[] = []
  #pool: Line[] = []

  get columns() {
    return this.#columns
  }
  set columns(next: ColumnDef<Row>[]) {
    this.#columns = next
    this.#sync()
  }
  get rows() {
    return this.#rows
  }
  set rows(next: readonly Row[] | undefined) {
    this.#rows = next
    this.#sync()
  }
  get source() {
    return this.#source
  }
  set source(next: GridSource<Row> | undefined) {
    this.#source = next
    this.#sync()
  }
  get rowKey() {
    return this.#rowKey
  }
  set rowKey(next: (row: Row) => RowKey) {
    this.#rowKey = next
    this.#controller?.update({ rowKey: next })
  }
  get renderCell() {
    return this.#renderCell
  }
  set renderCell(next: ((row: Row, column: ColumnDef<Row>, text: string) => Node | string) | null) {
    this.#renderCell = next
    this.#render()
  }
  set initialQuery(next: Partial<GridQuery> | undefined) {
    this.#initialQuery = next
  }
  /** Saves an edited cell; a rejection puts the old value back. Columns opt in with `editable`. */
  get onCellEdit() {
    return this.#onCellEdit
  }
  set onCellEdit(next: ((edit: CellEdit<Row>) => Promise<Row | void> | Row | void) | undefined) {
    this.#onCellEdit = next
  }
  set saveFailedText(next: ((column: string, message: string) => string) | undefined) {
    this.#saveFailedText = next
    this.#render()
  }
  /** For bulk actions, a filter bar, a refresh after a save. */
  get controller(): DataGridController<Row> | null {
    return this.#controller
  }

  connectedCallback(): void {
    this.#sync()
  }

  disconnectedCallback(): void {
    this.#stopAttach?.()
    this.#stopAttach = null
  }

  attributeChangedCallback(): void {
    this.#render()
  }

  #currentSource(): GridSource<Row> | undefined {
    return this.#source ?? (this.#rows ? createArraySource(this.#rows, this.#columns, { locale: this.#locale }) : undefined)
  }

  get #locale(): string | undefined {
    return this.getAttribute('locale') || document.documentElement.lang || undefined
  }

  #sync(): void {
    if (!this.isConnected || this.#columns.length === 0) return
    const source = this.#currentSource()
    if (!source) return
    if (!this.#controller) {
      this.#controller = createDataGrid<Row>({
        columns: this.#columns,
        source,
        rowKey: this.#rowKey,
        selectable: this.hasAttribute('selectable'),
        query: this.#initialQuery,
        onQueryChange: (query) => this.dispatchEvent(new CustomEvent('querychange', { detail: { query }, bubbles: true })),
        onSelectionChange: (selection) => this.dispatchEvent(new CustomEvent('selectionchange', { detail: { selection }, bubbles: true })),
        onRowActivate: (row, index) => this.dispatchEvent(new CustomEvent('rowactivate', { detail: { row, index }, bubbles: true })),
        onCellEdit: (edit) => this.#onCellEdit?.(edit),
      })
      this.#build()
      this.#stopSubscribe = this.#controller.subscribe(() => this.#render())
      // The filter bar, the column picker and the bulk bar wait for this.
      queueMicrotask(() => this.dispatchEvent(new CustomEvent('gridready', { bubbles: true })))
    } else {
      this.#controller.update({ columns: this.#columns, source })
    }
    if (!this.#stopAttach && this.#grid) this.#stopAttach = this.#controller.attach(this.#grid)
    this.#render()
  }

  #build(): void {
    this.#grid = h('div')
    this.#header = h('div')
    this.#body = h('div')
    this.#overlay = h('div')
    this.#status = h('div')
    this.#grid.append(this.#header, this.#body)
    this.replaceChildren(this.#grid, this.#status)
  }

  #render(): void {
    const controller = this.#controller
    if (!controller || !this.#grid || !this.#header || !this.#body || !this.#overlay || !this.#status) return
    const api = connect(controller.getSnapshot(), controller, domNormalizer, {
      id: this.#id,
      label: this.getAttribute('label') ?? '',
      locale: this.#locale,
      saveFailedText: this.#saveFailedText,
    })

    spread(this, api.frameProps, 'data-grid')
    spread(this.#grid, api.rootProps)
    spread(this.#header, api.headerProps)
    spread(this.#body, api.bodyProps)

    // The header: one cell per column, rebuilt only when the columns change.
    while (this.#headerCells.length < api.headerCells.length) this.#headerCells.push(h('div'))
    this.#headerCells.length = api.headerCells.length
    api.headerCells.forEach((header, i) => {
      const element = this.#headerCells[i]
      spread(element, header.props)
      const signature = `${header.key}|${header.isSelect}|${header.label}|${header.sortable}`
      if (element.dataset.built !== signature) {
        if (header.isSelect) element.replaceChildren(h('input'))
        else {
          const text = h('span')
          text.textContent = header.label
          element.replaceChildren(text, ...(header.sortable ? [h('span')] : []), h('span'))
        }
        element.dataset.built = signature
      }
      if (header.isSelect) {
        const box = element.firstElementChild as HTMLInputElement
        spread(box, header.checkboxProps)
        box.checked = api.allSelected
        box.indeterminate = header.indeterminate
      } else {
        const [text, ...rest] = [...element.children] as HTMLElement[]
        spread(text, header.labelProps)
        if (header.sortable) spread(rest[0], header.sortProps)
        spread(rest[rest.length - 1], header.resizeProps)
      }
    })
    if (this.#header.childElementCount !== this.#headerCells.length || [...this.#header.children].some((c, i) => c !== this.#headerCells[i])) {
      this.#header.replaceChildren(...this.#headerCells)
    }

    // The body: a pool of rows, reused as the window moves. The row being
    // edited keeps a line of its own, last in the body, so it is never moved:
    // moving the focused editor would blur it, and a blur saves.
    const editingRow = controller.getSnapshot().grid.editing?.row
    if (editingRow === undefined) {
      this.#editLine = null
      this.#editor = null
    } else {
      this.#editLine ??= { element: h('div'), cells: [] }
    }
    const pooledCount = api.rows.filter((line) => line.index !== editingRow).length
    while (this.#pool.length < pooledCount) this.#pool.push({ element: h('div'), cells: [] })
    let next = 0
    const lines = api.rows.map((line) => (line.index === editingRow ? this.#editLine! : this.#pool[next++]))
    api.rows.forEach((line, i) => {
      const pooled = lines[i]
      spread(pooled.element, line.props)
      while (pooled.cells.length < line.cells.length) pooled.cells.push({ element: h('div'), box: null, placeholder: null })
      pooled.cells.length = line.cells.length
      line.cells.forEach((cell, c) => {
        const slot = pooled.cells[c]
        spread(slot.element, cell.props)
        if (cell.isSelect) {
          slot.box ??= h('input')
          spread(slot.box, cell.checkboxProps)
          slot.box.checked = cell.checkboxProps.attrs['data-state'] === 'checked'
          if (slot.element.firstChild !== slot.box || slot.element.childNodes.length !== 1) slot.element.replaceChildren(slot.box)
        } else if (line.row === undefined) {
          slot.placeholder ??= h('span')
          spread(slot.placeholder, api.placeholderProps)
          if (slot.element.firstChild !== slot.placeholder) slot.element.replaceChildren(slot.placeholder)
        } else if (cell.editor) {
          this.#placeEditor(slot.element, cell.editor, line.index + ':' + c)
        } else if (this.#renderCell && cell.def) {
          const content = this.#renderCell(line.row, cell.def as ColumnDef<Row>, cell.text)
          slot.element.replaceChildren(content)
        } else if (slot.element.childNodes.length !== 1 || slot.element.firstChild?.nodeType !== Node.TEXT_NODE || slot.element.textContent !== cell.text) {
          slot.element.textContent = cell.text
        }
      })
      if (pooled.element.childElementCount !== pooled.cells.length || [...pooled.element.children].some((child, c) => child !== pooled.cells[c].element)) {
        reconcileChildren(pooled.element, pooled.cells.map((slot) => slot.element))
      }
    })
    const wanted = lines.filter((line) => line !== this.#editLine).map((line) => line.element)
    if (this.#editLine && lines.includes(this.#editLine)) wanted.push(this.#editLine.element)
    if (this.#body.childElementCount !== wanted.length || [...this.#body.children].some((child, i) => child !== wanted[i])) {
      reconcileChildren(this.#body, wanted)
    }
    this.#focusEditor()

    spread(this.#overlay, api.overlayProps)
    if (api.overlay) {
      const message = h('p')
      message.textContent = api.overlay === 'error' ? api.errorText : api.emptyText
      const parts: Node[] = [message]
      if (api.overlay === 'error') {
        const retry = h('button')
        retry.type = 'button'
        retry.textContent = 'Try again'
        retry.addEventListener('click', api.retry)
        parts.push(retry)
      }
      this.#overlay.replaceChildren(...parts)
      if (!this.#overlay.isConnected) this.#grid.after(this.#overlay)
    } else if (this.#overlay.isConnected) {
      this.#overlay.remove()
    }

    spread(this.#status, api.statusProps)
    if (this.#status.textContent !== api.statusText) this.#status.textContent = api.statusText
  }

  /** The editor of the cell being edited: one field per edit, kept as long as the edit lasts. */
  #placeEditor(cell: HTMLElement, editor: CellEditor<DomProps>, session: string): void {
    let current = this.#editor
    if (!current || current.session !== session || current.kind !== editor.kind) {
      const field = editor.kind === 'select' ? h('select') : h('input')
      if (field instanceof HTMLSelectElement) {
        for (const option of editor.options) {
          const element = h('option')
          element.value = option.value
          element.textContent = option.label
          field.append(element)
        }
      }
      current = this.#editor = { session, kind: editor.kind, field, error: h('span'), fresh: true }
    }
    const { field, error } = current
    spread(field, editor.inputProps)
    const draft = editor.inputProps.attrs.value ?? ''
    if (field.value !== draft) field.value = draft
    spread(error, editor.errorProps)
    if (error.textContent !== (editor.error ?? '')) error.textContent = editor.error ?? ''
    for (const node of [...cell.childNodes]) if (node.nodeType !== Node.ELEMENT_NODE) node.remove()
    reconcileChildren(cell, editor.error ? [field, error] : [field])
  }

  /** A new editor takes the focus once its row is in the page: focusing a detached field does nothing. */
  #focusEditor(): void {
    const current = this.#editor
    if (!current?.fresh || !current.field.isConnected) return
    current.fresh = false
    const { field } = current
    field.focus({ preventScroll: true })
    if (field instanceof HTMLInputElement && field.type === 'text') field.setSelectionRange(field.value.length, field.value.length)
  }
}

if (!customElements.get('gg-data-grid')) customElements.define('gg-data-grid', GgDataGridElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-data-grid': GgDataGridElement
  }
}
