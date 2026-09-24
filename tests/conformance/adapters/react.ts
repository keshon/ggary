import { Fragment, act, createElement, useState, type ComponentType, type ReactNode } from 'react'
import type { DataGridController } from '../../../packages/core/src/components/data-grid'
import { createRoot } from 'react-dom/client'
import {
  Button,
  CodeBlock,
  Copyable,
  Inserts,
  Checkbox,
  CheckboxGroup,
  ChipGroup,
  Dialog,
  Popover,
  Sheet,
  Tooltip,
  Field,
  Fieldset,
  Input,
  Menu,
  Menubar,
  Breadcrumbs,
  ButtonGroup,
  DataGrid,
  GridBulkBar,
  GridColumns,
  GridDetail,
  GridFilters,
  GridRowMenu,
  Calendar,
  Cascader,
  Accordion,
  Tree,
  Progress,
  Meter,
  Ring,
  Kanban,
  CommandPalette,
  Form,
  FormSummary,
  Gantt,
  Metric,
  MetricRow,
  Share,
  Heatmap,
  Run,
  Queue,
  History,
  Budget,
  Step,
  Log,
  Diff,
  Lanes,
  KeyValueList,
  FileChange,
  DatePicker,
  Combobox,
  Cluster,
  ClusterSpacer,
  Container,
  Grid,
  PageHeader,
  Section,
  Stack,
  Rail,
  Shell,
  Split,
  StatusBar,
  StatusBarItem,
  StatusBarSpacer,
  ChoiceCardGroup,
  FileDrop,
  InputGroup,
  Nav,
  NumberField,
  Pagination,
  RadioGroup,
  Search,
  SegmentedControl,
  Select,
  Slider,
  Steps,
  Switch,
  Tabs,
  Toaster,
  Avatar,
  Banner,
  Card,
  EmptyState,
  Note,
  Divider,
  Text,
  Link,
  Prose,
  Panel,
  AvatarGroup,
  Badge,
  Sparkline,
  Legend,
  Caret,
  StatusDot,
  Timeline,
  Skeleton,
  Spinner,
  Textarea,
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  Turn,
  Composer,
  Thinking,
  Approval,
  Failure,
} from '../../../packages/react/src/index'
import {
  type Adapter,
  type ButtonGroupProps,
  type GridRowsProps,
  type FlowProps,
  type PageHeaderProps,
  type SectionProps,
  type ShellProps,
  type SplitProps,
  type StatusBarProps,
  type GridToolsProps,
  type ToolbarProps,
  type ButtonProps,
  type InputGroupProps,
  type CheckboxProps,
  type DialogProps,
  type FieldProps,
  type FieldsetProps,
  type MenuProps,
  type Mounted,
  type PopoverProps,
  type TooltipProps,
  type TabsProps,
  type MetricRowProps,
  type KeyValueListProps,
  type TurnProps,
  type ComposerProps,
  type ThinkingProps,
  type ApprovalProps,
  type FailureProps,
  track,
} from '../harness'

/**
 * React: every render and every interaction goes through `act`, which flushes
 * state updates AND effects before returning. Without it the layout effect that
 * moves roving focus, and the effects that sync props into the machine, would
 * still be pending when the spec asserts.
 */
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function mount<P extends object>(
  component: ComponentType<any>,
  props: P,
  target: HTMLElement,
  toElementProps: (props: P) => [object, ...ReactNode[]] = (p) => [p]
): Promise<Mounted<P>> {
  const host = document.createElement('div')
  target.append(host)
  const root = createRoot(host)
  let current = props

  const render = () => {
    const [elementProps, ...children] = toElementProps(current)
    root.render(createElement(component, elementProps, ...children))
  }
  await act(async () => render())

  return track({
    root: host,
    async update(patch) {
      current = { ...current, ...patch }
      await act(async () => render())
    },
    async unmount() {
      await act(async () => root.unmount())
      host.remove()
    },
  })
}

/** The grid and its tools, sharing one controller the way a page would. */
function ReactGridWithTools(props: GridToolsProps) {
  const [grid, setGrid] = useState<DataGridController<any>>()
  const words = { locale: props.locale }
  return createElement(
    Fragment,
    null,
    grid ? createElement(GridFilters, { grid, views: props.views, words }) : null,
    grid ? createElement(GridColumns, { grid }) : null,
    grid ? createElement(GridBulkBar, { grid, words }, createElement('button', { type: 'button' }, 'Assign')) : null,
    createElement(DataGrid as ComponentType<any>, {
      columns: props.columns,
      rows: props.rows,
      rowKey: (row: { id: number }) => row.id,
      label: 'Leads',
      selectable: true,
      locale: props.locale,
      controllerRef: setGrid,
    })
  )
}

