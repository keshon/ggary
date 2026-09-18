/**
 * The conformance harness.
 *
 * Every spec in this folder is written ONCE against this interface and runs
 * against every adapter. The interface hides the three things that genuinely
 * differ between frameworks — how a component is mounted, how new props reach
 * it, and when its effects have flushed — and nothing else. If a spec needs to
 * know which framework it is talking to, the spec is testing an adapter detail
 * rather than the kit's contract, and belongs in an adapter-specific file.
 *
 * Why this exists: every adapter bug found so far was DRIFT. The vanilla Select
 * forgot its empty state; the tab stop vanished only when items arrived late,
 * which only one adapter did. A suite that ran against one renderer could not see
 * either until someone went looking.
 */
import type { ChipGroupMode, ChipGroupOrientation, ChipItem } from '../../packages/core/src/components/chip-group'
import type { SelectItem } from '../../packages/core/src/components/select'
import type { ButtonEmphasis, ButtonSize, ButtonTone } from '../../packages/core/src/components/button'
import type { InputSize, InputType } from '../../packages/core/src/components/input'
import type { TextareaResize, TextareaSize } from '../../packages/core/src/components/textarea'
import type { CheckedState } from '../../packages/core/src/components/checkbox'
import type { RadioGroupOrientation, RadioItem } from '../../packages/core/src/components/radio-group'
import type { MenuEntry, MenuItem } from '../../packages/core/src/components/menu'
import type { MenubarMenu } from '../../packages/core/src/components/menubar'
import type { TabItem, TabsActivation, TabsOrientation, TabsVariant } from '../../packages/core/src/components/tabs'
import type { Toaster, ToastPlacement } from '../../packages/core/src/components/toast'
import type { BadgeVariant } from '../../packages/core/src/components/badge'
import type { AvatarPerson, AvatarSize } from '../../packages/core/src/components/avatar'
import type { StatusTone } from '../../packages/core/src/utils/tone'
import type { HeadingLevel, LiveMode, RegionRank } from '../../packages/core/src/utils/region'

export interface ButtonProps {
  label: string
  emphasis?: ButtonEmphasis
  tone?: ButtonTone
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
}

export interface SelectProps {
  items: SelectItem[]
  label?: string
  placeholder?: string
  value?: string | null
  defaultValue?: string | null
  disabled?: boolean
  name?: string
  onValueChange?: (value: string | null, item: SelectItem | null) => void
}

export interface ChipGroupProps {
  items: ChipItem[]
  label?: string
  mode?: ChipGroupMode
  orientation?: ChipGroupOrientation
  removable?: boolean
  disabled?: boolean
  name?: string
  value?: string[]
  defaultValue?: string[]
  onSelectionChange?: (selection: string[], items: ChipItem[]) => void
  onRemove?: (value: string, item: ChipItem | null) => void
}

export interface InputProps {
  type?: InputType
  size?: InputSize
  name?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export interface TextareaProps {
  size?: TextareaSize
  name?: string
  placeholder?: string
  rows?: number
  maxLength?: number
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  resize?: TextareaResize
  autoResize?: boolean
  maxRows?: number
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

/** Checkbox and Switch share a shape; `label` is the text beside the box. */
export interface CheckboxProps {
  label?: string
  checked?: CheckedState
  defaultChecked?: CheckedState
  onCheckedChange?: (checked: boolean) => void
  name?: string
  value?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}

export interface SwitchProps extends Omit<CheckboxProps, 'checked' | 'defaultChecked'> {
  checked?: boolean
  defaultChecked?: boolean
}

export interface RadioGroupProps {
  items: RadioItem[]
  name?: string
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  label?: string
  orientation?: RadioGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}

export interface SegmentedControlProps {
  items: RadioItem[]
  label: string
  name?: string
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  required?: boolean
  fullWidth?: boolean
}

export interface SliderProps {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  name?: string
  label?: string
  valueText?: string
  showValue?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}

export interface NumberFieldProps {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  name?: string
  label?: string
  axis?: string
  placeholder?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}

export interface ChoiceCardItem {
  value: string
  title: string
  description?: string
  disabled?: boolean
}

export interface ChoiceCardGroupProps {
  items: ChoiceCardItem[]
  type?: 'radio' | 'checkbox'
  name?: string
  value?: string | string[] | null
  defaultValue?: string | string[] | null
  onValueChange?: (value: any) => void
  label?: string
  orientation?: RadioGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}

export interface SearchProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  size?: 'sm' | 'md' | 'lg'
  name?: string
  placeholder?: string
  label?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}

export interface InputGroupProps {
  prefix?: string
  suffix?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  invalid?: boolean
  /** The field inside the group. */
  input?: InputProps
}

export interface FileDropProps {
  name?: string
  accept?: string
  multiple?: boolean
  label?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  onFilesChange?: (files: File[]) => void
}

export interface ButtonGroupProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  /** The labels of the buttons inside. */
  buttons?: string[]
}

