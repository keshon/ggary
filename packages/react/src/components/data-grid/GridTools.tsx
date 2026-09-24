import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import {
  connectBulk,
  connectColumns,
  connectFilters,
  draftFor,
  filterKindOf,
  setOptions,
  type BulkWords,
  type ColumnDef,
  type DataGridController,
  type Filter,
  type FilterBarWords,
  type FilterDraft,
  type GridView,
} from '@ggary/core/data-grid'
import { mergeProps, reactNormalizer } from '@ggary/core'
import { Button } from '../button'
import { CheckboxGroup } from '../checkbox-group'
import { DatePicker } from '../date-picker'
import { Field } from '../field'
import { Input } from '../input'
import { Menu } from '../menu'
import { NumberField } from '../number-field'
import { Popover } from '../popover'
import { Select } from '../select'

const useGrid = <Row,>(grid: DataGridController<Row>) => useSyncExternalStore(grid.subscribe, grid.getSnapshot, grid.getSnapshot)

export interface FilterEditorWords {
  /** The locale the date filter reads and writes days in. */
  locale?: string
  apply?: string
  clear?: string
  column?: string
  from?: string
  to?: string
  contains?: string
}

interface FilterEditorProps {
  columns: ColumnDef[]
  /** The column being edited; absent, the editor starts by asking which. */
  column?: ColumnDef
  filter?: Filter
  onApply: (column: ColumnDef, draft: FilterDraft) => void
  words?: FilterEditorWords
  props: { editorProps: object; editorFieldsProps: object; editorActionsProps: object }
}

/** One column's filter, in the editor its type implies, built from the kit's own fields. */
function FilterEditor({ columns, column: fixed, filter, onApply, words = {}, props }: FilterEditorProps) {
  const [columnId, setColumnId] = useState<string | undefined>(fixed?.id ?? columns[0]?.id)
  const column = fixed ?? columns.find((candidate) => candidate.id === columnId)
  const [draft, setDraft] = useState<FilterDraft | undefined>(() => (column ? draftFor(column, filter) : undefined))
  const current = draft && column && draft.kind === filterKindOf(column) ? draft : column ? draftFor(column) : undefined
  const change = (patch: Partial<FilterDraft>) => current && setDraft({ ...current, ...patch })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (column && current) onApply(column, current)
  }

  const options = column ? setOptions(column) : []
  return (
    <form {...props.editorProps} onSubmit={submit}>
      <div {...props.editorFieldsProps}>
        {!fixed && (
          <Select
            label={words.column ?? 'Column'}
            items={columns.map((candidate) => ({ value: candidate.id, label: candidate.header }))}
            value={columnId ?? null}
            onValueChange={(value) => {
              setColumnId(value ?? undefined)
              const next = columns.find((candidate) => candidate.id === value)
              setDraft(next ? draftFor(next) : undefined)
            }}
          />
        )}
        {column && current?.kind === 'text' && (
          <Field label={words.contains ?? `${column.header} contains`}>
            <Input value={current.text} onValueChange={(text) => change({ text })} autoFocus />
          </Field>
        )}
        {column && current?.kind === 'set' && (
          <CheckboxGroup
            label={column.header}
            items={options.map((option) => ({ value: String(option.value), label: option.label }))}
            value={current.values.map(String)}
            onValueChange={(values) =>
              change({ values: options.filter((option) => values.includes(String(option.value))).map((option) => option.value) })
            }
          />
        )}
        {column && current?.kind === 'range' && (
          <>
            <Field label={`${column.header}, ${words.from ?? 'from'}`}>
              <NumberField value={current.min} onValueChange={(min) => change({ min })} />
            </Field>
            <Field label={`${column.header}, ${words.to ?? 'to'}`}>
              <NumberField value={current.max} onValueChange={(max) => change({ max })} />
            </Field>
          </>
        )}
        {column && current?.kind === 'date' && (
          <>
            {/* Two days, not one range: either end may stay open — "from 1 Sep", "up to 30 Sep". */}
            <DatePicker
              label={`${column.header}, ${words.from ?? 'from'}`}
              locale={words.locale}
              value={current.from || null}
              max={current.to || null}
              onValueChange={(value) => change({ from: value.start ?? '' })}
            />
            <DatePicker
              label={`${column.header}, ${words.to ?? 'to'}`}
              locale={words.locale}
              value={current.to || null}
              min={current.from || null}
              onValueChange={(value) => change({ to: value.start ?? '' })}
            />
          </>
        )}
      </div>
      <div {...props.editorActionsProps}>
        <Button type="button" emphasis="minimal" size="sm" onClick={() => column && current && onApply(column, draftFor(column))}>
          {words.clear ?? 'Clear'}
        </Button>
        <Button type="submit" emphasis="high" size="sm">
          {words.apply ?? 'Apply'}
        </Button>
      </div>
    </form>
  )
}

