import ToastPilot from './fixtures/SvelteToastPilot.svelte'
import { createToaster as createNativeToaster } from '../packages/core/src/components/toast'
import ToolbarPilot from './fixtures/BitsToolbarPilot.svelte'
import RibbonPilot from './fixtures/BitsRibbonPilot.svelte'
import FormContractsPilot from './fixtures/SvelteFormContractsPilot.svelte'
import NumberField from '../packages/svelte/src/components/number-field/NumberField.svelte'
import ChipsPilot from './fixtures/BitsChipsPilot.svelte'
import NativeGroupsPilot from './fixtures/SvelteNativeGroupsPilot.svelte'
import NativeChoicesPilot from './fixtures/SvelteNativeChoicesPilot.svelte'
import SlidersPilot from './fixtures/BitsSlidersPilot.svelte'
import { expect, it } from 'vitest'
import { render } from 'svelte/server'
import Combobox from '../packages/svelte/src/components/combobox/Combobox.svelte'
import Select from '../packages/svelte/src/components/select/Select.svelte'
import OverlaysPilot from './fixtures/BitsOverlaysPilot.svelte'
import DisclosurePilot from './fixtures/BitsDisclosurePilot.svelte'
import CompositesPilot from './fixtures/BitsCompositesPilot.svelte'
import AnchoredMenu from '../packages/svelte/src/components/menu/AnchoredMenu.svelte'
import Kanban from '../packages/svelte/src/components/kanban/Kanban.svelte'
import { columns, tasks } from './conformance/board'
import DomainMenusPilot from './fixtures/BitsDomainMenusPilot.svelte'
import MenusPilot from './fixtures/BitsMenusPilot.svelte'
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

it('server-renders menus with usable triggers and no floating contents', () => {
  const { body } = render(MenusPilot)
  expect(body).toContain('Actions')
  expect(body).toContain('Context target')
  expect(body).toContain('role="menubar"')
  expect(body).not.toContain('role="menu"')
})

it('server-renders a closed domain menu Dialog without browser globals', () => {
  const { body } = render(DomainMenusPilot)
  expect(body).toContain('Open domain menus')
  expect(body).not.toContain('role="menu"')
})

it('server-renders Kanban cards and a closed anchored menu without DOM APIs', () => {
  const board = render(Kanban, { props: { columns, cards: tasks } }).body
  expect(board).toContain('Call Aigul')
  expect(board).not.toContain('role="menu"')
  const anchored = render(AnchoredMenu, { props: { id: 'row', open: false, items: [], anchor: null, reference: () => null, label: 'Row actions', onClose: () => {}, onSelect: () => {} } }).body
  expect(anchored).not.toContain('role="menu"')
})

it('server-renders composite triggers and an inline command palette without floating contents', () => {
  const { body } = render(CompositesPilot)
  expect(body).toContain('Open palette')
  expect(body).toContain('Inline commands')
  expect(body).toContain('Move card')
  expect(body).not.toContain('role="alertdialog"')
})

it('server-renders selected tabs and findable disclosure bodies', () => {
  const { body } = render(DisclosurePilot)
  expect(body).toContain('role="tablist"')
  expect(body).toContain('Empty document')
  expect(body).toContain('aria-selected="true"')
  expect(body).toContain('Empty section')
  expect(body).toContain('hidden="until-found"')
})

it('server renders slider values and accessible thumbs', () => {
 const { body } = render(SlidersPilot)
 expect(body).toContain('name="volume"')
 expect(body).toContain('value="40"')
 expect(body).toContain('role="slider"')
 expect(body).toContain('name="low"')
 expect(body).toContain('value="20"')
})

it('renders native Svelte choice controls and required validation on the server', () => {
 const { body } = render(NativeChoicesPilot)
 expect(body).toContain('type="checkbox"')
 expect(body).toContain('type="radio"')
 expect(body).toContain('role="switch"')
 expect(body).toContain('name="terms"')
 expect(body).toContain('required')
 expect(body).toContain('Accept terms')
})

it('server renders native option groups without DOM validation work', () => {
 const { body } = render(NativeGroupsPilot)
 expect(body).toContain('name="boxes"')
 expect(body).toContain('name="cards"')
 expect(body).toContain('name="view"')
 expect(body).toContain('type="radio"')
 expect(body).toContain('Card A')
})

it('server renders chip buttons and unencoded public submission values', () => {
 const { body } = render(ChipsPilot)
 expect(body).toContain('role="toolbar"')
 expect(body).toContain('aria-pressed="true"')
 expect(body).toContain('name="tags" value=""')
})

it('renders NumberField initial values in server HTML before effects run', () => {
 expect(render(NumberField, { props: { name: 'count', defaultValue: 4 } }).body).toContain('value="4"')
 expect(render(NumberField, { props: { name: 'count', value: 7 } }).body).toContain('value="7"')
 expect(render(NumberField, { props: { name: 'count', value: null } }).body).toContain('value=""')
})
it('server renders the form and its native constraints without browser globals', () => {
 const { body } = render(FormContractsPilot)
 expect(body).toContain('name="count"')
 expect(body).toContain('value="4"')
 expect(body).toContain('required')
 expect(body).toContain('Disabled controls')
})

it('server renders Ribbon tabs with an empty-key selected panel', () => {
 const { body } = render(RibbonPilot)
 expect(body).toContain('role="tablist"')
 expect(body).toContain('aria-selected="true"')
 expect(body).toContain('Draft Empty')
})

it('server renders managed toolbar semantics and keeps mixed groups ordinary', () => {
 const { body } = render(ToolbarPilot)
 expect(body).toContain('role="toolbar"')
 expect(body).toContain('aria-label="Actions"')
 expect(body).toContain('Mixed text')
 expect(body).toContain('Plain action')
})

it('server renders both toast announcers and persistent error content', () => {
 const toaster = createNativeToaster()
 toaster.toast({ title: 'Failed to save', tone: 'error' })
 const { body } = render(ToastPilot, { props: { toaster } })
 expect(body).toContain('aria-live="polite"')
 expect(body).toContain('aria-live="assertive"')
 expect(body).toContain('popover="manual"')
 expect(body).toContain('Failed to save')
})