export interface BreadcrumbsProps {
  items: { label: string; href?: string }[]
  label?: string
}

export interface NavProps {
  label: string
  groups: { label?: string; items: { label: string; href: string; icon?: string; count?: number | string; current?: boolean }[] }[]
}

export interface PaginationProps {
  items: { label: string; href?: string; page?: number; current?: boolean; disabled?: boolean; gap?: boolean }[]
  label?: string
  onPageChange?: (page: number, event: Event) => void
}

export interface StepsProps {
  items: { name: string; note?: string; state: 'done' | 'current' | 'todo' }[]
  label?: string
}

export interface ToolbarProps {
  label?: string
  orientation?: 'horizontal' | 'vertical'
  /** The labels of the buttons in the strip; a `|` is a separator and a `>` the spacer. */
  tools?: string[]
}

export interface DataGridProps {
  columns: import('../../packages/core/src/components/data-grid').ColumnDef<any>[]
  rows?: any[]
  source?: import('../../packages/core/src/components/data-grid').GridSource<any>
  label: string
  selectable?: boolean
  locale?: string
  onRowActivate?: (row: any, index: number) => void
  onSelectionChange?: (selection: import('../../packages/core/src/components/data-grid').Selection) => void
  onQueryChange?: (query: import('../../packages/core/src/components/data-grid').GridQuery) => void
}

/** A grid with its filter bar, column picker and bulk bar (with one action, "Assign"). */
export interface GridToolsProps {
  columns: import('../../packages/core/src/components/data-grid').ColumnDef<any>[]
  rows: any[]
  views?: import('../../packages/core/src/components/data-grid').GridView[]
  locale?: string
}

/**
 * A grid with editable columns, a row menu and a detail sheet. The detail's
 * body is a paragraph of `detailBody(row)`; the menu's choices land in `onMenuSelect`.
 */
export interface GridRowsProps {
  columns: import('../../packages/core/src/components/data-grid').ColumnDef<any>[]
  rows: any[]
  locale?: string
  onCellEdit?: (edit: import('../../packages/core/src/components/data-grid').CellEdit<any>) => Promise<any> | any
  menuItems: (target: import('../../packages/core/src/components/data-grid').RowMenuTarget<any>) => import('../../packages/core/src/components/menu').MenuEntry[]
  onMenuSelect: (value: string, target: import('../../packages/core/src/components/data-grid').RowMenuTarget<any>) => void
  detailTitle: (row: any) => string
  detailBody: (row: any) => string
}

/** A shell around a nav of links, with a header, a footer and a paragraph of work area. */
export interface ShellProps {
  collapse?: 'bar' | 'drawer'
  brand?: string
  /** Links in the side column; none means a shell with no column. */
  links: { label: string; href: string }[]
  header?: string
  footer?: string
  body: string
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
}

/** A split of two paragraphs. */
export interface SplitProps {
  label: string
  orientation?: 'horizontal' | 'vertical'
  primary?: 'start' | 'end'
  min?: number
  max?: number
  step?: number
  defaultSize?: number
  collapsible?: boolean
  first: string
  second: string
  onSizeChange?: (size: number, details: { collapsed: boolean }) => void
}

