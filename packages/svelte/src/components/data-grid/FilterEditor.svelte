<script lang="ts">
  import { draftFor, filterKindOf, setOptions, type ColumnDef, type Filter, type FilterDraft } from '@ggary/core/data-grid'
  import Button from '../button/Button.svelte'
  import CheckboxGroup from '../checkbox-group/CheckboxGroup.svelte'
  import DatePicker from '../date-picker/DatePicker.svelte'
  import Field from '../field/Field.svelte'
  import Input from '../input/Input.svelte'
  import NumberField from '../number-field/NumberField.svelte'
  import Select from '../select/Select.svelte'
  import { untrack } from 'svelte'

  type Words = { locale?: string; apply?: string; clear?: string; column?: string; from?: string; to?: string; contains?: string }
  type Props = {
    columns: ColumnDef[]
    /** The column being edited; absent, the editor starts by asking which. */
    column?: ColumnDef
    filter?: Filter
    onApply: (column: ColumnDef, draft: FilterDraft) => void
    words?: Words
    parts: { editorProps: object; editorFieldsProps: object; editorActionsProps: object }
  }

  let { columns, column: fixed, filter, onApply, words = {}, parts }: Props = $props()

  let columnId = $state(untrack(() => fixed?.id ?? columns[0]?.id))
  const column = $derived(fixed ?? columns.find((candidate) => candidate.id === columnId))
  let draft = $state<FilterDraft | undefined>(untrack(() => (column ? draftFor(column, filter) : undefined)))
  const current = $derived(draft && column && draft.kind === filterKindOf(column) ? draft : column ? draftFor(column) : undefined)
  const options = $derived(column ? setOptions(column) : [])
  const change = (patch: Partial<FilterDraft>) => {
    if (current) draft = { ...current, ...patch }
  }

  const submit = (event: SubmitEvent) => {
    event.preventDefault()
    if (column && current) onApply(column, current)
  }
</script>

<form {...parts.editorProps} onsubmit={submit}>
  <div {...parts.editorFieldsProps}>
    {#if !fixed}
      <Select
        label={words.column ?? 'Column'}
        items={columns.map((candidate) => ({ value: candidate.id, label: candidate.header }))}
        value={columnId ?? null}
        onValueChange={(value) => {
          columnId = value ?? undefined
          const next = columns.find((candidate) => candidate.id === value)
          draft = next ? draftFor(next) : undefined
        }}
      />
    {/if}
    {#if column && current?.kind === 'text'}
      <Field label={words.contains ?? `${column.header} contains`}>
        <Input value={current.text} onValueChange={(text: string) => change({ text })} />
      </Field>
    {:else if column && current?.kind === 'set'}
      <CheckboxGroup
        label={column.header}
        items={options.map((option) => ({ value: String(option.value), label: option.label }))}
        value={current.values.map(String)}
        onValueChange={(values: string[]) =>
          change({ values: options.filter((option) => values.includes(String(option.value))).map((option) => option.value) })}
      />
    {:else if column && current?.kind === 'range'}
      <Field label={`${column.header}, ${words.from ?? 'from'}`}>
        <NumberField value={current.min} onValueChange={(min: number | null) => change({ min })} />
      </Field>
      <Field label={`${column.header}, ${words.to ?? 'to'}`}>
        <NumberField value={current.max} onValueChange={(max: number | null) => change({ max })} />
      </Field>
    {:else if column && current?.kind === 'date'}
      <!-- Two days, not one range: either end may stay open — "from 1 Sep", "up to 30 Sep". -->
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
    {/if}
  </div>
  <div {...parts.editorActionsProps}>
    <Button type="button" emphasis="minimal" size="sm" onclick={() => column && onApply(column, draftFor(column))}>
      {words.clear ?? 'Clear'}
    </Button>
    <Button type="submit" emphasis="high" size="sm">{words.apply ?? 'Apply'}</Button>
  </div>
</form>
