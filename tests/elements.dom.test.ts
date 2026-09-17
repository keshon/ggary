import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChipItem } from '../packages/core/src/components/chip-group'
import type { SelectItem } from '../packages/core/src/components/select'
import type { GgChipGroupElement, GgSelectElement } from '../packages/elements/src/index'

/**
 * What only the custom elements have: a property API, DOM event names and
 * shapes, attribute fallbacks for server-rendered pages, and light-DOM
 * enhancement. The shared contract lives in tests/conformance and runs against
 * this adapter too; nothing here is repeated there.
 */

vi.mock('@ggary/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ggary/core')>()),
  attachPositioner: () => () => {},
}))

beforeAll(async () => {
  await import('../packages/elements/src/index')
})

beforeEach(() => {
  document.body.replaceChildren()
})

const selectItems: SelectItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
]

/** Detach and re-attach, as sorting a list or a drag-and-drop does. */
function moveElsewhere(el: Element) {
  const elsewhere = document.createElement('div')
  document.body.append(elsewhere)
  elsewhere.append(el)
}

const chipItems: ChipItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
]

describe('<gg-select>', () => {
  const mount = (html = '<gg-select></gg-select>') => {
    document.body.innerHTML = html
    return document.querySelector('gg-select') as GgSelectElement
  }

  it('exposes value as a property, readable and writable', () => {
    const el = mount()
    el.items = selectItems
    expect(el.value).toBeNull()
    el.value = 'b'
    expect(el.value).toBe('b')
    expect(el.querySelector('[data-part="trigger"]')!.textContent).toContain('Bravo')
  })

  it('dispatches a bubbling valuechange event with { value, item }', () => {
    const el = mount()
    el.items = selectItems
    const seen: unknown[] = []
    document.body.addEventListener('valuechange', (e) => seen.push((e as CustomEvent).detail))
    ;(el.querySelector('[data-part="trigger"]') as HTMLElement).click()
    ;(el.querySelectorAll('[data-part="item"]')[1] as HTMLElement).click()
    expect(seen).toEqual([{ value: 'b', item: selectItems[1] }])
  })

  it('reads items from a JSON attribute when no property was set — for server-rendered pages', () => {
    const el = mount(`<gg-select items='${JSON.stringify(selectItems)}' value="a"></gg-select>`)
    expect(el.querySelectorAll('[data-part="item"]')).toHaveLength(2)
    expect(el.value).toBe('a')
  })

  it('keeps working after being moved in the document, keeping its value and its DOM', () => {
    const el = mount()
    el.items = selectItems
    el.value = 'a'
    moveElsewhere(el)

    expect(el.querySelectorAll('[data-part="trigger"]')).toHaveLength(1)
    el.value = 'b'
    expect(el.querySelector('[data-part="trigger"]')!.textContent).toContain('Bravo')
    const trigger = el.querySelector('[data-part="trigger"]') as HTMLElement
    trigger.click()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('closes when taken out of the document, rather than coming back open', () => {
    const el = mount()
    el.items = selectItems
    const trigger = () => el.querySelector('[data-part="trigger"]') as HTMLElement
    trigger().click()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    moveElsewhere(el)
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })
})

describe('<gg-chip-group>', () => {
  const mount = () => {
    document.body.innerHTML = '<gg-chip-group removable></gg-chip-group>'
    const el = document.querySelector('gg-chip-group') as GgChipGroupElement
    el.items = chipItems
    return el
  }
  const chips = (el: Element) => [...el.querySelectorAll('[data-scope="chip"][data-part="root"]')] as HTMLElement[]

  it('exposes selection as a property, readable and writable', () => {
    const el = mount()
    el.selection = ['code']
    expect(el.selection).toEqual(['code'])
    expect(chips(el)[1].getAttribute('aria-pressed')).toBe('true')
  })

  it('dispatches bubbling selectionchange and chipremove events', () => {
    const el = mount()
    const events: [string, unknown][] = []
    for (const type of ['selectionchange', 'chipremove']) {
      document.body.addEventListener(type, (e) => events.push([type, (e as CustomEvent).detail]))
    }
    chips(el)[0].click()
    ;(chips(el)[1].querySelector('[data-part="remove"]') as HTMLElement).click()
    expect(events).toEqual([
      ['selectionchange', { selection: ['design'], items: [chipItems[0]] }],
      ['chipremove', { value: 'code', item: chipItems[1] }],
    ])
  })

  it('keeps working after being moved in the document, keeping its selection and its DOM', () => {
    const el = mount()
    el.selection = ['design']
    moveElsewhere(el)

    expect(el.querySelectorAll('[role="toolbar"], [data-part="list"]').length).toBeGreaterThan(0)
    expect(chips(el)).toHaveLength(2)
    chips(el)[1].click()
    expect(el.selection).toEqual(['design', 'code'])
    expect(chips(el)[1].getAttribute('aria-pressed')).toBe('true')
  })
})

describe('light-DOM enhancement', () => {
  it('<gg-button> decorates the button it was given rather than replacing it', () => {
    document.body.innerHTML = '<gg-button emphasis="high"><button id="server-rendered">Save</button></gg-button>'
    const button = document.getElementById('server-rendered')!
    expect(button.dataset.scope).toBe('button')
    expect(button.dataset.emphasis).toBe('high')
    expect(button.textContent).toBe('Save')
  })

  it('<gg-chip removable> appends a dismiss target with a glyph part and dispatches remove', () => {
    document.body.innerHTML = '<gg-chip removable><span>Tag</span></gg-chip>'
    const chip = document.querySelector('gg-chip')!
    const remove = chip.querySelector('[data-part="remove"]') as HTMLElement
    expect(remove.querySelector('[data-part="remove-icon"][data-icon="close"]')).toBeTruthy()

    const removed = vi.fn()
    document.body.addEventListener('remove', removed)
    remove.click()
    expect(removed).toHaveBeenCalledTimes(1)
  })

  it('<gg-chip> with a <span> is not interactive: no aria-pressed, no tab stop', () => {
    document.body.innerHTML = '<gg-chip><span>Tag</span></gg-chip>'
    const chip = document.querySelector('gg-chip')!
    expect(chip.hasAttribute('aria-pressed')).toBe(false)
    expect(chip.hasAttribute('tabindex')).toBe(false)
  })
})

describe('<gg-field>, <gg-input> and <gg-textarea>', () => {
  const mount = (html: string) => {
    document.body.innerHTML = `<form>${html}</form>`
    return document.querySelector('gg-field, gg-input, gg-textarea') as HTMLElement
  }
  const control = <T extends Element = HTMLInputElement>() => document.querySelector('input, textarea, select') as unknown as T

  it('<gg-field> reads required from the control’s own markup, and marks the label', () => {
    mount('<gg-field label="Email"><input type="email" required></gg-field>')
    expect(control().required).toBe(true)
    expect(document.querySelector('[data-part="label"]')!.hasAttribute('data-required')).toBe(true)
  })

  it('a flag set on the field can be removed again, while one from the markup stays', () => {
    const field = mount('<gg-field label="Name" disabled><input readonly></gg-field>')
    expect(control().disabled).toBe(true)
    field.removeAttribute('disabled')
    expect(control().disabled).toBe(false)
    expect(control().readOnly).toBe(true)
  })

  it('<gg-input> stands down inside a field; the field applies the input contract with its size', () => {
    mount('<gg-field label="Code"><gg-input size="sm"><input></gg-input></gg-field>')
    const input = control()
    expect(input.dataset.scope).toBe('input')
    expect(input.dataset.size).toBe('sm')
    expect((document.querySelector('label') as HTMLLabelElement).htmlFor).toBe(input.id)
  })

  it('wraps a textarea with its own contract, and a select as a plain control: labelled, validated', () => {
    mount('<gg-field label="Notes" hint="Optional"><textarea></textarea></gg-field>')
    const textarea = control<HTMLTextAreaElement>()
    expect((document.querySelector('label') as HTMLLabelElement).htmlFor).toBe(textarea.id)
    expect(textarea.getAttribute('aria-describedby')).toBe(document.querySelector('[data-part="hint"]')!.id)
    expect(textarea.dataset.scope).toBe('textarea')

    mount('<gg-field label="Plan" error="Pick a plan"><select required><option value=""></option><option>Pro</option></select></gg-field>')
    const select = control<HTMLSelectElement>()
    select.dispatchEvent(new Event('blur'))
    expect(select.getAttribute('aria-invalid')).toBe('true')
    expect(document.querySelector('[data-part="error"]')!.textContent).toBe('Pick a plan')
  })

  it('shows the error on a submit attempt: the form’s invalid event reaches the field', () => {
    mount('<gg-field label="Email" error="Required"><input required></gg-field>')
    ;(document.querySelector('form') as HTMLFormElement).requestSubmit()
    expect(control().getAttribute('aria-invalid')).toBe('true')
    expect((document.querySelector('[data-part="error"]') as HTMLElement).hidden).toBe(false)
  })

  it('adopts an id the page gave it, and derives the part ids from it', () => {
    mount('<gg-field id="username" label="Username"><input></gg-field>')
    expect(document.getElementById('username')!.tagName).toBe('GG-FIELD')
    expect(control().id).toBe('username-control')
  })

  it('re-renders when a wrapper inside it changes its attributes', () => {
    mount('<gg-field label="Notes"><gg-textarea size="sm"><textarea></textarea></gg-textarea></gg-field>')
    const wrapper = document.querySelector('gg-textarea')!
    expect(control<HTMLTextAreaElement>().dataset.size).toBe('sm')
    wrapper.setAttribute('size', 'lg')
    wrapper.setAttribute('autoresize', '')
    expect(control<HTMLTextAreaElement>().dataset.size).toBe('lg')
    expect(control<HTMLTextAreaElement>().dataset.resize).toBe('none')
  })

  it('keeps working after being moved in the document', () => {
    const field = mount('<gg-field label="Email" error="Required"><input required></gg-field>')
    moveElsewhere(field)
    control().dispatchEvent(new Event('blur'))
    expect(control().getAttribute('aria-invalid')).toBe('true')
    expect(document.querySelectorAll('gg-field label')).toHaveLength(1)
  })

  it('<gg-textarea> re-measures on demand, for values set from code', () => {
    const host = mount('<gg-textarea autoresize><textarea></textarea></gg-textarea>') as HTMLElement & { measure(): void }
    const textarea = control<HTMLTextAreaElement>()
    textarea.style.removeProperty('height')
    host.measure()
    expect(textarea.style.height).not.toBe('')
  })

  it('without a label attribute, renders no visible label', () => {
    mount('<gg-field><input aria-label="Search"></gg-field>')
    expect((document.querySelector('label') as HTMLElement).hidden).toBe(true)
  })

  it('<gg-input> alone keeps native attributes and toggles invalid', () => {
    const host = mount('<gg-input><input type="search" required placeholder="Find"></gg-input>')
    expect(control().type).toBe('search')
    expect(control().required).toBe(true)
    expect(control().placeholder).toBe('Find')
    host.setAttribute('invalid', '')
    expect(control().getAttribute('aria-invalid')).toBe('true')
    host.removeAttribute('invalid')
    expect(control().hasAttribute('aria-invalid')).toBe(false)
  })
})