export interface RailProps {
  label: string
  items: { label: string; href: string; icon: string; count?: number | string; current?: boolean; end?: boolean }[]
}

/** Readings; the ones in `end` stand after the spacer. */
export interface StatusBarProps {
  label?: string
  items: { text: string; tone?: 'neutral' | 'running' | 'ok' | 'warn' | 'error' }[]
  end?: { text: string }[]
}

/** One flow primitive around paragraphs of `items`; a spacer after `spacerAfter` items (cluster only). */
export interface FlowProps {
  kind: 'stack' | 'cluster' | 'grid' | 'container'
  gap?: 'tight' | 'default' | 'loose'
  justify?: 'start' | 'end' | 'between'
  columns?: 'tight' | 'default' | 'wide'
  size?: 'default' | 'narrow' | 'prose' | 'full'
  items: string[]
  spacerAfter?: number
}

/** A page header; `context` is a paragraph above the title, `actions` are buttons. */
export interface PageHeaderProps {
  title: string
  description?: string
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  context?: string
  actions?: string[]
}

export interface SectionProps {
  title?: string
  description?: string
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  rank?: 'lead' | 'default' | 'support'
  region?: boolean
  actions?: string[]
  body: string
}

export interface ComboboxProps {
  label: string
  items?: import('../../packages/core/src/components/combobox').ComboboxItem[]
  load?: import('../../packages/core/src/components/combobox').ComboboxLoad
  debounce?: number
  multiple?: boolean
  defaultValue?: string | string[] | null
  onValueChange?: (value: string[]) => void
  onCreate?: (text: string) => import('../../packages/core/src/components/combobox').ComboboxItem | void | Promise<import('../../packages/core/src/components/combobox').ComboboxItem | void>
  placeholder?: string
  limit?: number
  name?: string
}

export interface CalendarProps {
  mode?: 'single' | 'range'
  defaultValue?: string | { start: string | null; end: string | null } | null
  min?: string
  max?: string
  locale?: string
  onValueChange?: (value: { start: string | null; end: string | null }) => void
}

export interface DatePickerProps extends CalendarProps {
  label: string
  name?: string
  presets?: import('../../packages/core/src/components/date-picker').DatePreset[]
}

export interface AccordionProps {
  items: import('../../packages/core/src/components/accordion').AccordionItem[]
  defaultValue?: string[]
  multiple?: boolean
  collapsible?: boolean
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  onValueChange?: (value: string[]) => void
}

export interface TreeProps {
  items: import('../../packages/core/src/components/tree').TreeNode[]
  label: string
  defaultValue?: string[]
  defaultExpanded?: string[]
  selectionMode?: import('../../packages/core/src/components/tree').TreeSelectionMode
  onValueChange?: (value: string[]) => void
  onExpandedChange?: (expanded: string[]) => void
}

export interface ProgressProps {
  value?: number | null
  min?: number
  max?: number
  label?: string
  hideLabel?: boolean
  shape?: 'bar' | 'ring'
  size?: 'sm' | 'md' | 'lg'
  tone?: 'running' | 'ok' | 'warn' | 'error'
  locale?: string
  showValue?: boolean
}

/** A sign-up form: Email, Password and Confirm password in named Fields, Role in a Select, and a summary. */
export interface FormProps {
  summary?: boolean
  validate?: (data: FormData) => Record<string, string | null | undefined> | Promise<Record<string, string | null | undefined>>
  onSubmit?: (data: FormData) => unknown
}

export interface GanttProps {
  tasks: import('../../packages/core/src/components/gantt').GanttTask[]
  scale?: import('../../packages/core/src/components/gantt').GanttScale
  range?: import('../../packages/core/src/components/gantt').GanttRange
  locale?: string
  onOpen?: (task: import('../../packages/core/src/components/gantt').GanttTask) => void
  onChange?: (change: import('../../packages/core/src/components/gantt').GanttChange) => unknown
  groups?: import('../../packages/core/src/components/gantt').GanttGroup[]
  collapsed?: string[]
  defaultCollapsed?: string[]
  onCollapsedChange?: (collapsed: string[]) => void
}

