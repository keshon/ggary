import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Combobox as Primitive } from '@base-ui/react/combobox'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { mergeProps } from '@base-ui/react/merge-props'
import { type ControlSize } from '@ggary/core'
import { filterItems, type ComboboxItem, type ComboboxLoad, type ComboboxWords } from '@ggary/core/combobox'
import { useFormReset } from '../../utils/use-form-reset'
import { useFieldControl, useFieldComposition } from '../field/Field'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { useFormField } from '../form/Form'
import { useConfig, useConfigured } from '../config-provider'

export interface ComboboxProps {
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
  label?: string
  /** The options, filtered in the page as the person types. */
  items?: ComboboxItem[]
  /** Or a server that answers a query. Takes precedence over `items`. */
  load?: ComboboxLoad
  /** How long the typing pauses before `load` is asked, in ms. Default 200. */
  debounce?: number
  /** Fewer characters ask nothing. Default 0: an empty field shows suggestions. */
  minLength?: number
  /** Several values, as chips in the field. */
  multiple?: boolean
  /** Controlled. A single combobox takes a string; omit and use `defaultValue` for uncontrolled. */
  value?: string | string[] | null
  defaultValue?: string | string[] | null
  /** The chosen items' labels, when `load` knows them and `items` does not. */
  selectedItems?: ComboboxItem[]
  onValueChange?: (value: string[], items: ComboboxItem[]) => void
  /**
   * Typed text that matches no option can be created: "Create …" ends the
   * list. Return the new option (or a promise of it) and it is chosen; add it
   * to `items` to keep it. A rejection says why.
   */
  onCreate?: (text: string) => ComboboxItem | void | Promise<ComboboxItem | void>
  placeholder?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  /** How many options are drawn at once. Default 50. */
  limit?: number
  name?: string
  words?: ComboboxWords
}

const part = (name: string) => ({ 'data-scope': 'combobox', 'data-part': name, 'data-backend': 'base-ui' })
const values = (value: string | string[] | null | undefined) => value == null ? [] : Array.isArray(value) ? value : [value]
const CREATE = '\u0000create'
const EMPTY: ComboboxItem[] = []

