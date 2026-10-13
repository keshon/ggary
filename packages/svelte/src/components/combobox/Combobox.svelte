<script lang="ts">
  import { Combobox as Primitive, mergeProps } from 'bits-ui'
  import { untrack } from 'svelte'
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { filterItems, type ComboboxItem, type ComboboxLoad, type ComboboxWords } from '@ggary/core/combobox'
  import { onFormReset, type ControlSize } from '@ggary/core'
  import { useFormField } from '../form/context.svelte'

  type Props = {
    /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
    size?: ControlSize
    label?: string
    /** The options, filtered in the page as the person types. */
    items?: ComboboxItem[]
    /** Or a server that answers a query. Takes precedence over `items`. */
    load?: ComboboxLoad
    debounce?: number
    minLength?: number
    multiple?: boolean
    /** Bindable: `bind:value`. A single combobox holds a string, a multiple one a list. */
    value?: string | string[] | null
    defaultValue?: string | string[] | null
    selectedItems?: ComboboxItem[]
    onValueChange?: (value: string[], items: ComboboxItem[]) => void
    /** Typed text that matches no option can be created: "Create …" ends the list. Return the new option and it is chosen. */
    onCreate?: (text: string) => ComboboxItem | void | Promise<ComboboxItem | void>
    placeholder?: string
    disabled?: boolean
    limit?: number
    name?: string
    /** Fill the available inline space. Standalone controls otherwise use the theme's stable field width. */
    fullWidth?: boolean
    words?: ComboboxWords
  }

  let { size: ownSize, label, items = [], load, debounce = 200, minLength = 0,
    multiple = false, value = $bindable(), defaultValue, selectedItems = [], onValueChange,
    onCreate, placeholder, disabled = false, fullWidth, limit = 50, name, words: ownWords }: Props = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size ?? 'md')
  const words = $derived(configWords(kit(), 'combobox', ownWords) ?? {})
  const componentId = $props.id()
  const id = `gg-bits-combobox-${componentId}`
  const values = (entry: string | string[] | null | undefined): string[] => entry == null ? [] : Array.isArray(entry) ? entry : [entry]
  const initial = untrack(() => values(value !== undefined ? value : defaultValue))
  let local = $state(initial)
  const chosen = $derived(value !== undefined ? values(value) : local)
  let cached = $state.raw(untrack(() => new Map([...items, ...selectedItems].filter(item => initial.includes(item.value)).map(item => [item.value, item]))))
  let isOpen = $state(false)
  let query = $state('')
  let typing = $state(false)
  let remote = $state<{ items: ComboboxItem[]; total: number }>({ items: [], total: 0 })
  let status = $state<'idle' | 'loading' | 'error'>('idle')
  let error = $state('')
  let creating = $state<string | null>(null)
  let createError = $state<string | null>(null)
  let generation = 0
  const search = $derived(typing ? query : '')
  const matches = $derived(load ? { items: remote.items.slice(0, Math.max(0, limit)), total: remote.total } : filterItems(items, search, Math.max(0, limit)))
  const text = $derived(query.trim())
  const offer = $derived(!disabled && !!onCreate && typing && !!text && !matches.items.some(item => item.label.localeCompare(text, kit().locale, { sensitivity: 'base' }) === 0))
  const CREATE = 'create'
  const shown = $derived(offer ? [...matches.items, { value: CREATE, label: text, create: true as const }] : matches.items)
  const encoded = $derived(chosen.map(entry => `item:${entry}`))
  const bitsItems = $derived(shown.map(item => ({ ...item, value: item.create ? CREATE : `item:${item.value}` })))
  const known = (entry: string): ComboboxItem => selectedItems.find(item => item.value === entry)
    ?? items.find(item => item.value === entry) ?? remote.items.find(item => item.value === entry)
    ?? cached.get(entry) ?? { value: entry, label: entry }
  const selected = $derived(chosen.map(known))
  const inputText = $derived(typing || multiple ? query : selected[0]?.label ?? '')
  const form = useFormField(() => name, () => `${id}-input`, () => label)
  let inputEl = $state<HTMLInputElement | null>(null)
  let controlEl = $state<HTMLDivElement | null>(null)
  function close() { isOpen = false; if (status === 'loading') status = 'idle'; query = ''; typing = false }
  function commit(next: string[], created?: ComboboxItem) {
    if (disabled) return
    const cache = new Map(next.map(entry => [entry, created?.value === entry ? created : known(entry)]))
    cached = cache; local = next; value = multiple ? next : (next[0] ?? null)
    onValueChange?.(next, next.map(entry => cache.get(entry)!))
    form.edited()
  }
  function choose(entries: string[]) {
    if (disabled) return
    if (entries.includes(CREATE)) {
      if (creating !== null || !onCreate) return
      const current = generation; const requested = text; const create = onCreate
      creating = requested; createError = null
      Promise.resolve().then(() => create(requested)).then(item => {
        if (current !== generation) return
        creating = null
        if (!item) return
        commit(multiple ? [...chosen.filter(entry => entry !== item.value), item.value] : [item.value], item)
        query = ''; typing = false
        if (!multiple) close()
      }, reason => { if (current !== generation) return; creating = null; createError = reason instanceof Error ? reason.message : String(reason) })
      return
    }
    commit(entries.map(entry => entry.slice(5)))
    query = ''; typing = false
    if (!multiple) close()
  }
  function changedOpen(next: boolean) { if (disabled) return; if (next) isOpen = true; else close() }
  function edited(event: Event) {
    if (disabled) return
    query = (event.currentTarget as HTMLInputElement).value
    typing = true; isOpen = true; createError = null
  }
  function clear() { if (chosen.length) commit([]); query = ''; typing = false; inputEl?.focus() }
  $effect(() => { if (disabled) { generation++; creating = null; close() } })
  $effect(() => () => { generation++ })
  $effect(() => onFormReset(inputEl, () => {
    generation++; creating = null; createError = null; local = initial
    value = multiple ? [...initial] : initial[0] ?? null; close()
  }))
  $effect(() => {
    const loader = load; const currentQuery = search
    if (!loader || !isOpen || disabled) return
    const controller = new AbortController()
    if (currentQuery.trim().length < minLength) {
      remote = { items: [], total: 0 }; status = 'idle'
      return () => controller.abort()
    }
    const delay = currentQuery === '' ? 0 : debounce
    const timer = setTimeout(() => {
      status = 'loading'; error = ''
      Promise.resolve().then(() => loader(currentQuery, controller.signal)).then(answer => {
        if (controller.signal.aborted || !isOpen || disabled || search !== currentQuery) return
        remote = Array.isArray(answer) ? { items: answer, total: answer.length } : { items: answer.items, total: answer.total ?? answer.items.length }
        status = 'idle'
      }, reason => { if (controller.signal.aborted || !isOpen || disabled || search !== currentQuery) return; error = reason instanceof Error ? reason.message : String(reason); status = 'error' })
    }, delay)
    return () => { clearTimeout(timer); controller.abort() }
  })
  $effect(() => {
    const entries = chosen
    untrack(() => { if ([...cached.keys()].some(key => !entries.includes(key))) cached = new Map([...cached].filter(([key]) => entries.includes(key))) })
  })
  const format = (n: number) => n.toLocaleString(kit().locale)
  const statusText = $derived(creating !== null ? (words.creating ?? (s => `Creating “${s}”…`))(creating)
    : createError !== null ? (words.createFailed ?? (s => `Could not create: ${s}`))(createError)
    : status === 'error' ? (words.failed ?? (s => `Could not search: ${s}`))(error)
    : !isOpen ? '' : status === 'loading' && !shown.length ? words.searching ?? 'Searching…'
    : offer && !matches.total ? (words.createHint ?? (s => `Nothing matches. Enter creates “${s}”.`))(text)
    : !shown.length ? words.empty ?? 'No matches'
    : (words.results ?? (n => `${format(n)} ${n === 1 ? 'result' : 'results'}`))(matches.total))
  const moreText = $derived(matches.total > matches.items.length && matches.items.length ? (words.more ?? ((a, b) => `Showing ${format(a)} of ${format(b)} — type to narrow`))(matches.items.length, matches.total) : '')
  const part = (name: string) => ({ 'data-scope': 'combobox', 'data-part': name, 'data-backend': 'bits-ui' })
  let inheritedStyle = $state('')
  let inheritedDir = $state<'ltr' | 'rtl'>('ltr')
  $effect(() => {
    if (!isOpen || !controlEl) return
    const computed = getComputedStyle(controlEl)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    inheritedDir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${inheritedDir};${vars.join(';')}`
  })
</script>

{#snippet control()}
<div {...part('root')} data-size={size} data-state={isOpen ? 'open' : 'closed'} data-multiple={multiple ? '' : undefined} data-disabled={disabled ? '' : undefined} data-full-width={fullWidth ? '' : undefined}>
  {#if label}<label {...part('label')} id={`${id}-label`} for={`${id}-input`} data-disabled={disabled ? '' : undefined}>{label}</label>{/if}
  <div {...part('control')} bind:this={controlEl}
    onpointerdown={event => { if (!(event.target as Element).closest('input, button') && !disabled) { event.preventDefault(); inputEl?.focus(); isOpen = true } }}
    data-state={isOpen ? 'open' : 'closed'} data-disabled={disabled ? '' : undefined}>
    <div data-scope="combobox" data-part="editor">
    {#if multiple}
      {#each selected as item (item.value)}
        <span {...part('chip')} data-value={item.value}>
          <span {...part('chip-text')}>{item.label}</span>
          <button {...part('chip-remove')} type="button" tabindex={-1} {disabled} aria-label={(words.remove ?? (s => `Remove ${s}`))(item.label)}
            onpointerdown={event => event.preventDefault()} onclick={() => { commit(chosen.filter(entry => entry !== item.value)); inputEl?.focus() }}>
            <span {...part('chip-remove-icon')} data-icon="close" aria-hidden="true"></span>
          </button>
        </span>
      {/each}
    {/if}
    <Primitive.Input {...part('input')} id={`${id}-input`} bind:ref={inputEl}
      placeholder={multiple && chosen.length ? undefined : placeholder ?? words.placeholder}
      aria-labelledby={label ? `${id}-label` : undefined} aria-controls={isOpen ? `${id}-content` : undefined}
      aria-invalid={form.error ? 'true' : undefined} aria-describedby={[form.field.controlProps['aria-describedby'], `${id}-status`].filter(Boolean).join(' ')}
      aria-busy={status === 'loading' || creating !== null ? 'true' : undefined} spellcheck={false} autocomplete="off"
      oninput={edited} onblur={close} onclick={() => { if (!disabled) isOpen = true }}
      onkeydown={event => { if (!event.isComposing && !disabled && event.key === 'Backspace' && multiple && !query && chosen.length) { event.preventDefault(); commit(chosen.slice(0, -1)) } }}>
      {#snippet child({ props: inputProps })}<input {...inputProps} value={inputText} />{/snippet}
    </Primitive.Input>
    </div>
    <div data-scope="combobox" data-part="actions">
    <button {...part('clear')} type="button" tabindex={-1} aria-label={words.clear ?? 'Clear'} {disabled} hidden={!chosen.length && !query}
      onpointerdown={event => event.preventDefault()} onclick={clear}><span {...part('clear-icon')} data-icon="close" aria-hidden="true"></span></button>
    <Primitive.Trigger {...part('trigger')} type="button" tabindex={-1} aria-label="Show options"><span {...part('trigger-icon')} data-icon="chevron-down" aria-hidden="true"></span></Primitive.Trigger>
    </div>
  </div>
  <span {...form.field.errorProps}>{form.error}</span>
  <span {...part('status')} id={`${id}-status`} role="status" aria-live="polite">{statusText}</span>
  {#if name}{#each chosen as entry (entry)}<input type="hidden" {name} value={entry} {disabled} data-scope="combobox" data-part="hidden-input" />{/each}{/if}
</div>
<Primitive.Portal>
  <Primitive.Content id={`${id}-content`} strategy="fixed" dir={inheritedDir} style={inheritedStyle} sideOffset={4} align="start" customAnchor={controlEl}>
    {#snippet child({ props: contentProps, wrapperProps })}
      <div {...wrapperProps} {...part('positioner')} data-state={isOpen ? 'open' : 'closed'}>
        <div {...mergeProps(contentProps, part('content'), { style: { '--gg-anchor-width': 'var(--bits-floating-anchor-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })} aria-labelledby={label ? `${id}-label` : undefined}>
          {#if !shown.length}<div {...part('empty')} data-status={status}>{status === 'error' ? statusText : status === 'loading' ? words.searching ?? 'Searching…' : words.empty ?? 'No matches'}</div>{/if}
          {#each shown as item (item.create ? CREATE : `item:${item.value}`)}
            <Primitive.Item {...part('item')} value={item.create ? CREATE : `item:${item.value}`} label={item.label}
              disabled={item.disabled || (item.create && creating !== null)} aria-disabled={item.disabled ? 'true' : undefined} data-value={item.value} data-create={item.create ? '' : undefined}>
              <span {...part('item-text')}>{item.create ? (words.create ?? (s => `Create “${s}”`))(item.label) : item.label}</span>
              {#if item.description}<span {...part('item-description')}>{item.description}</span>{/if}
              <span {...part('item-indicator')} data-icon="check" aria-hidden="true"></span>
            </Primitive.Item>
          {/each}
          {#if moreText}<div {...part('more')} aria-hidden="true">{moreText}</div>{/if}
        </div>
      </div>
    {/snippet}
  </Primitive.Content>
</Primitive.Portal>
{/snippet}

{#if multiple}
  <Primitive.Root type="multiple" bind:value={() => encoded, entries => choose(entries)} open={isOpen} onOpenChange={changedOpen}
    inputValue={inputText} items={bitsItems} {disabled} loop allowDeselect={false}>{@render control()}</Primitive.Root>
{:else}
  <Primitive.Root type="single" bind:value={() => encoded[0] ?? '', entry => choose(entry ? [entry] : [])} open={isOpen} onOpenChange={changedOpen}
    inputValue={inputText} items={bitsItems} {disabled} loop allowDeselect={false}>{@render control()}</Primitive.Root>
{/if}
