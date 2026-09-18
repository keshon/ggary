import {
  connectDetail,
  rowMenuAnchor,
  rowMenuTarget,
  type DetailWords,
  type RowMenuTarget,
  type VirtualAnchor,
} from '@ggary/core/data-grid'
import { connect as connectMenu, createMenuMachine, type MenuEntry, type MenuEvent, type MenuState } from '@ggary/core/menu'
import { domNormalizer, uid, type Machine } from '@ggary/core'
import { h, spread } from '../../spread'
import { MenuRenderer } from '../menu/menu-renderer'
import type { GgSheetElement } from '../dialog/dialog.element'
import { GridTool } from './grid-tools.element'

/**
 * What opens from a row of a <gg-data-grid>, found by its id:
 *
 *   <gg-grid-menu for="leads"></gg-grid-menu>
 *   menu.items = (target) => [{ value: 'open', label: 'Open' }, …]
 *   menu.addEventListener('itemselect', (event) => event.detail.value, event.detail.target)
 *
 *   <gg-grid-detail for="leads"></gg-grid-detail>
 *   detail.heading = (lead) => lead.company
 *   detail.render = (lead, index) => fieldsFor(lead)
 */


/**
 * A row's context menu: a right click, Shift+F10 or the menu key on a row. It
 * stands at the pointer, or under the active cell for the keyboard, and gives
 * the focus back to the grid when it closes. Attribute: label. Property:
 * items (target) => entries. Event: itemselect ({ value, target, item, checked? }).
 */
export class GgGridMenuElement extends GridTool {
  items: (target: RowMenuTarget<unknown>) => MenuEntry[] = () => []

  #machine: Machine<MenuState, MenuEvent> | null = null
  #renderer: MenuRenderer | null = null
  #target: RowMenuTarget<unknown> | null = null
  #anchor: VirtualAnchor | null = null
  #seen = 0