export interface CommandPaletteProps {
  commands: import('../../packages/core/src/components/command-palette').PaletteCommand[]
  defaultOpen?: boolean
  onRun?: (command: import('../../packages/core/src/components/command-palette').PaletteCommand) => void
}

export interface KanbanProps {
  columns: import('../../packages/core/src/components/kanban').KanbanColumn[]
  cards: import('../../packages/core/src/components/kanban').KanbanCard[]
  onMove?: (move: import('../../packages/core/src/components/kanban').KanbanMove) => unknown
  onOpen?: (card: import('../../packages/core/src/components/kanban').KanbanCard) => void
  onAdd?: (column: string, title: string) => unknown
  cardMenu?: (card: import('../../packages/core/src/components/kanban').KanbanCard) => import('../../packages/core/src/components/menu').MenuEntry[]
  onCardMenuSelect?: (value: string, card: import('../../packages/core/src/components/kanban').KanbanCard) => void
}

export interface CascaderProps {
  label: string
  items: import('../../packages/core/src/components/cascader').CascaderNode[]
  defaultValue?: string[] | null
  selectParents?: boolean
  name?: string
  onValueChange?: (value: string[]) => void
}

export interface CheckboxGroupProps {
  items: RadioItem[]
  name?: string
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  label?: string
  orientation?: RadioGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}

/** A Fieldset around one option group — radios or checkboxes — which is what it exists for. */
export interface FieldsetProps {
  legend?: string
  hint?: string
  error?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  group: 'radio' | 'checkbox'
  items: RadioItem[]
  name?: string
  /** Read at mount only. */
  defaultValue?: string | string[]
}

export interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
  title?: string
  description?: string
  /** Body text. The body also holds one button, "Body action". */
  body?: string
  /** A button in the footer, with this label. */
  footer?: string
  /** A trigger button, with this label. */
  trigger?: string
  /** Make the trigger the kit's own Button, to test composition. */
  triggerIsButton?: boolean
  modal?: boolean
  role?: 'dialog' | 'alertdialog'
  /** Mount the Sheet component (Sheet, <gg-sheet>) at this side instead of a Dialog. */
  sheet?: 'start' | 'end' | true
  closeOnEscape?: boolean
  closeOnOutside?: boolean
}

export interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
  /** The trigger button's label. */
  trigger: string
  title?: string
  /** Content text. The content also holds one button, "Inside". */
  body?: string
  placement?: string
  closeOnEscape?: boolean
  closeOnOutside?: boolean
  closeButton?: boolean
}

export interface MenuProps {
  items: MenuEntry[]
  /** The trigger button's label. */
  trigger: string
  onSelect?: (value: string, details: { item: MenuItem; checked?: boolean }) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
  placement?: string
  closeOnSelect?: boolean
  label?: string
}

export interface MenubarProps {
  menus: MenubarMenu[]
  onSelect?: (value: string, details: { item: MenuItem; checked?: boolean; menu: string }) => void
  onOpenChange?: (menu: string | null) => void
  label?: string
  mnemonics?: boolean
  closeOnSelect?: boolean
}

export interface TabsProps {
  items: TabItem[]
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  onClose?: (value: string) => void
  label?: string
  orientation?: TabsOrientation
  activation?: TabsActivation
  variant?: TabsVariant
  /** Render a panel per tab reading "Panel <label>". Default true; false for tabs without panels. */
  panels?: boolean
}

export interface ToasterProps {
  /** A queue of the test's own, so tests do not share the page's toaster. */
  toaster: Toaster
  placement?: ToastPlacement
  label?: string
}

export interface BadgeProps {
  /** The word inside. */
  label: string
  tone?: StatusTone
  variant?: BadgeVariant
  dot?: boolean
}

export interface AvatarProps {
  name: string
  src?: string
  size?: AvatarSize
  decorative?: boolean
}

export interface AvatarGroupProps {
  label: string
  people: AvatarPerson[]
  max?: number
  size?: AvatarSize
}

export interface SpinnerProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export interface SkeletonProps {
  lines?: number
  title?: boolean
}