/** The grid with a row menu and a detail sheet, sharing one controller. */
function ReactGridWithRows(props: GridRowsProps) {
  const [grid, setGrid] = useState<DataGridController<any>>()
  return createElement(
    Fragment,
    null,
    createElement(DataGrid as ComponentType<any>, {
      columns: props.columns,
      rows: props.rows,
      rowKey: (row: { id: number }) => row.id,
      label: 'Leads',
      locale: props.locale,
      onCellEdit: props.onCellEdit,
      controllerRef: setGrid,
    }),
    grid ? createElement(GridRowMenu as ComponentType<any>, { grid, items: props.menuItems, onSelect: props.onMenuSelect }) : null,
    grid
      ? createElement(GridDetail as ComponentType<any>, {
          grid,
          title: props.detailTitle,
          children: (row: unknown) => createElement('p', null, props.detailBody(row)),
        })
      : null
  )
}

function ReactShell(props: ShellProps) {
  const column = props.links.length > 0
  return createElement(
    Shell as ComponentType<any>,
    {
      collapse: props.collapse,
      defaultOpen: props.defaultOpen,
      onOpenChange: props.onOpenChange,
      brand: column && props.brand ? createElement('a', { href: '/' }, props.brand) : undefined,
      aside: column
        ? createElement(Nav, { label: 'Sections', groups: [{ items: props.links }] })
        : undefined,
      header: props.header ? createElement('span', null, props.header) : undefined,
      footer: props.footer ? createElement('span', null, props.footer) : undefined,
    },
    createElement('p', null, props.body)
  )
}

function ReactSplit(props: SplitProps) {
  const { first, second, ...rest } = props
  return createElement(Split as ComponentType<any>, { ...rest, children: [createElement('p', null, first), createElement('p', null, second)] })
}

function ReactStatusBar(props: StatusBarProps) {
  return createElement(
    StatusBar as ComponentType<any>,
    { label: props.label },
    ...props.items.map((item, i) => createElement(StatusBarItem as ComponentType<any>, { key: `s${i}`, tone: item.tone }, item.text)),
    ...(props.end ? [createElement(StatusBarSpacer, { key: 'spacer' }), ...props.end.map((item, i) => createElement(StatusBarItem as ComponentType<any>, { key: `e${i}` }, item.text))] : [])
  )
}

function ReactFlow(props: FlowProps) {
  const { kind, items, spacerAfter, ...options } = props
  const Component = ({ stack: Stack, cluster: Cluster, grid: Grid, container: Container } as const)[kind] as ComponentType<any>
  const children = items.flatMap((item, i) => [
    createElement('p', { key: item }, item),
    ...(spacerAfter === i + 1 ? [createElement(ClusterSpacer, { key: 'spacer' })] : []),
  ])
  return createElement(Component, options, ...children)
}

function ReactPageHeader(props: PageHeaderProps) {
  const { context, actions, ...rest } = props
  return createElement(PageHeader as ComponentType<any>, {
    ...rest,
    context: context ? createElement('p', null, context) : undefined,
    actions: actions ? createElement(Fragment, null, ...actions.map((label) => createElement('button', { key: label, type: 'button' }, label))) : undefined,
  })
}

function ReactSection(props: SectionProps) {
  const { actions, body, ...rest } = props
  return createElement(
    Section as ComponentType<any>,
    {
      ...rest,
      actions: actions ? createElement(Fragment, null, ...actions.map((label) => createElement('button', { key: label, type: 'button' }, label))) : undefined,
    },
    createElement('p', null, body)
  )
}