/** Base UI owns interaction; GGary retains ranked/remote search and creation. */
export function Combobox(props: ComboboxProps) {
  const { size = 'md', label, items = EMPTY, load, debounce = 200, minLength = 0, multiple = false,
    value, defaultValue, selectedItems = EMPTY, onValueChange, onCreate, placeholder, disabled: ownDisabled, required: ownRequired, readOnly: ownReadOnly,
    limit = 50, name: ownName, words = {} } = useConfigured(props, { size: true, words: 'combobox' })
  const config = useConfig()
  const id = `gg-base-combobox-${useId().replace(/:/g, '')}`
  const field = useFieldControl()
  const composition = useFieldComposition()
  const group = useFieldsetGroup()
  const name = composition?.name ?? ownName
  const disabled = Boolean(ownDisabled || field?.disabled || group?.disabled)
  const required = Boolean(ownRequired || field?.required)
  const readOnly = Boolean(ownReadOnly || field?.readOnly)
  const inputId = (field?.id as string | undefined) ?? `${id}-input`
  // Required belongs to Base UI's canonical selection input, never search text.
  const { required: _fieldRequired, ...inputMetadata } = field ?? {}
  // Base UI's multiple-selection constraint input is intentionally nameless.
  // Associate it with the visible control for GGary summary/focus ownership.
  const constraintRef = useCallback((element: HTMLInputElement | null) => {
    element?.setAttribute('data-gg-control-id', inputId)
  }, [inputId])
  const input = useRef<HTMLInputElement>(null)
  const control = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const [local, setLocal] = useState(() => values(defaultValue))
  const chosen = value === undefined ? local : values(value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [typing, setTyping] = useState(false)
  const [remote, setRemote] = useState<{ items: ComboboxItem[]; total: number }>({ items: [], total: 0 })
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const labels = useRef(new Map<string, ComboboxItem>())
  const lifetime = useRef(0)
  useEffect(() => () => { lifetime.current++ }, [])
  const form = useFormField(composition?.name ? undefined : name, inputId, label)
  const close = useCallback(() => { setOpen(false); setTyping(false); setQuery('') }, [])
  useEffect(() => {
    if (disabled || readOnly) { lifetime.current++; setCreating(null); close() }
  }, [disabled, readOnly, close])
  useFormReset(input, () => {
    lifetime.current++; setCreating(null); setCreateError(null)
    if (value === undefined) setLocal(values(defaultValue))
    close()
  })

  // Abort on query/loader changes, closure and unmount. Ignore servers that ignore abort.
  const search = typing ? query : ''
  useEffect(() => {
    if (!load || !open || disabled) return
    const controller = new AbortController()
    if (search.trim().length < minLength) {
      setRemote({ items: [], total: 0 }); setStatus('idle')
      return () => controller.abort()
    }
    const timer = setTimeout(() => {
      setStatus('loading'); setError('')
      Promise.resolve().then(() => load(search, controller.signal)).then(answer => {
        if (controller.signal.aborted) return
        const result = Array.isArray(answer) ? { items: answer, total: answer.length } : { items: answer.items, total: answer.total ?? answer.items.length }
        setRemote(result); setStatus('idle')
      }, reason => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : String(reason)); setStatus('error')
      })
    }, search === '' ? 0 : debounce)
    return () => { clearTimeout(timer); controller.abort() }
  }, [load, open, disabled, search, debounce, minLength])
  const matches = useMemo(() => load
    ? { items: remote.items.slice(0, Math.max(0, limit)), total: remote.total }
    : filterItems(items, search, Math.max(0, limit)), [load, remote, items, search, limit])
  const text = query.trim()
  const offer = !disabled && !readOnly && !!onCreate && typing && !!text && !matches.items.some(item => item.label.localeCompare(text, config.locale, { sensitivity: 'base' }) === 0)
  const shown = useMemo(() => offer ? [...matches.items, { value: CREATE, label: text, create: true as const }] : matches.items, [matches.items, offer, text])
  const itemValues = useMemo(() => shown.map(item => item.value), [shown])
  // Cache only selected labels, rather than every result of every remote query.
  const known = (entry: string) => selectedItems.find(item => item.value === entry)
    ?? items.find(item => item.value === entry) ?? remote.items.find(item => item.value === entry)
    ?? labels.current.get(entry) ?? { value: entry, label: entry }
  const selected = chosen.map(known)
  for (const item of selected) labels.current.set(item.value, item)
  for (const entry of labels.current.keys()) if (!chosen.includes(entry)) labels.current.delete(entry)
  const commit = (next: string[], newItems?: ComboboxItem[]) => {
    if (disabled || readOnly) return
    for (const item of newItems ?? []) labels.current.set(item.value, item)
    if (value === undefined) setLocal(next)
    onValueChange?.(next, next.map(known))
    if (composition?.name) composition.edited()
    else form.edited(input.current)
  }
  const latest = useRef({ chosen, multiple, commit })
  latest.current = { chosen, multiple, commit }
  const select = (next: string | string[] | null, details: Primitive.Root.ChangeEventDetails) => {
    if (disabled || readOnly) { details.cancel(); return }
    // Erasing a search is not erasing the committed choice. Clear is explicit.
    if (details.reason === 'input-clear') { details.cancel(); return }
    const entries = values(next)
    if (entries.includes(CREATE)) {
      details.cancel()
      if (creating !== null || !onCreate) return
      const generation = lifetime.current
      setCreating(text); setCreateError(null)
      Promise.resolve().then(() => onCreate(text)).then(item => {
        if (generation !== lifetime.current) return
        setCreating(null)
        if (!item) return
        const owner = latest.current
        owner.commit(owner.multiple ? [...owner.chosen.filter(entry => entry !== item.value), item.value] : [item.value], [item])
        setQuery(''); setTyping(false)
        if (!owner.multiple) close()
      }, reason => {
        if (generation !== lifetime.current) return
        setCreating(null); setCreateError(reason instanceof Error ? reason.message : String(reason))
      })
      return
    }
    commit(entries)
    if (details.reason === 'item-press') { setQuery(''); setTyping(false) }
  }
  const format = (n: number) => n.toLocaleString(config.locale)
  const statusText = creating !== null ? (words.creating ?? (s => `Creating “${s}”…`))(creating)
    : createError !== null ? (words.createFailed ?? (s => `Could not create: ${s}`))(createError)
    : status === 'error' ? (words.failed ?? (s => `Could not search: ${s}`))(error)
    : !open ? '' : status === 'loading' && !shown.length ? words.searching ?? 'Searching…'
    : offer && !matches.total ? (words.createHint ?? (s => `Nothing matches. Enter creates “${s}”.`))(text)
    : !shown.length ? words.empty ?? 'No matches'
    : (words.results ?? (n => `${format(n)} ${n === 1 ? 'result' : 'results'}`))(matches.total)
  const more = matches.total > matches.items.length && matches.items.length > 0
    ? (words.more ?? ((a, b) => `Showing ${format(a)} of ${format(b)} — type to narrow`))(matches.items.length, matches.total) : ''
  const [environment, setEnvironment] = useState<{ container?: HTMLElement; style: CSSProperties; dir?: 'ltr' | 'rtl' }>({ style: {} })
  useLayoutEffect(() => {
    if (!open || !root.current) return
    const computed = getComputedStyle(root.current)
    const style: Record<string, string> = {}
    for (const key of Array.from(computed)) if (key.startsWith('--')) style[key] = computed.getPropertyValue(key)
    setEnvironment({ style: style as CSSProperties, dir: computed.direction === 'rtl' ? 'rtl' : 'ltr',
      container: root.current.closest<HTMLElement>('[data-backend="base-ui"]:is([data-scope="dialog"][data-part="layer"], [data-scope="popover"][data-part="positioner"])') ?? undefined })
  }, [open, config.mode, config.dir, config.locale])
  const state = open ? 'open' : 'closed'
  return <DirectionProvider direction={config.dir ?? 'ltr'}>
    <Primitive.Root<string, boolean> multiple={multiple} value={multiple ? chosen : chosen[0] ?? null}
      onValueChange={select} items={itemValues} filteredItems={itemValues} autoHighlight
      itemToStringLabel={entry => shown.find(item => item.value === entry)?.label ?? labels.current.get(entry)?.label ?? entry}
      inputValue={typing || multiple ? query : selected[0]?.label ?? ''} disabled={disabled} readOnly={readOnly} required={required} name={name} inputRef={constraintRef} modal={false}
      open={open} onOpenChange={(next, details) => {
        if (!next && multiple && details.reason === 'item-press') { details.cancel(); return }
        next ? setOpen(true) : close()
      }}
      onInputValueChange={(next, details) => {
        if (disabled || readOnly) return
        if (details.reason === 'input-change') { setQuery(next); setTyping(true); setOpen(true); setCreateError(null) }
        else if (details.reason === 'input-clear' || details.reason === 'clear-press') { setQuery(''); setTyping(false) }
      }}>
      <div ref={root} {...part('root')} id={id} data-size={size} data-state={state} data-multiple={multiple ? '' : undefined} data-disabled={disabled ? '' : undefined}>
        {label && !field && <label {...part('label')} id={`${id}-label`} htmlFor={inputId} data-disabled={disabled ? '' : undefined}>{label}</label>}
        <Primitive.InputGroup ref={control} {...part('control')} data-state={state} data-disabled={disabled ? '' : undefined}>
          <div data-scope="combobox" data-part="editor">
          {multiple && selected.map(item => <span key={item.value} {...part('chip')} data-value={item.value}>
            <span {...part('chip-text')}>{item.label}</span>
            <button {...part('chip-remove')} type="button" tabIndex={-1} disabled={disabled || readOnly}
              aria-label={(words.remove ?? (s => `Remove ${s}`))(item.label)} onPointerDown={event => event.preventDefault()}
              onClick={() => { commit(chosen.filter(entry => entry !== item.value)); input.current?.focus() }}>
              <span {...part('chip-remove-icon')} aria-hidden="true" data-icon="close" />
            </button>
          </span>)}
          <Primitive.Input ref={input} {...part('input')} {...mergeProps(form.field.controlProps, inputMetadata, {
            id: inputId, 'aria-describedby': [field?.['aria-describedby'], form.field.controlProps['aria-describedby'], `${id}-status`].filter(Boolean).join(' '), 'aria-busy': status === 'loading' || creating !== null ? true : undefined,
            placeholder: multiple && chosen.length ? undefined : placeholder ?? words.placeholder, spellCheck: false,
          })} disabled={disabled} readOnly={readOnly} onBlur={close} onKeyDown={event => {
            if (event.nativeEvent.isComposing || disabled || readOnly) return
            if (event.key === 'Backspace' && multiple && !query && chosen.length) {
              event.preventDefault(); commit(chosen.slice(0, -1))
            }
          }} />
          </div>
          <div data-scope="combobox" data-part="actions">
          <Primitive.Clear {...part('clear')} tabIndex={-1} aria-label={words.clear ?? 'Clear'}>
            <span {...part('clear-icon')} data-icon="close" aria-hidden="true" />
          </Primitive.Clear>
          <Primitive.Trigger {...part('trigger')} tabIndex={-1} aria-label="Show options" data-state={state}>
            <span {...part('trigger-icon')} data-icon="chevron-down" aria-hidden="true" />
          </Primitive.Trigger>
          </div>
        </Primitive.InputGroup>
        {!composition?.name && <span {...form.field.errorProps}>{form.error}</span>}
        <span {...part('status')} id={`${id}-status`} role="status" aria-live="polite">{statusText}</span>
      </div>
      <Primitive.Portal keepMounted container={environment.container}>
        <Primitive.Positioner {...part('positioner')} data-state={state} positionMethod="fixed" anchor={control} sideOffset={4}
          data-mode={config.mode} dir={environment.dir} lang={config.locale}
          style={{ ...environment.style, width: 'var(--anchor-width)', '--gg-available-height': 'var(--available-height, 320px)' } as CSSProperties}>
          <Primitive.Popup finalFocus={input}>
            <Primitive.List {...part('content')} id={`${id}-content`} aria-labelledby={field?.['aria-labelledby'] as string | undefined ?? (label ? `${id}-label` : undefined)}
              data-state={state} data-stale={status === 'loading' && shown.length ? '' : undefined} aria-busy={status === 'loading'}>
              {!shown.length && <div {...part('empty')} data-status={status}>{status === 'error' ? statusText : status === 'loading' ? words.searching ?? 'Searching…' : words.empty ?? 'No matches'}</div>}
              {shown.map(item => <Primitive.Item key={item.value} value={item.value} disabled={item.disabled || (item.create && creating !== null)}
                {...part('item')} data-value={item.value} data-selected={chosen.includes(item.value) ? '' : undefined} data-create={item.create ? '' : undefined}
                onPointerDown={event => event.preventDefault()}>
                <span {...part('item-text')}>{item.create ? (words.create ?? (s => `Create “${s}”`))(item.label) : item.label}</span>
                {item.description && <span {...part('item-description')}>{item.description}</span>}
                <Primitive.ItemIndicator keepMounted {...part('item-indicator')} data-icon="check" aria-hidden="true">{''}</Primitive.ItemIndicator>
              </Primitive.Item>)}
              {more && <div {...part('more')} aria-hidden="true">{more}</div>}
            </Primitive.List>
          </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </Primitive.Root>
  </DirectionProvider>
}