/** A card whose body reads "Body". */
export interface CardProps {
  title?: string
  subtitle?: string
  headingLevel?: HeadingLevel
  href?: string
  interactive?: boolean
  plain?: boolean
  rank?: RegionRank
  tone?: StatusTone
}

/** A panel whose body reads "Body"; `actions` puts a "Refresh" button in its header. */
export interface PanelProps {
  title?: string
  headingLevel?: HeadingLevel
  body?: 'padded' | 'flush' | 'list'
  plain?: boolean
  rank?: RegionRank
  tone?: StatusTone
  region?: boolean
  scrollable?: boolean
  actions?: boolean
}

/** `text` is the detail; `actions` puts a "Renew" button at the far edge. */
export interface BannerProps {
  tone?: StatusTone
  title?: string
  text?: string
  live?: LiveMode
  actions?: boolean
  onDismiss?: () => void
  dismissLabel?: string
}

export interface NoteProps {
  text: string
  tone?: StatusTone
  live?: LiveMode
}

/** `action` puts a button with this label as the next step. */
export interface EmptyStateProps {
  title: string
  description?: string
  headingLevel?: HeadingLevel
  live?: LiveMode
  action?: string
}

export interface TooltipProps {
  content: string
  /** The trigger button's label. */
  trigger: string
  openDelay?: number
  closeDelay?: number
  disabled?: boolean
  onOpenChange?: (open: boolean, details: { reason: string }) => void
}

/**
 * A Field wrapping one control: a Textarea, Checkbox or Switch when that key is
 * given, otherwise an Input configured by `input`.
 */
export interface FieldProps {
  label?: string
  hint?: string
  error?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  input?: InputProps
  textarea?: TextareaProps
  slider?: SliderProps
  numberField?: NumberFieldProps
  search?: SearchProps
  fileDrop?: FileDropProps
  checkbox?: CheckboxProps
  switch?: SwitchProps
}

export interface Mounted<P> {
  /** The element the component was rendered into. Specs query inside it. */
  root: HTMLElement
  /** Push new props the way the framework would, and wait until they settle. */
  update(patch: Partial<P>): Promise<void>
  unmount(): Promise<void>
}

export interface Adapter {
  name: 'elements' | 'react' | 'svelte'

  /**
   * What the adapter's public API can express. A spec skips a case the adapter
   * cannot express — and says so in the test name — rather than faking it.
   * Custom elements have no controlled mode: an attribute cannot be owned by
   * the page and the element at once.
   */
  supports: {
    controlled: boolean
    /**
     * The owner can REFUSE a change: pass a `value`, ignore the callback, and the
     * component keeps showing the owner's value. React only. Svelte's `bind:`
     * model writes the change back, and the custom elements follow their own
     * attributes, so there a change the owner ignores still moves the component.
     */
    refusal: boolean
    /**
     * A component's root can be another element — a card that is an <a>. Not
     * for custom elements: the host is the root, and a host cannot be a link.
     */
    linkRoot: boolean
  }

  /** Run a user interaction and wait for everything it causes to flush. */
  act(interaction: () => void): Promise<void>

  /** Let time pass — timers fire — and flush what they caused, as inside act. */
  wait(ms: number): Promise<void>

