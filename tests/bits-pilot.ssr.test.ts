import { expect, it } from 'vitest'
import { render } from 'svelte/server'
import Combobox from '../packages/svelte/src/components/combobox/Combobox.svelte'
import Select from '../packages/svelte/src/components/select/Select.svelte'
import OverlaysPilot from './fixtures/BitsOverlaysPilot.svelte'
import Pilot from './fixtures/BitsPilot.svelte'

it('renders the select value, label and named field without browser globals', () => {
  expect(typeof window).toBe('undefined')
  const { body } = render(Select, { props: { items: [{ value: 'a', label: 'Alpha' }], defaultValue: 'a', label: 'Stage', name: 'stage' } })
  expect(body).toContain('Alpha')
  expect(body).toContain('Stage')
  expect(body).toContain('name="stage"')
  expect(body).toContain('value="a"')
  expect(body).toContain('role="combobox"')
  expect(body).not.toContain('role="listbox"')
})
it('renders a closed dialog opener without browser globals or live overlay content', () => {
  const { body } = render(Pilot)
  expect(body).toContain('Open pilot')
  expect(body).toContain('aria-expanded="false"')
  expect(body).not.toContain('role="dialog"')
})

it('renders Combobox selected labels and public submission values on the server', () => {
  const { body } = render(Combobox, { props: { multiple: true, name: 'tags', defaultValue: ['a'], selectedItems: [{ value: 'a', label: 'Alpha' }] } })
  expect(body).toContain('Alpha')
  expect(body).toContain('name="tags"')
  expect(body).toContain('value="a"')
  expect(body).not.toContain('role="listbox"')
})

it('server-renders overlay triggers without mounting floating contents', () => {
  const { body } = render(OverlaysPilot)
  expect(body).toContain('Open overlays')
  expect(body).toContain('Outside help trigger')
  expect(body).not.toContain('role="tooltip"')
  expect(body).not.toContain('role="dialog"')
})
