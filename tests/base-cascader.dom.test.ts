import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Cascader, type CascaderProps } from '../packages/react/src/components/cascader/Cascader'
import { Field } from '../packages/react/src/components/field/Field'
import { Fieldset } from '../packages/react/src/components/fieldset/Fieldset'
import { Form, FormSummary } from '../packages/react/src/components/form/Form'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 60))
const items = [{ value: 'team', label: 'Team', children: [{ value: 'alpha', label: 'Alpha' }, { value: 'beta', label: 'Beta' }, { value: 'blocked', label: 'Blocked', disabled: true }] }]
const trigger = () => document.querySelector<HTMLButtonElement>('[data-scope="cascader"][data-part="trigger"]')!
const option = (value: string) => document.querySelector<HTMLElement>(`[data-scope="cascader"][data-part="item"][data-value="${value}"]`)!
const open = () => act(async () => { trigger().focus(); trigger().click(); await settle() })
const choose = (value: string) => act(async () => { option(value).click(); await settle() })

afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); root = undefined; document.body.replaceChildren() })
async function mount(props: Partial<CascaderProps> = {}, fieldProps = {}, wrapped = true) {
  const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
  const render = async (next: Partial<CascaderProps> = {}, nextField = {}) => act(async () => {
    const child = h(Cascader, { items, ...props, ...next })
    root!.render(wrapped ? h(Field, { name: 'team', label: 'Assigned team', ...fieldProps, ...nextField, children: child }) : child)
    await settle()
  })
  await render()
  return { form, render }
}