  button(props: ButtonProps, target: HTMLElement): Promise<Mounted<ButtonProps>>
  select(props: SelectProps, target: HTMLElement): Promise<Mounted<SelectProps>>
  chipGroup(props: ChipGroupProps, target: HTMLElement): Promise<Mounted<ChipGroupProps>>
  input(props: InputProps, target: HTMLElement): Promise<Mounted<InputProps>>
  textarea(props: TextareaProps, target: HTMLElement): Promise<Mounted<TextareaProps>>
  checkbox(props: CheckboxProps, target: HTMLElement): Promise<Mounted<CheckboxProps>>
  switch(props: SwitchProps, target: HTMLElement): Promise<Mounted<SwitchProps>>
  radioGroup(props: RadioGroupProps, target: HTMLElement): Promise<Mounted<RadioGroupProps>>
  segmentedControl(props: SegmentedControlProps, target: HTMLElement): Promise<Mounted<SegmentedControlProps>>
  slider(props: SliderProps, target: HTMLElement): Promise<Mounted<SliderProps>>
  numberField(props: NumberFieldProps, target: HTMLElement): Promise<Mounted<NumberFieldProps>>
  choiceCards(props: ChoiceCardGroupProps, target: HTMLElement): Promise<Mounted<ChoiceCardGroupProps>>
  search(props: SearchProps, target: HTMLElement): Promise<Mounted<SearchProps>>
  inputGroup(props: InputGroupProps, target: HTMLElement): Promise<Mounted<InputGroupProps>>
  fileDrop(props: FileDropProps, target: HTMLElement): Promise<Mounted<FileDropProps>>
  buttonGroup(props: ButtonGroupProps, target: HTMLElement): Promise<Mounted<ButtonGroupProps>>
  breadcrumbs(props: BreadcrumbsProps, target: HTMLElement): Promise<Mounted<BreadcrumbsProps>>
  nav(props: NavProps, target: HTMLElement): Promise<Mounted<NavProps>>
  pagination(props: PaginationProps, target: HTMLElement): Promise<Mounted<PaginationProps>>
  steps(props: StepsProps, target: HTMLElement): Promise<Mounted<StepsProps>>
  toolbar(props: ToolbarProps, target: HTMLElement): Promise<Mounted<ToolbarProps>>
  /** Updates are not supported: a grid's props are read at mount. */
  dataGrid(props: DataGridProps, target: HTMLElement): Promise<Mounted<DataGridProps>>
  gridTools(props: GridToolsProps, target: HTMLElement): Promise<Mounted<GridToolsProps>>
  /** Updates are not supported: the frame is read at mount. */
  shell(props: ShellProps, target: HTMLElement): Promise<Mounted<ShellProps>>
  split(props: SplitProps, target: HTMLElement): Promise<Mounted<SplitProps>>
  rail(props: RailProps, target: HTMLElement): Promise<Mounted<RailProps>>
  statusBar(props: StatusBarProps, target: HTMLElement): Promise<Mounted<StatusBarProps>>
  flow(props: FlowProps, target: HTMLElement): Promise<Mounted<FlowProps>>
  pageHeader(props: PageHeaderProps, target: HTMLElement): Promise<Mounted<PageHeaderProps>>
  section(props: SectionProps, target: HTMLElement): Promise<Mounted<SectionProps>>
  /** Optional: an adapter without it skips the combobox spec (the custom elements, while vanilla is undecided). */
  combobox?(props: ComboboxProps, target: HTMLElement): Promise<Mounted<ComboboxProps>>
  calendar?(props: CalendarProps, target: HTMLElement): Promise<Mounted<CalendarProps>>
  cascader?(props: CascaderProps, target: HTMLElement): Promise<Mounted<CascaderProps>>
  accordion?(props: AccordionProps, target: HTMLElement): Promise<Mounted<AccordionProps>>
  tree?(props: TreeProps, target: HTMLElement): Promise<Mounted<TreeProps>>
  progress?(props: ProgressProps, target: HTMLElement): Promise<Mounted<ProgressProps>>
  kanban?(props: KanbanProps, target: HTMLElement): Promise<Mounted<KanbanProps>>
  commandPalette?(props: CommandPaletteProps, target: HTMLElement): Promise<Mounted<CommandPaletteProps>>
  form?(props: FormProps, target: HTMLElement): Promise<Mounted<FormProps>>
  gantt?(props: GanttProps, target: HTMLElement): Promise<Mounted<GanttProps>>
  datePicker?(props: DatePickerProps, target: HTMLElement): Promise<Mounted<DatePickerProps>>
  gridRows(props: GridRowsProps, target: HTMLElement): Promise<Mounted<GridRowsProps>>
  checkboxGroup(props: CheckboxGroupProps, target: HTMLElement): Promise<Mounted<CheckboxGroupProps>>
  /** Updates apply to the Fieldset's own props; the group inside is read at mount only. */
  fieldset(props: FieldsetProps, target: HTMLElement): Promise<Mounted<FieldsetProps>>
  dialog(props: DialogProps, target: HTMLElement): Promise<Mounted<DialogProps>>
  popover(props: PopoverProps, target: HTMLElement): Promise<Mounted<PopoverProps>>
  tooltip(props: TooltipProps, target: HTMLElement): Promise<Mounted<TooltipProps>>
  menu(props: MenuProps, target: HTMLElement): Promise<Mounted<MenuProps>>
  menubar(props: MenubarProps, target: HTMLElement): Promise<Mounted<MenubarProps>>
  tabs(props: TabsProps, target: HTMLElement): Promise<Mounted<TabsProps>>
  toaster(props: ToasterProps, target: HTMLElement): Promise<Mounted<ToasterProps>>
  badge(props: BadgeProps, target: HTMLElement): Promise<Mounted<BadgeProps>>
  avatar(props: AvatarProps, target: HTMLElement): Promise<Mounted<AvatarProps>>
  avatarGroup(props: AvatarGroupProps, target: HTMLElement): Promise<Mounted<AvatarGroupProps>>
  spinner(props: SpinnerProps, target: HTMLElement): Promise<Mounted<SpinnerProps>>
  skeleton(props: SkeletonProps, target: HTMLElement): Promise<Mounted<SkeletonProps>>
  card(props: CardProps, target: HTMLElement): Promise<Mounted<CardProps>>
  panel(props: PanelProps, target: HTMLElement): Promise<Mounted<PanelProps>>
  banner(props: BannerProps, target: HTMLElement): Promise<Mounted<BannerProps>>
  note(props: NoteProps, target: HTMLElement): Promise<Mounted<NoteProps>>
  emptyState(props: EmptyStateProps, target: HTMLElement): Promise<Mounted<EmptyStateProps>>
  /** Updates apply to the Field's own props; the control's props are read at mount only. */
  field(props: FieldProps, target: HTMLElement): Promise<Mounted<FieldProps>>
}

