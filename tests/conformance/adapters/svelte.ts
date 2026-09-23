import { createRawSnippet, flushSync, mount, unmount, type Component } from 'svelte'
import { Avatar, AvatarGroup, Badge, StatusDot, Timeline, Button, CodeBlock, Copyable, Inserts, Calendar, Cascader, Tree, Progress, Meter, Ring, Kanban, CommandPalette, Gantt, Checkbox, CheckboxGroup, ChipGroup, Combobox, DatePicker, Breadcrumbs, ChoiceCardGroup, DataGrid, FileDrop, Input, Menubar, Nav, NumberField, Pagination, RadioGroup, Rail, Search, SegmentedControl, Select, Skeleton, Slider, Spinner, Steps, Switch, Textarea, Toaster, Metric, FileChange } from '../../../packages/svelte/src/index'
import FieldWithControl from './FieldWithControl.svelte'
import GroupWithControl from './GroupWithControl.svelte'
import ToolbarWithTools from './ToolbarWithTools.svelte'
import GridWithTools from './GridWithTools.svelte'
import GridWithRows from './GridWithRows.svelte'
import ShellWith from './ShellWith.svelte'
import FlowWith from './FlowWith.svelte'
import PageHeaderWith from './PageHeaderWith.svelte'
import SectionWith from './SectionWith.svelte'
import SplitWith from './SplitWith.svelte'
import StatusBarWith from './StatusBarWith.svelte'
import DialogWithContent from './DialogWithContent.svelte'
import PopoverWithContent from './PopoverWithContent.svelte'
import TooltipWithTrigger from './TooltipWithTrigger.svelte'
import MenuWithTrigger from './MenuWithTrigger.svelte'
import TabsWithPanels from './TabsWithPanels.svelte'
import AccordionWithPanels from './AccordionWithPanels.svelte'
import FormWithFields from './FormWithFields.svelte'
import DisplayWithContent from './DisplayWithContent.svelte'
import CaretAfterText from './CaretAfterText.svelte'
import type { TimelineItem } from '../../../packages/core/src/components/timeline'
import DataDisplayWith from './DataDisplayWith.svelte'
import FieldsetWithGroup from './FieldsetWithGroup.svelte'
import { type Adapter, type ButtonProps, type CheckboxProps, type Mounted, track } from '../harness'
import { reactiveProps } from './svelte-props.svelte'

/**
 * Svelte 5: effects are batched onto a microtask, so every interaction and every
 * prop change ends with `flushSync()` — the Svelte equivalent of React's `act`.
 * Props are a `$state` object, so `Object.assign` on it IS a prop update.
 */

async function mountSvelte<P extends object>(
  component: Component<any>,
  props: P,
  target: HTMLElement,
  toComponentProps: (props: P) => object = (p) => p
): Promise<Mounted<P>> {
  const host = document.createElement('div')
  target.append(host)
  const reactive = reactiveProps({ ...toComponentProps(props) } as Record<string, unknown>)
  const instance = mount(component, { target: host, props: reactive })
  flushSync()

  return track({
    root: host,
    async update(patch) {
      Object.assign(reactive, toComponentProps(patch as P))
      flushSync()
    },
    async unmount() {
      await unmount(instance)
      host.remove()
    },
  })
}

// A label becomes a snippet, the Svelte 5 form of children.
const text = (label: string) =>
  createRawSnippet(() => ({ render: () => `<span>${label}</span>` }))

const withLabel = (p: Partial<CheckboxProps>) => {
  const { label, ...rest } = p
  return label === undefined ? rest : { ...rest, children: text(label) }
}

