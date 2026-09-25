import type { ControlSize } from '../../utils/size'
import type { ApprovalWords } from '../approval'
import type { BudgetWords } from '../budget'
import type { CalendarWords } from '../calendar'
import type { CodeBlockWords, CopyWords } from '../code'
import type { ComboboxWords } from '../combobox'
import type { PaletteWords } from '../command-palette'
import type { ComposerWords } from '../composer'
import type { BulkWords, DataGridWords, DetailWords, FilterBarWords, FilterEditorWords } from '../data-grid'
import type { DatePickerWords } from '../date-picker'
import type { DiffWords } from '../diff'
import type { FailureWords } from '../failure'
import type { FileChangeWords } from '../file-change'
import type { FormSummaryWords } from '../form'
import type { GanttWords } from '../gantt'
import type { HeatmapWords } from '../heatmap'
import type { HistoryWords } from '../history'
import type { InputWords } from '../input'
import type { KanbanWords } from '../kanban'
import type { LanesWords } from '../lanes'
import type { LegendWords } from '../legend'
import type { LinkWords } from '../link'
import type { ListWords } from '../list'
import type { LogWords } from '../log'
import type { AnchorWords } from '../anchor'
import type { NavWords } from '../nav'
import type { PopconfirmWords } from '../popconfirm'
import type { RangeSliderWords } from '../range-slider'
import type { RunWords } from '../run'
import type { ShareWords } from '../share'
import type { SparklineWords } from '../sparkline'
import type { StepWords } from '../step'
import type { QueueWordsInput } from '../task'
import type { ThinkingWords } from '../thinking'
import type { TimePickerWords } from '../time-picker'
import type { TurnWords } from '../turn'
import type { UploadWords } from '../upload'

/**
 * Every component's words, by the component's name: what a ConfigProvider
 * hands down, and what each component lays its own `words` over, key by key.
 * An app translates the kit here, once, rather than on every component.
 */
export interface KitWords {
  approval?: ApprovalWords
  budget?: Partial<BudgetWords>
  calendar?: CalendarWords
  chipGroup?: { empty?: string }
  codeBlock?: Partial<CodeBlockWords>
  combobox?: ComboboxWords
  commandPalette?: Partial<PaletteWords>
  composer?: ComposerWords
  copyable?: Partial<CopyWords>
  dataGrid?: DataGridWords
  datePicker?: DatePickerWords
  diff?: DiffWords
  failure?: FailureWords
  fileChange?: FileChangeWords
  formSummary?: FormSummaryWords
  gantt?: Partial<GanttWords>
  gridBulkBar?: BulkWords
  gridColumns?: { label?: string; reset?: string }
  gridDetail?: DetailWords
  gridFilters?: FilterBarWords & FilterEditorWords & { add?: string; views?: string; clearAll?: string }
  heatmap?: HeatmapWords
  history?: Partial<HistoryWords>
  input?: InputWords
  kanban?: Partial<KanbanWords>
  lanes?: LanesWords
  legend?: Partial<LegendWords>
  link?: LinkWords
  list?: ListWords
  log?: LogWords
  nav?: Partial<NavWords>
  anchor?: Partial<AnchorWords>
  popconfirm?: Pick<PopconfirmWords, 'failed'>
  queue?: QueueWordsInput
  rangeSlider?: RangeSliderWords
  run?: Partial<RunWords>
  share?: ShareWords
  sparkline?: Partial<SparklineWords>
  step?: StepWords
  thinking?: ThinkingWords
  timePicker?: TimePickerWords
  turn?: TurnWords
  upload?: UploadWords
}

/** What a ConfigProvider sets for everything under it. A component's own prop always wins. */
export interface KitConfig {
  /** The default `locale` of every component that formats a date, a time, a number or a size; also the element's `lang`. */
  locale?: string
  /** The element's `dir`: every component under it follows the direction the DOM says. */
  dir?: 'ltr' | 'rtl'
  /** The default `size` of every control: `sm`, `md` or `lg`. */
  size?: ControlSize
  /** The element's `data-mode`: a light or a dark island, as the theme draws one. */
  mode?: 'light' | 'dark'
  /** Words by component; a component's own `words` are laid over them, key by key. */
  words?: KitWords
}