  protected bound() {
    const grid = this.grid!
    this.#seen = grid.getSnapshot().grid.menu?.nonce ?? 0
    if (!this.#machine) {
      this.#machine = createMenuMachine({
        id: uid('gg-grid-menu'),
        items: [],
        onSelect: (value, details) => {
          if (!this.#target) return
          this.dispatchEvent(new CustomEvent('itemselect', { detail: { value, target: this.#target, ...details }, bubbles: true }))
        },
      })
      this.#renderer = new MenuRenderer(
        () => this.#machine!.getState(),
        () => this.grid?.element ?? null,
        { anchor: () => this.#anchor, dismissOnReference: true }
      )
      this.append(this.#renderer.content)
    }
    const stop = this.#machine.subscribe(() => this.#render())
    this.#render()
    const release = grid.provide('menu')
    return () => {
      stop()
      release()
      if (this.#machine?.getState().open) this.#machine.send({ type: 'CLOSE', reason: 'api' })
      this.#renderer?.destroy()
    }
  }

  protected update(): void {
    const grid = this.grid
    const machine = this.#machine
    if (!grid || !machine) return
    const snapshot = grid.getSnapshot()
    const nonce = snapshot.grid.menu?.nonce ?? 0
    if (nonce === this.#seen) return
    this.#seen = nonce
    const target = rowMenuTarget(snapshot, grid)
    if (!target) return
    this.#target = target
    this.#anchor = rowMenuAnchor(snapshot, grid)
    machine.send({ type: 'SYNC_ITEMS', items: this.items(target) })
    // The keyboard lands on the first item; a pointer, on the menu itself.
    machine.send({ type: 'OPEN', reason: 'api', focus: snapshot.grid.menu?.point ? 'none' : 'first' })
  }

  #render(): void {
    if (!this.#machine || !this.#renderer) return
    const api = connectMenu(this.#machine.getState(), this.#machine.send, domNormalizer, { label: this.getAttribute('label') ?? 'Row actions' })
    this.#renderer.render(api)
  }
}

/**
 * One row in a sheet beside the grid. It opens on Enter or a double click on a
 * row, walks to the previous and next rows without closing, and follows the
 * grid: arrow keys or a press on another row show that row. Non-modal, so the
 * grid stays usable beside it. Attributes: side, size, modal, loading-text.
 * Properties: heading (row) => string, description (row) => string,
 * render (row, index) => Node | string, renderFooter (row, index) => Node | string, words.
 */
export class GgGridDetailElement extends GridTool {
  heading: (row: any) => string = () => ''
  description: ((row: any) => string) | null = null
  render: (row: any, index: number) => Node | string = () => ''
  renderFooter: ((row: any, index: number) => Node | string) | null = null
  words: DetailWords = {}

  #sheet: GgSheetElement | null = null
  #body: HTMLDivElement | null = null
  #extra: HTMLDivElement | null = null
  #nav: {
    root: HTMLDivElement
    prev: HTMLButtonElement
    prevIcon: HTMLSpanElement
    position: HTMLSpanElement
    next: HTMLButtonElement
    nextIcon: HTMLSpanElement
  } | null = null
  #drawn: { index: number | null; row: unknown } = { index: null, row: undefined }

  protected bound() {
    if (!this.#sheet) this.#build()
    const release = this.grid!.provide('detail')
    const onChange = (event: Event) => {
      if (!(event as CustomEvent<{ open: boolean }>).detail.open) this.grid?.closeDetail()
    }
    this.#sheet!.addEventListener('openchange', onChange)
    return () => {
      this.#sheet?.removeEventListener('openchange', onChange)
      release()
    }
  }

  #build(): void {
    const sheet = document.createElement('gg-sheet') as GgSheetElement
    sheet.setAttribute('no-outside-close', '')
    if (!this.hasAttribute('modal')) sheet.setAttribute('non-modal', '')
    for (const name of ['side', 'size']) {
      const value = this.getAttribute(name)
      if (value) sheet.setAttribute(name, value)
    }
    this.#body = h('div')
    const footer = h('footer')
    const nav = { root: h('div'), prev: h('button'), prevIcon: h('span'), position: h('span'), next: h('button'), nextIcon: h('span') }
    nav.prev.append(nav.prevIcon)
    nav.next.append(nav.nextIcon)
    nav.root.append(nav.prev, nav.position, nav.next)
    this.#extra = h('div')
    this.#extra.style.display = 'contents'
    footer.append(nav.root, this.#extra)
    this.#nav = nav
    // The sheet takes its body and footer from its children when it connects.
    sheet.append(this.#body, footer)
    this.#sheet = sheet
    this.append(sheet)
  }

  protected update(): void {
    const grid = this.grid
    const sheet = this.#sheet
    const nav = this.#nav
    if (!grid || !sheet || !nav || !this.#body || !this.#extra) return
    const api = connectDetail(grid.getSnapshot(), grid, domNormalizer, this.words)
    spread(nav.root, api.navProps)
    spread(nav.prev, api.prevProps)
    spread(nav.next, api.nextProps)
    spread(nav.prevIcon, api.prevIconProps)
    spread(nav.nextIcon, api.nextIconProps)
    spread(nav.position, api.positionProps)
    if (nav.position.textContent !== api.positionText) nav.position.textContent = api.positionText

    const loading = this.getAttribute('loading-text') ?? 'Loading…'
    const heading = api.row === undefined ? loading : this.heading(api.row)
    if (sheet.getAttribute('heading') !== heading) sheet.setAttribute('heading', heading)
    const description = api.row !== undefined && this.description ? this.description(api.row) : null
    if (description) sheet.setAttribute('description', description)
    else sheet.removeAttribute('description')

    // The owner's content is drawn again only for another row, or the same row changed (an edit).
    if (api.index !== this.#drawn.index || api.row !== this.#drawn.row) {
      this.#drawn = { index: api.index, row: api.row }
      if (api.row === undefined || api.index === null) {
        const text = h('p')
        text.textContent = loading
        this.#body.replaceChildren(text)
        this.#extra.replaceChildren()
      } else {
        this.#body.replaceChildren(this.render(api.row, api.index))
        this.#extra.replaceChildren(this.renderFooter ? this.renderFooter(api.row, api.index) : '')
      }
    }
    if (sheet.open !== api.open) sheet.open = api.open
  }
}

const define = (name: string, element: CustomElementConstructor) => {
  if (!customElements.get(name)) customElements.define(name, element)
}
define('gg-grid-menu', GgGridMenuElement)
define('gg-grid-detail', GgGridDetailElement)

declare global {
  interface HTMLElementTagNameMap {
    'gg-grid-menu': GgGridMenuElement
    'gg-grid-detail': GgGridDetailElement
  }
}