describe('Cascader native form composition', () => {
  it('uses the Field label and submits the terminal value exactly once', async () => {
    const m = await mount({ defaultValue: ['team', 'alpha'] })
    expect(document.querySelector('label')!.htmlFor).toBe(trigger().id)
    expect(trigger().getAttribute('aria-labelledby')!.split(' ')[0]).toBe(document.querySelector('label')!.id)
    expect(new FormData(m.form).getAll('team')).toEqual(['alpha'])
    const constraint = m.form.querySelector<HTMLInputElement>('input[name="team"]')!
    expect(constraint.tabIndex).toBe(-1)
    await act(async () => constraint.focus())
    expect(document.activeElement).toBe(trigger())
  })
  it('opening and walking branches do not satisfy required or reveal errors prematurely', async () => {
    const m = await mount({}, { required: true, error: 'Choose a team' })
    await open(); await choose('team')
    expect(document.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(true)
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    expect(document.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(false)
    await choose('alpha')
    await act(async () => { await settle() })
    expect(m.form.checkValidity()).toBe(true)
    expect(new FormData(m.form).getAll('team')).toEqual(['alpha'])
    expect(document.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(true)
  })
  it.each([['team'], ['team', 'missing'], ['team', 'blocked']])('rejects ineligible accepted path %j', async (...path) => {
    const m = await mount({ value: path as string[] })
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    expect(m.form.querySelector<HTMLInputElement>('input[name="team"]')!.validationMessage).toBe('Choose an available option.')
  })
  it('selectParents accepts a branch and changing eligibility updates native validity', async () => {
    const m = await mount({ value: ['team'], selectParents: true })
    expect(m.form.checkValidity()).toBe(true)
    await m.render({ selectParents: undefined })
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    await m.render({ value: ['team', 'alpha'] })
    expect(m.form.checkValidity()).toBe(true)
    await m.render({ items: [{ value: 'team', label: 'Team', disabled: true, children: items[0].children }] })
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
  })
  it('disabled Field and Fieldset exclude canonical values and prevent opening', async () => {
    const m = await mount({ defaultValue: ['team', 'alpha'] }, { disabled: true })
    expect(trigger().disabled).toBe(true)
    expect(new FormData(m.form).has('team')).toBe(false)
    await act(async () => root!.render(h(Fieldset, { disabled: true, children: h(Cascader, { items, name: 'team', defaultValue: ['team', 'alpha'] }) })))
    expect(trigger().disabled).toBe(true)
    expect(new FormData(m.form).has('team')).toBe(false)
  })
  it('read-only browses branches with selectParents but rejects click and keyboard selection', async () => {
    const changed = vi.fn()
    const m = await mount({ defaultValue: ['team', 'alpha'], selectParents: true, onValueChange: changed }, { readOnly: true })
    await open(); await choose('team'); await choose('beta')
    await act(async () => { option('beta').focus(); option('beta').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); await settle() })
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(new FormData(m.form).getAll('team')).toEqual(['alpha'])
    expect(changed).not.toHaveBeenCalled()
  })
  it('reset closes the popup and restores the latest default without callbacks', async () => {
    const changed = vi.fn()
    const m = await mount({ defaultValue: ['team', 'alpha'], onValueChange: changed })
    await m.render({ defaultValue: ['team', 'beta'] })
    await open()
    await act(async () => { m.form.reset(); await settle() })
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(new FormData(m.form).getAll('team')).toEqual(['beta'])
    expect(changed).not.toHaveBeenCalled()
  })
  it('standalone required preserves its own name and controlled reset preserves owner value', async () => {
    const m = await mount({ name: 'place', label: 'Place', required: true, value: ['team', 'beta'], defaultValue: ['team', 'alpha'] }, {}, false)
    expect(new FormData(m.form).getAll('place')).toEqual(['beta'])
    await act(async () => { m.form.reset(); await settle() })
    expect(new FormData(m.form).getAll('place')).toEqual(['beta'])
    await m.render({ value: null })
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
  })
})

describe('Cascader GGary Form ownership', () => {
  it('required summary uses its Field message and focuses the visible trigger', async () => {
    const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
    const saved = vi.fn()
    await act(async () => root!.render(h(Form, { onSubmit: saved, children: [h(FormSummary, { key: 'summary' }),
      h(Field, { key: 'field', name: 'team', label: 'Team', required: true, error: 'Choose a team', children: h(Cascader, { items }) })] })))
    await act(async () => { host.querySelector('form')!.requestSubmit(); await settle() })
    await act(async () => { await settle() })
    const links = host.querySelectorAll<HTMLAnchorElement>('a')
    expect(links).toHaveLength(1)
    expect(links[0].textContent).toBe('Team: Choose a team')
    expect(links[0].hash).toBe(`#${trigger().id}`)
    await act(async () => links[0].click())
    expect(document.activeElement).toBe(trigger())
    expect(saved).not.toHaveBeenCalled()
  })
  it.each([false, true])('server errors clear only for accepted path changes (refusal: %s)', async refused => {
    const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
    await act(async () => root!.render(h(Form, { onSubmit: () => ({ errors: { team: 'Unavailable team' } }), children: [h(FormSummary, { key: 'summary' }),
      h(Field, { key: 'field', name: 'team', label: 'Team', children: h(Cascader, { items, ...(refused ? { value: ['team', 'alpha'] } : { defaultValue: ['team', 'alpha'] }) }) })] })))
    const form = host.querySelector('form')!
    await act(async () => { form.requestSubmit(); await settle() })
    await act(async () => { await settle() })
    expect(host.querySelectorAll('a')).toHaveLength(1)
    await open(); await choose('beta')
    await act(async () => { await settle() })
    expect(new FormData(form).getAll('team')).toEqual([refused ? 'alpha' : 'beta'])
    expect(host.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(!refused)
    expect(host.querySelectorAll('a')).toHaveLength(refused ? 1 : 0)
  })
})

describe('Cascader partial Field composition', () => {
  it('preserves its own label when Field only provides a hint', async () => {
    const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
    await act(async () => root!.render(h(Field, { hint: 'Choose a team', children: h(Cascader, { items, label: 'Team', name: 'team' }) })))
    expect(form.querySelector('label')!.htmlFor).toBe(trigger().id)
    expect(document.getElementById(trigger().getAttribute('aria-labelledby')!.split(' ')[0])!.textContent).toBe('Team')
  })
  it('owns server error metadata when the name belongs to the child of an unnamed Field', async () => {
    const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
    await act(async () => root!.render(h(Form, { onSubmit: () => ({ errors: { team: 'Unavailable team' } }), children: [h(FormSummary, { key: 'summary' }),
      h(Field, { key: 'field', label: 'Assigned team', hint: 'Pick a team', children: h(Cascader, { items, name: 'team', defaultValue: ['team', 'alpha'] }) })] })))
    await act(async () => { host.querySelector('form')!.requestSubmit(); await settle() })
    await act(async () => { await settle() })
    expect(trigger().getAttribute('aria-invalid')).toBe('true')
    const described = trigger().getAttribute('aria-describedby')!.split(' ').map(id => document.getElementById(id)?.textContent)
    expect(described).toContain('Unavailable team')
    expect(host.querySelector('a')!.textContent).toBe('Assigned team: Unavailable team')
  })
})