// --- lifecycle -----------------------------------------------------------------

/**
 * Every mount is tracked and torn down after each test.
 *
 * Removing a component's DOM is not unmounting it. An open Select that is merely
 * detached keeps its document-level Escape and pointerdown listeners, and the NEXT
 * test's keypress drives the previous test's machine — which is exactly how the
 * first run of this suite produced React "not wrapped in act" warnings from a
 * select no test was looking at.
 */
const live = new Set<Mounted<any>>()

export function track<P>(mounted: Mounted<P>): Mounted<P> {
  const unmount = mounted.unmount
  const tracked: Mounted<P> = {
    ...mounted,
    async unmount() {
      if (!live.delete(tracked)) return
      await unmount()
    },
  }
  live.add(tracked)
  return tracked
}

export async function cleanup(): Promise<void> {
  for (const mounted of [...live]) await mounted.unmount()
  document.body.replaceChildren()
}

// --- helpers shared by the specs ---------------------------------------------

export const keydown = (target: Element, key: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

export const click = (target: Element) => (target as HTMLElement).click()

/**
 * Type into a native input the way a user does, for every framework. The value
 * is written through the prototype's setter, not the element's own property:
 * React tracks the last value it rendered on the instance, and a plain
 * `el.value = x` would update that tracker too, so React would see no change and
 * never call onChange.
 */
export function typeInto(input: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')!.set!
  setter.call(input, text)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * The first element that is this part — the root itself included, since a
 * custom element that enhances its host (gg-field, gg-radio-group) IS the part.
 */
export const part = (root: ParentNode, scope: string, name: string) => {
  const selector = `[data-scope="${scope}"][data-part="${name}"]`
  return root instanceof HTMLElement && root.matches(selector) ? root : root.querySelector<HTMLElement>(selector)
}

export const parts = (root: ParentNode, scope: string, name: string) => [
  ...root.querySelectorAll<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`),
]

/** A mount point for one test. Teardown is `cleanup`, run after each test. */
export function freshTarget(tag: 'div' | 'form' = 'div'): HTMLElement {
  const target = document.createElement(tag)
  document.body.append(target)
  return target
}