export const react: Adapter = {
  name: 'react',
  supports: { controlled: true, refusal: true, linkRoot: true },

  async act(interaction) {
    await act(async () => interaction())
  },

  async wait(ms) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms))
    })
  },

  button: (props, target) =>
    mount(Button, props, target, ({ label, ...rest }: ButtonProps) => [rest, label]),
  select: (props, target) => mount(Select, props, target),
  chipGroup: (props, target) => mount(ChipGroup, props, target),
  input: (props, target) => mount(Input, props, target),
  textarea: (props, target) => mount(Textarea, props, target),
  checkbox: (props, target) => mount(Checkbox, props, target, ({ label, ...rest }: CheckboxProps) => [rest, label]),
  switch: (props, target) => mount(Switch, props, target, ({ label, ...rest }: CheckboxProps) => [rest, label]),
  radioGroup: (props, target) => mount(RadioGroup, props, target),
  segmentedControl: (props, target) => mount(SegmentedControl, props, target),
  slider: (props, target) => mount(Slider, props, target),
  numberField: (props, target) => mount(NumberField, props, target),
  choiceCards: (props, target) => mount(ChoiceCardGroup, props, target),
  search: (props, target) => mount(Search, props, target),
  inputGroup: (props, target) =>
    mount(InputGroup, props, target, ({ input, ...rest }: InputGroupProps) => [rest, createElement(Input, input ?? {})]),
  fileDrop: (props, target) => mount(FileDrop, props, target),
  breadcrumbs: (props, target) => mount(Breadcrumbs, props, target),
  gridRows: (props, target) => mount(ReactGridWithRows as ComponentType<any>, props, target),
  accordion: (props, target) => mount(Accordion as ComponentType<any>, props, target, (rest: object) => [{ ...rest, children: (item: { label: string }) => `Body ${item.label}` }]),
  tree: (props, target) => mount(Tree as ComponentType<any>, props, target),
  form: (props, target) =>
    mount(Form as ComponentType<any>, props, target, ({ summary = true, ...rest }: { summary?: boolean }) => [
      rest,
      summary ? createElement(FormSummary, { key: 'summary' }) : null,
      createElement(Field as ComponentType<any>, { key: 'email', name: 'email', label: 'Email' }, createElement(Input, { type: 'email', name: 'email', required: true })),
      createElement(Field as ComponentType<any>, { key: 'password', name: 'password', label: 'Password' }, createElement(Input, { type: 'password', name: 'password', required: true, minLength: 8 })),
      createElement(Field as ComponentType<any>, { key: 'confirm', name: 'confirm', label: 'Confirm password' }, createElement(Input, { type: 'password', name: 'confirm' })),
      createElement(Select, { key: 'role', name: 'role', label: 'Role', items: [{ value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }] }),
      createElement(Button, { key: 'submit', type: 'submit' }, 'Create account'),
    ]),
  gantt: (props, target) => mount(Gantt as ComponentType<any>, props, target),
  codeBlock: (props, target) => mount(CodeBlock as ComponentType<any>, props, target),
  copyable: (props, target) => mount(Copyable as ComponentType<any>, props, target),
  inserts: (props, target) => mount(Inserts as ComponentType<any>, props, target),
  metric: (props, target) => mount(Metric, props, target),
  metricRow: (props, target) =>
    mount(MetricRow, props, target, ({ metrics, ...rest }: MetricRowProps) => [
      rest,
      ...metrics.map((metric, index) => createElement(Metric, { key: index, ...metric })),
    ]),
  keyValueList: (props, target) =>
    mount(KeyValueList, props, target, ({ rich, items, ...rest }: KeyValueListProps) => [
      { ...rest, items: rich ? items.map((item) => ({ ...item, value: createElement('strong', null, item.value) })) : items },
    ]),
  fileChange: (props, target) => mount(FileChange, props, target),
  sparkline: (props, target) => mount(Sparkline, props, target),
  legend: (props, target) => mount(Legend, props, target),
  share: (props, target) => mount(Share, props, target),
  heatmap: (props, target) => mount(Heatmap, props, target),
  run: (props, target) => mount(Run, props, target),
  queue: (props, target) => mount(Queue as ComponentType<any>, props, target),
  history: (props, target) => mount(History, props, target),
  budget: (props, target) => mount(Budget, props, target),
  // The call's input is the body's children; what came back is a prop, so a
  // step whose output is still arriving can carry a caret after it.
  step: (props, target) => mount(Step as ComponentType<any>, props, target, ({ input, ...rest }: { input?: string }) => [rest, input]),
  log: (props, target) => mount(Log as ComponentType<any>, props, target),
  diff: (props, target) => mount(Diff as ComponentType<any>, props, target),
  lanes: (props, target) => mount(Lanes as ComponentType<any>, props, target),
  commandPalette: (props, target) => mount(CommandPalette as ComponentType<any>, props, target),
  kanban: (props, target) => mount(Kanban as ComponentType<any>, props, target),
  progress: (props, target) => mount(Progress as ComponentType<any>, props, target),
  meter: (props, target) => mount(Meter as ComponentType<any>, props, target),
  ring: (props, target) => mount(Ring as ComponentType<any>, props, target),
  cascader: (props, target) => mount(Cascader as ComponentType<any>, props, target),
  calendar: (props, target) => mount(Calendar as ComponentType<any>, props, target),
  datePicker: (props, target) => mount(DatePicker as ComponentType<any>, props, target),
  combobox: (props, target) => mount(Combobox as ComponentType<any>, props, target),
  flow: (props, target) => mount(ReactFlow as ComponentType<any>, props, target),
  pageHeader: (props, target) => mount(ReactPageHeader as ComponentType<any>, props, target),
  section: (props, target) => mount(ReactSection as ComponentType<any>, props, target),
  shell: (props, target) => mount(ReactShell as ComponentType<any>, props, target),
  split: (props, target) => mount(ReactSplit as ComponentType<any>, props, target),
  rail: (props, target) => mount(Rail as ComponentType<any>, props, target),
  statusBar: (props, target) => mount(ReactStatusBar as ComponentType<any>, props, target),
  gridTools: (props, target) => mount(ReactGridWithTools as ComponentType<any>, props, target),
  dataGrid: (props, target) => mount(DataGrid as ComponentType<any>, { rowKey: (row: { id: unknown }) => row.id, ...props }, target),
  nav: (props, target) => mount(Nav, props, target),
  pagination: (props, target) => mount(Pagination, props, target),
  steps: (props, target) => mount(Steps, props, target),
  toolbar: (props, target) =>
    mount(Toolbar, props, target, ({ tools, ...rest }: ToolbarProps) => [
      rest,
      (tools ?? ['Move', 'Rotate', 'Scale']).map((label, index) =>
        label === '|'
          ? createElement(ToolbarSeparator, { key: index })
          : label === '>'
            ? createElement(ToolbarSpacer, { key: index })
            : createElement(Button, { key: index, size: 'sm' }, label)
      ),
    ]),
  buttonGroup: (props, target) =>
    mount(ButtonGroup, props, target, ({ buttons, ...rest }: ButtonGroupProps) => [
      rest,
      (buttons ?? ['One', 'Two', 'Three']).map((label) => createElement(Button, { key: label }, label)),
    ]),
  checkboxGroup: (props, target) => mount(CheckboxGroup, props, target),
  fieldset: (props, target) =>
    mount(Fieldset, props, target, ({ group, items, name, defaultValue, ...fieldset }: FieldsetProps) => [
      fieldset,
      group === 'radio'
        ? createElement(RadioGroup, { items, name, defaultValue: defaultValue as string | undefined })
        : createElement(CheckboxGroup, { items, name, defaultValue: defaultValue as string[] | undefined }),
    ]),
  dialog: (props, target) =>
    mount(props.sheet ? Sheet : Dialog, props, target, ({ trigger, triggerIsButton, body, footer, sheet, ...rest }: DialogProps) => [
      {
        ...rest,
        ...(sheet && sheet !== true ? { side: sheet } : {}),
        trigger: trigger
          ? (triggerProps: object) => createElement(triggerIsButton ? Button : 'button', triggerProps, trigger)
          : undefined,
        footer: footer ? createElement('button', { type: 'button' }, footer) : undefined,
      },
      createElement('p', null, body ?? 'Body'),
      createElement('button', { type: 'button' }, 'Body action'),
    ]),
  popover: (props, target) =>
    mount(Popover, props, target, ({ trigger, body, ...rest }: PopoverProps) => [
      { ...rest, trigger: (triggerProps: object) => createElement('button', triggerProps, trigger) },
      createElement('p', null, body ?? 'Body'),
      createElement('button', { type: 'button' }, 'Inside'),
    ]),
  tooltip: (props, target) =>
    mount(Tooltip, props, target, ({ trigger, ...rest }: TooltipProps) => [
      { ...rest, trigger: (triggerProps: object) => createElement('button', triggerProps, trigger) },
    ]),
  menubar: (props, target) => mount(Menubar, props, target),
  toaster: (props, target) => mount(Toaster, props, target),
  turn: (props, target) =>
    mount(Turn as ComponentType<any>, props, target, ({ body, actions, ...rest }: TurnProps) => [
      { ...rest, actions: actions ? createElement('button', { type: 'button' }, 'Copy') : undefined },
      ...(body === undefined ? [] : [body]),
    ]),
  composer: (props, target) =>
    mount(Composer as ComponentType<any>, props, target, ({ extra, ...rest }: ComposerProps) => [
      rest,
      ...(extra ? [createElement('button', { type: 'button', key: 'draft' }, 'Draft')] : []),
    ]),
  thinking: (props, target) =>
    mount(Thinking as ComponentType<any>, props, target, ({ body, ...rest }: ThinkingProps) => [rest, ...(body === undefined ? [] : [body])]),
  approval: (props, target) =>
    mount(Approval as ComponentType<any>, props, target, ({ extra, ...rest }: ApprovalProps) => [
      { ...rest, actions: extra ? createElement('button', { type: 'button' }, 'Always allow') : undefined },
    ]),
  failure: (props, target) =>
    mount(Failure as ComponentType<any>, props, target, ({ extra, ...rest }: FailureProps) => [
      { ...rest, actions: extra ? createElement('button', { type: 'button' }, 'Skip the file') : undefined },
    ]),
  badge: (props, target) => mount(Badge, props, target, ({ label, ...rest }: { label: string }) => [rest, label]),
  timeline: (props, target) =>
    mount(Timeline as ComponentType<any>, props, target, ({ rich, ...rest }: { rich?: boolean }) => [
      { ...rest, children: rich ? (item: { title: string }) => createElement('strong', null, item.title) : undefined },
    ]),
  statusDot: (props, target) => mount(StatusDot, props, target),
  caret: (props, target) => mount(() => createElement('span', null, 'Streaming', createElement(Caret)), props, target),
  avatar: (props, target) => mount(Avatar, props, target),
  avatarGroup: (props, target) => mount(AvatarGroup, props, target),
  spinner: (props, target) => mount(Spinner, props, target),
  skeleton: (props, target) => mount(Skeleton, props, target),
  card: (props, target) => mount(Card, props, target, (p) => [p, 'Body']),
  panel: (props, target) =>
    mount(Panel, props, target, ({ actions, ...rest }: { actions?: boolean }) => [
      { ...rest, actions: actions ? createElement('button', { type: 'button' }, 'Refresh') : undefined },
      'Body',
    ]),
  banner: (props, target) =>
    mount(Banner, props, target, ({ text, actions, ...rest }: { text?: string; actions?: boolean }) => [
      { ...rest, actions: actions ? createElement('button', { type: 'button' }, 'Renew') : undefined },
      ...(text === undefined ? [] : [text]),
    ]),
  divider: (props, target) => mount(Divider, props, target),
  text: (props, target) => mount(Text, props, target, ({ text, ...rest }: { text: string }) => [rest, text]),
  link: (props, target) => mount(Link, props, target, ({ text, ...rest }: { text: string }) => [rest, text]),
  prose: (props, target) => mount(Prose, props, target, ({ html, ...rest }: { html: string }) => [{ ...rest, dangerouslySetInnerHTML: { __html: html } }]),
  note: (props, target) => mount(Note, props, target, ({ text, ...rest }: { text: string }) => [rest, text]),
  emptyState: (props, target) =>
    mount(EmptyState, props, target, ({ action, ...rest }: { action?: string }) => [
      rest,
      ...(action === undefined ? [] : [createElement('button', { type: 'button' }, action)]),
    ]),
  tabs: (props, target) =>
    mount(Tabs, props, target, ({ panels = true, ...rest }: TabsProps) => [
      panels ? { ...rest, children: (item: { label: string }) => `Panel ${item.label}` } : rest,
    ]),
  menu: (props, target) =>
    mount(Menu, props, target, ({ trigger, ...rest }: MenuProps) => [
      { ...rest, trigger: (triggerProps: object) => createElement('button', triggerProps, trigger) },
    ]),
  field: (props, target) =>
    mount(Field, props, target, ({ input, textarea, checkbox, switch: switchProps, ...field }: FieldProps) => {
      if (checkbox || switchProps) {
        const { label, ...rest } = (checkbox ?? switchProps)!
        return [field, createElement((checkbox ? Checkbox : Switch) as ComponentType<any>, rest, label)]
      }
      if (props.search) return [field, createElement(Search, props.search)]
      if (props.fileDrop) return [field, createElement(FileDrop, props.fileDrop)]
      if (props.slider) return [field, createElement(Slider, props.slider)]
      if (props.numberField) return [field, createElement(NumberField, props.numberField)]
      return [field, textarea ? createElement(Textarea, textarea) : createElement(Input, input ?? {})]
    }),
}