export interface GridFiltersProps<Row> {
  grid: DataGridController<Row>
  /** Queries a person picks by name: "Top of yesterday", "Unassigned". */
  views?: GridView[]
  words?: FilterBarWords & FilterEditorWords & { add?: string; views?: string; clearAll?: string }
}

/** The filters in force as chips — press one to change it, × to remove it — and a way to add one. */
export function GridFilters<Row>({ grid, views, words = {} }: GridFiltersProps<Row>) {
  const snapshot = useGrid(grid)
  const api = connectFilters(snapshot, grid, reactNormalizer, { words })
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const apply = (column: ColumnDef, draft: FilterDraft) => {
    api.apply(column, draft)
    setEditing(null)
    setAdding(false)
  }

  return (
    <div {...api.rootProps}>
      {views && views.length > 0 && (
        <Menu
          items={views.map((view) => ({ value: view.id, label: view.label }))}
          onSelect={(id) => {
            const view = views.find((candidate) => candidate.id === id)
            if (view) api.applyView(view)
          }}
          trigger={(props) => (
            <Button {...props} size="sm" emphasis="low">
              {words.views ?? 'Views'}
            </Button>
          )}
        />
      )}
      {api.chips.map((chip) => (
        <span key={chip.key} {...chip.rootProps}>
          <Popover
            title={chip.name}
            placement="bottom-start"
            open={editing === chip.key}
            onOpenChange={(open) => setEditing(open ? chip.key : null)}
            trigger={(props) => (
              <button {...mergeProps(props, chip.buttonProps)}>
                <span {...chip.nameProps}>{chip.name}</span>
                <span {...chip.valueProps}>{chip.value}</span>
              </button>
            )}
          >
            {/* Keyed by the filter: a changed filter is a fresh draft. */}
            <FilterEditor
              key={JSON.stringify(chip.filter)}
              columns={api.columns}
              column={chip.column}
              filter={chip.filter}
              onApply={apply}
              words={words}
              props={api}
            />
          </Popover>
          <button {...chip.removeProps}>
            <span {...chip.removeIconProps} />
          </button>
        </span>
      ))}
      <Popover
        title={words.add ?? 'Add a filter'}
        placement="bottom-start"
        open={adding}
        onOpenChange={setAdding}
        trigger={(props) => (
          <Button {...props} size="sm" emphasis="minimal">
            {words.add ?? 'Add a filter'}
          </Button>
        )}
      >
        {/* A new editor each time it opens: adding starts from nothing. */}
        {adding && <FilterEditor columns={api.columns} onApply={apply} words={words} props={api} />}
      </Popover>
      {api.hasFilters && (
        <Button size="sm" emphasis="minimal" onClick={api.clear}>
          {words.clearAll ?? 'Clear all'}
        </Button>
      )}
    </div>
  )
}

export interface GridColumnsProps<Row> {
  grid: DataGridController<Row>
  words?: { label?: string; reset?: string }
}

/** Which columns are shown: a checkbox per column, and a way back to the start. */
export function GridColumns<Row>({ grid, words = {} }: GridColumnsProps<Row>) {
  const snapshot = useGrid(grid)
  const api = connectColumns(snapshot, grid, reactNormalizer)
  return (
    <Popover
      title={words.label ?? 'Columns'}
      placement="bottom-end"
      trigger={(props) => (
        <Button {...props} size="sm" emphasis="low">
          {words.label ?? 'Columns'}
        </Button>
      )}
    >
      <div {...api.rootProps}>
        <CheckboxGroup label={words.label ?? 'Columns'} items={api.items} value={api.value} onValueChange={api.setVisible} />
        <Button {...api.resetProps} size="sm" emphasis="minimal" onClick={api.reset}>
          {words.reset ?? 'Reset columns'}
        </Button>
      </div>
    </Popover>
  )
}

export interface GridBulkBarProps<Row> {
  grid: DataGridController<Row>
  /** What can be done with the selection; read `grid` for the payload. */
  children?: ReactNode
  words?: BulkWords
}

/** Shown while something is selected: how much, the offer of everything matching, and the actions. */
export function GridBulkBar<Row>({ grid, children, words = {} }: GridBulkBarProps<Row>) {
  const snapshot = useGrid(grid)
  const api = connectBulk(snapshot, grid, reactNormalizer, { words })
  if (!api.visible) return null
  return (
    <div {...api.rootProps}>
      <span {...api.countProps}>{api.countText}</span>
      {api.offer && <button {...api.selectAllProps}>{api.selectAllText}</button>}
      <button {...api.clearProps}>{api.clearText}</button>
      <div {...api.actionsProps}>{children}</div>
    </div>
  )
}