export const svelte: Adapter = {
  name: 'svelte',
  supports: { controlled: true, refusal: false, linkRoot: true },

  async act(interaction) {
    interaction()
    flushSync()
  },

  async wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms))
    flushSync()
  },

  button: (props, target) =>
    mountSvelte(Button as Component<any>, props, target, (p: Partial<ButtonProps>) => {
      const { label, ...rest } = p
      return label === undefined ? rest : { ...rest, children: text(label) }
    }),
  select: (props, target) => mountSvelte(Select as Component<any>, props, target),
  chipGroup: (props, target) => mountSvelte(ChipGroup as Component<any>, props, target),
  input: (props, target) => mountSvelte(Input as Component<any>, props, target),
  textarea: (props, target) => mountSvelte(Textarea as Component<any>, props, target),
  checkbox: (props, target) => mountSvelte(Checkbox as Component<any>, props, target, withLabel),
  switch: (props, target) => mountSvelte(Switch as Component<any>, props, target, withLabel),
  radioGroup: (props, target) => mountSvelte(RadioGroup as Component<any>, props, target),
  segmentedControl: (props, target) => mountSvelte(SegmentedControl as Component<any>, props, target),
  slider: (props, target) => mountSvelte(Slider as Component<any>, props, target),
  numberField: (props, target) => mountSvelte(NumberField as Component<any>, props, target),
  choiceCards: (props, target) => mountSvelte(ChoiceCardGroup as Component<any>, props, target),
  search: (props, target) => mountSvelte(Search as Component<any>, props, target),
  inputGroup: (props, target) => mountSvelte(GroupWithControl as Component<any>, props, target),
  fileDrop: (props, target) => mountSvelte(FileDrop as Component<any>, props, target),
  buttonGroup: (props, target) => mountSvelte(GroupWithControl as Component<any>, props, target, (p) => ({ ...p, group: 'buttons' })),
  breadcrumbs: (props, target) => mountSvelte(Breadcrumbs as Component<any>, props, target),
  gridRows: (props, target) => mountSvelte(GridWithRows as Component<any>, props, target),
  accordion: (props, target) => mountSvelte(AccordionWithPanels as Component<any>, props, target),
  tree: (props, target) => mountSvelte(Tree as Component<any>, props, target),
  form: (props, target) => mountSvelte(FormWithFields as Component<any>, props, target),
  gantt: (props, target) => mountSvelte(Gantt as Component<any>, props, target),
  codeBlock: (props, target) => mountSvelte(CodeBlock as Component<any>, props, target),
  copyable: (props, target) => mountSvelte(Copyable as Component<any>, props, target),
  inserts: (props, target) => mountSvelte(Inserts as Component<any>, props, target),
  metric: (props, target) => mountSvelte(Metric as Component<any>, props, target),
  // A row's children and a list's value snippet render components and markup, so a wrapper composes them.
  metricRow: (props, target) => mountSvelte(DataDisplayWith as Component<any>, props, target, (p) => ({ ...p, component: 'metric-row' })),
  keyValueList: (props, target) => mountSvelte(DataDisplayWith as Component<any>, props, target, (p) => ({ ...p, component: 'kv' })),
  fileChange: (props, target) => mountSvelte(FileChange as Component<any>, props, target),
  commandPalette: (props, target) => mountSvelte(CommandPalette as Component<any>, props, target),
  kanban: (props, target) => mountSvelte(Kanban as Component<any>, props, target),
  progress: (props, target) => mountSvelte(Progress as Component<any>, props, target),
  meter: (props, target) => mountSvelte(Meter as Component<any>, props, target),
  ring: (props, target) => mountSvelte(Ring as Component<any>, props, target),
  cascader: (props, target) => mountSvelte(Cascader as Component<any>, props, target),
  calendar: (props, target) => mountSvelte(Calendar as Component<any>, props, target),
  datePicker: (props, target) => mountSvelte(DatePicker as Component<any>, props, target),
  combobox: (props, target) => mountSvelte(Combobox as Component<any>, props, target),
  flow: (props, target) => mountSvelte(FlowWith as Component<any>, props, target),
  pageHeader: (props, target) => mountSvelte(PageHeaderWith as Component<any>, props, target),
  section: (props, target) => mountSvelte(SectionWith as Component<any>, props, target),
  shell: (props, target) => mountSvelte(ShellWith as Component<any>, props, target),
  split: (props, target) => mountSvelte(SplitWith as Component<any>, props, target),
  rail: (props, target) => mountSvelte(Rail as Component<any>, props, target),
  statusBar: (props, target) => mountSvelte(StatusBarWith as Component<any>, props, target),
  gridTools: (props, target) => mountSvelte(GridWithTools as Component<any>, props, target),
  dataGrid: (props, target) =>
    mountSvelte(DataGrid as Component<any>, props, target, (p) => ({ rowKey: (row: { id: unknown }) => row.id, ...p })),
  nav: (props, target) => mountSvelte(Nav as Component<any>, props, target),
  pagination: (props, target) => mountSvelte(Pagination as Component<any>, props, target),
  steps: (props, target) => mountSvelte(Steps as Component<any>, props, target),
  toolbar: (props, target) => mountSvelte(ToolbarWithTools as Component<any>, props, target),
  checkboxGroup: (props, target) => mountSvelte(CheckboxGroup as Component<any>, props, target),
  fieldset: (props, target) => mountSvelte(FieldsetWithGroup as Component<any>, props, target),
  // Snippets for the trigger, body and footer, as an app writes them.
  dialog: (props, target) => mountSvelte(DialogWithContent as Component<any>, props, target),
  popover: (props, target) => mountSvelte(PopoverWithContent as Component<any>, props, target),
  tooltip: (props, target) => mountSvelte(TooltipWithTrigger as Component<any>, props, target),
  menu: (props, target) => mountSvelte(MenuWithTrigger as Component<any>, props, target),
  menubar: (props, target) => mountSvelte(Menubar as Component<any>, props, target),
  tabs: (props, target) => mountSvelte(TabsWithPanels as Component<any>, props, target),
  toaster: (props, target) => mountSvelte(Toaster as Component<any>, props, target),
  badge: (props, target) =>
    mountSvelte(Badge as Component<any>, props, target, ({ label, ...rest }) => (label === undefined ? rest : { ...rest, children: text(label) })),
  // The rich body is a snippet that takes the item, as an app writes `{#snippet item(entry)}`.
  timeline: (props, target) =>
    mountSvelte(Timeline as Component<any>, props, target, ({ rich, ...rest }) => ({
      ...rest,
      item: rich ? createRawSnippet((item: () => TimelineItem) => ({ render: () => `<strong>${item().title}</strong>` })) : undefined,
    })),
  statusDot: (props, target) => mountSvelte(StatusDot as Component<any>, props, target),
  caret: (props, target) => mountSvelte(CaretAfterText as Component<any>, props, target),
  avatar: (props, target) => mountSvelte(Avatar as Component<any>, props, target),
  avatarGroup: (props, target) => mountSvelte(AvatarGroup as Component<any>, props, target),
  spinner: (props, target) => mountSvelte(Spinner as Component<any>, props, target),
  skeleton: (props, target) => mountSvelte(Skeleton as Component<any>, props, target),
  card: (props, target) => mountSvelte(DisplayWithContent as Component<any>, props, target, (p) => ({ ...p, component: 'card' })),
  panel: (props, target) => mountSvelte(DisplayWithContent as Component<any>, props, target, (p) => ({ ...p, component: 'panel' })),
  banner: (props, target) => mountSvelte(DisplayWithContent as Component<any>, props, target, (p) => ({ ...p, component: 'banner' })),
  note: (props, target) => mountSvelte(DisplayWithContent as Component<any>, props, target, (p) => ({ ...p, component: 'note' })),
  emptyState: (props, target) =>
    mountSvelte(DisplayWithContent as Component<any>, props, target, (p) => ({ ...p, component: 'empty-state' })),
  // A Field's children are a snippet, and a raw snippet cannot render a
  // component, so a two-line wrapper composes the pair as an app would.
  field: (props, target) => mountSvelte(FieldWithControl as Component<any>, props, target),
}
